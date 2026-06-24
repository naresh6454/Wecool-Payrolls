import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { calculateSalary, buildAttendanceSummary } from "@/lib/payroll-engine";
import { createAuditLog } from "@/lib/audit";
import { differenceInCalendarDays } from "date-fns";

const DEFAULT_SETTINGS = {
  basicPercent: 50, hraPercentOfBasic: 40, fixedConveyance: 1600,
  fixedBonus: 2000, professionalTax: 200, lateFreeCount: 5,
  latePerHalfDay: 2, otWarehouseRate: 1000, minOtHoursForExtraPay: 6,
};

async function getSettings() {
  const rows = await prisma.companySetting.findMany({ where: { category: "PAYROLL" } });
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return {
    basicPercent: Number(map.basic_salary_percent ?? DEFAULT_SETTINGS.basicPercent),
    hraPercentOfBasic: Number(map.hra_percent_of_basic ?? DEFAULT_SETTINGS.hraPercentOfBasic),
    fixedConveyance: Number(map.fixed_conveyance ?? DEFAULT_SETTINGS.fixedConveyance),
    fixedBonus: Number(map.fixed_bonus ?? DEFAULT_SETTINGS.fixedBonus),
    professionalTax: Number(map.professional_tax ?? DEFAULT_SETTINGS.professionalTax),
    lateFreeCount: Number(map.late_free_count ?? DEFAULT_SETTINGS.lateFreeCount),
    latePerHalfDay: Number(map.late_per_half_day ?? DEFAULT_SETTINGS.latePerHalfDay),
    otWarehouseRate: Number(map.ot_warehouse_daily_rate ?? DEFAULT_SETTINGS.otWarehouseRate),
    minOtHoursForExtraPay: Number(map.min_ot_hours_extra_pay ?? DEFAULT_SETTINGS.minOtHoursForExtraPay),
  };
}

const toUTCKey = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

export async function runPayrollProcessing(uploadId: string, initiatorId: string) {
  const upload = await prisma.attendanceUpload.findUnique({ where: { id: uploadId } });
  if (!upload) throw new Error("Upload not found");

  const settings = await getSettings();

  const calendarEntries = await prisma.companyCalendar.findMany({
    where: { date: { gte: upload.periodStart, lte: upload.periodEnd } },
    select: { date: true, status: true },
  });
  const calendarMap = new Map(calendarEntries.map(e => [toUTCKey(e.date), e.status]));

  let payrollRun = await prisma.payrollRun.findFirst({ where: { payrollMonth: upload.payrollMonth } });
  const isFirstRun = !payrollRun;
  if (!payrollRun) {
    payrollRun = await prisma.payrollRun.create({
      data: {
        payrollMonth: upload.payrollMonth,
        periodStart: upload.periodStart,
        periodEnd: upload.periodEnd,
        calendarDays: differenceInCalendarDays(upload.periodEnd, upload.periodStart) + 1,
        uploadId,
        initiatedById: initiatorId,
        status: "UNDER_REVIEW",
      },
    });
  }

  // Fix N+1: batch fetch all leave balances for draft records at once
  if (!isFirstRun) {
    const draftRecords = await prisma.payrollRecord.findMany({
      where: { payrollRunId: payrollRun.id, status: "DRAFT" },
      select: { employeeId: true, paidLeaveDays: true },
    });

    const leaveYearForReversal = new Date(upload.periodEnd).getFullYear();
    const draftEmployeeIds = draftRecords.map(r => r.employeeId);

    // Batch fetch all leave balances in one query
    const leaveBalances = await prisma.leaveBalance.findMany({
      where: { employeeId: { in: draftEmployeeIds }, year: leaveYearForReversal, leaveType: "LEAVE" },
    });
    const lbMap = new Map(leaveBalances.map(lb => [lb.employeeId, lb]));

    // Batch update using Promise.all instead of sequential awaits
    await Promise.all(
      draftRecords
        .filter(rec => Number(rec.paidLeaveDays) > 0 && lbMap.has(rec.employeeId))
        .map(rec => {
          const lb = lbMap.get(rec.employeeId)!;
          return prisma.leaveBalance.update({
            where: { id: lb.id },
            data: { used: Math.max(0, Number(lb.used) - Number(rec.paidLeaveDays)) },
          });
        })
    );
  }

  await prisma.payrollRecord.deleteMany({
    where: { payrollRunId: payrollRun.id, status: "DRAFT" },
  });

  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    include: {
      salaryStructures: { where: { isActive: true }, take: 1, select: { monthlySalary: true } },
      attendanceRecords: {
        where: { attendanceDate: { gte: upload.periodStart, lte: upload.periodEnd } },
        select: { attendanceDate: true, status: true, isLate: true, overtimeHours: true, checkIn: true },
      },
    },
  });

  const approvedEmployeeIds = new Set(
    (await prisma.payrollRecord.findMany({
      where: { payrollRunId: payrollRun.id, status: "APPROVED" },
      select: { employeeId: true },
    })).map(r => r.employeeId)
  );

  const leaveYear = new Date(upload.periodEnd).getFullYear();

  // Fix N+1: batch fetch all leave balances for active employees at once
  const activeEmployeeIds = employees
    .filter(emp => emp.salaryStructures[0] && !approvedEmployeeIds.has(emp.id))
    .map(emp => emp.id);

  const allLeaveBalances = await prisma.leaveBalance.findMany({
    where: { employeeId: { in: activeEmployeeIds }, year: leaveYear, leaveType: "LEAVE" },
  });
  const leaveBalanceMap = new Map(allLeaveBalances.map(lb => [lb.employeeId, lb]));

  // If first run: accrue 1.33 days for all employees in one batch
  if (isFirstRun) {
    const existingEmpIds = new Set(allLeaveBalances.map(lb => lb.employeeId));
    const toUpdate = activeEmployeeIds.filter(id => existingEmpIds.has(id));
    const toCreate = activeEmployeeIds.filter(id => !existingEmpIds.has(id));

    // Batch update existing
    if (toUpdate.length > 0) {
      await Promise.all(
        toUpdate.map(empId => {
          const lb = leaveBalanceMap.get(empId)!;
          return prisma.leaveBalance.update({
            where: { id: lb.id },
            data: { totalAllocated: { increment: 1.33 } },
          });
        })
      );
      // Refresh balances after update
      const updated = await prisma.leaveBalance.findMany({
        where: { employeeId: { in: toUpdate }, year: leaveYear, leaveType: "LEAVE" },
      });
      updated.forEach(lb => leaveBalanceMap.set(lb.employeeId, lb));
    }

    // Batch create missing
    if (toCreate.length > 0) {
      await prisma.leaveBalance.createMany({
        data: toCreate.map(empId => ({
          employeeId: empId,
          year: leaveYear,
          leaveType: "LEAVE" as const,
          totalAllocated: 1.33,
          used: 0,
        })),
      });
      const created = await prisma.leaveBalance.findMany({
        where: { employeeId: { in: toCreate }, year: leaveYear, leaveType: "LEAVE" },
      });
      created.forEach(lb => leaveBalanceMap.set(lb.employeeId, lb));
    }
  }

  const periodCalendarDays = differenceInCalendarDays(upload.periodEnd, upload.periodStart) + 1;
  let newCount = 0;

  // Collect leave balance updates to batch
  const leaveBalanceUpdates: { id: string; increment: number }[] = [];
  const payrollRecordsToCreate: Parameters<typeof prisma.payrollRecord.create>[0]["data"][] = [];

  for (const emp of employees) {
    const salaryStruct = emp.salaryStructures[0];
    if (!salaryStruct || approvedEmployeeIds.has(emp.id)) continue;

    const monthlySalary = Number(salaryStruct.monthlySalary);
    const leaveBalance = leaveBalanceMap.get(emp.id) ?? null;

    const explicitLeaveDays = emp.attendanceRecords.filter(r => r.status === "LEAVE").length;

    const enrichedRecords = emp.attendanceRecords.map(r => ({
      ...r,
      calendarDayType: calendarMap.get(toUTCKey(r.attendanceDate)) ?? null,
    }));

    const attendanceDateKeys = new Set(enrichedRecords.map(r => toUTCKey(r.attendanceDate)));
    for (const [dateKey, calStatus] of calendarMap.entries()) {
      if (calStatus === "COMPANY_HOLIDAY" && !attendanceDateKeys.has(dateKey)) {
        enrichedRecords.push({
          status: "ABSENT",
          isLate: false,
          overtimeHours: new Prisma.Decimal(0),
          checkIn: null,
          attendanceDate: new Date(dateKey + "T00:00:00.000Z"),
          calendarDayType: "COMPANY_HOLIDAY",
        });
      }
    }

    const recordedDays = enrichedRecords.length || periodCalendarDays;
    const rawSummary = buildAttendanceSummary(
      enrichedRecords, recordedDays, explicitLeaveDays,
      emp.employeeType as "OFFICE" | "WAREHOUSE", settings.minOtHoursForExtraPay
    );

    const availableBalance = leaveBalance
      ? Math.max(0, Number(leaveBalance.totalAllocated) - Number(leaveBalance.used))
      : 0;
    const lopCandidates = rawSummary.lopDays;
    const daysToConvertFromBalance = Math.min(lopCandidates, availableBalance);

    if (daysToConvertFromBalance > 0 && leaveBalance) {
      leaveBalanceUpdates.push({ id: leaveBalance.id, increment: daysToConvertFromBalance });
    }

    const summary = {
      ...rawSummary,
      paidLeaveDays: rawSummary.paidLeaveDays + daysToConvertFromBalance,
      lopDays: Math.max(0, rawSummary.lopDays - daysToConvertFromBalance),
    };

    const breakdown = calculateSalary(monthlySalary, summary, emp.employeeType as "OFFICE" | "WAREHOUSE", settings);

    payrollRecordsToCreate.push({
      payrollRunId: payrollRun.id,
      employeeId: emp.id,
      monthlySalary: breakdown.monthlySalary,
      perDaySalary: breakdown.perDaySalary,
      totalDays: recordedDays,
      presentDays: summary.presentDays,
      absentDays: rawSummary.lopDays,
      paidLeaveDays: summary.paidLeaveDays,
      lopDays: summary.lopDays,
      halfDays: summary.halfDays,
      lateCount: summary.lateCount,
      lateDeductionDays: breakdown.lateDeductionDays,
      overtimeDays: summary.overtimeDays,
      weeklyOffDays: summary.weeklyOffDays,
      basicSalary: breakdown.basicSalary,
      hra: breakdown.hra,
      conveyance: breakdown.conveyance,
      bonus: breakdown.bonus,
      specialAllowance: breakdown.specialAllowance,
      grossEarnings: breakdown.grossEarnings,
      overtimeAmount: breakdown.overtimeAmount,
      otAmountPerDay: 0,
      professionalTax: breakdown.professionalTax,
      lopDeduction: breakdown.lopDeduction,
      lateDeduction: breakdown.lateDeduction,
      totalDeductions: breakdown.totalDeductions,
      netSalary: breakdown.netSalary,
      status: "DRAFT",
    });
    newCount++;
  }

  // Batch execute leave balance updates
  await Promise.all(
    leaveBalanceUpdates.map(({ id, increment }) =>
      prisma.leaveBalance.update({ where: { id }, data: { used: { increment } } })
    )
  );

  // Batch create all payroll records
  if (payrollRecordsToCreate.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.payrollRecord.createMany({ data: payrollRecordsToCreate as any });
  }

  // Use aggregation instead of fetch-all + reduce
  const totals = await prisma.payrollRecord.aggregate({
    where: { payrollRunId: payrollRun.id },
    _sum: { grossEarnings: true, totalDeductions: true, netSalary: true },
    _count: { id: true },
  });

  await prisma.payrollRun.update({
    where: { id: payrollRun.id },
    data: {
      totalGross: Number(totals._sum.grossEarnings ?? 0),
      totalDeductions: Number(totals._sum.totalDeductions ?? 0),
      totalNet: Number(totals._sum.netSalary ?? 0),
      totalEmployees: totals._count.id,
    },
  });

  await prisma.attendanceUpload.update({
    where: { id: uploadId },
    data: { status: "PROCESSED", processedAt: new Date() },
  });

  await createAuditLog({
    actorId: initiatorId, actorRole: "HR", action: "PAYROLL_GENERATED",
    entityType: "payroll_run", entityId: payrollRun.id,
    description: `Payroll generated for ${upload.payrollMonth}. ${newCount} employees. Net: ₹${Number(totals._sum.netSalary ?? 0).toFixed(2)}`,
  });

  return { payrollRunId: payrollRun.id, totalEmployees: totals._count.id };
}
