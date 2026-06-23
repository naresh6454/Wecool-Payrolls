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

  // Find or create payroll run — uploadId is unique on PayrollRun
  let payrollRun = await prisma.payrollRun.findFirst({ where: { payrollMonth: upload.payrollMonth } });
  const isFirstRun = !payrollRun; // only accrue leave on first run, not recalculations
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

  // Reverse leave balance changes for DRAFT records before deleting them
  // so recalculation doesn't double-deduct auto-converted leave days.
  // Use absolute value (not decrement) to prevent going negative.
  if (!isFirstRun) {
    const draftRecords = await prisma.payrollRecord.findMany({
      where: { payrollRunId: payrollRun.id, status: "DRAFT" },
      select: { employeeId: true, paidLeaveDays: true },
    });
    const leaveYearForReversal = new Date(upload.periodEnd).getFullYear();
    for (const rec of draftRecords) {
      const lb = await prisma.leaveBalance.findFirst({
        where: { employeeId: rec.employeeId, year: leaveYearForReversal, leaveType: "LEAVE" },
      });
      if (lb && Number(rec.paidLeaveDays) > 0) {
        await prisma.leaveBalance.update({
          where: { id: lb.id },
          data: { used: Math.max(0, Number(lb.used) - Number(rec.paidLeaveDays)) },
        });
      }
    }
  }

  // Delete all DRAFT records for a clean recalculation (APPROVED remain locked)
  await prisma.payrollRecord.deleteMany({
    where: { payrollRunId: payrollRun.id, status: "DRAFT" },
  });

  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    include: {
      salaryStructures: { where: { isActive: true }, take: 1 },
      attendanceRecords: {
        where: { attendanceDate: { gte: upload.periodStart, lte: upload.periodEnd } },
        select: { attendanceDate: true, status: true, isLate: true, overtimeHours: true, checkIn: true },
      },
    },
  });

  const approvedEmployees = new Set(
    (await prisma.payrollRecord.findMany({
      where: { payrollRunId: payrollRun.id, status: "APPROVED" },
      select: { employeeId: true },
    })).map(r => r.employeeId)
  );

  const periodCalendarDays = differenceInCalendarDays(upload.periodEnd, upload.periodStart) + 1;
  let newCount = 0;

  for (const emp of employees) {
    const salaryStruct = emp.salaryStructures[0];
    if (!salaryStruct || approvedEmployees.has(emp.id)) continue;

    const monthlySalary = Number(salaryStruct.monthlySalary);
    const leaveYear = new Date(upload.periodEnd).getFullYear();

    // Accrue 1.33 leave days — only on first run for this month, not on recalculations
    let leaveBalance = await prisma.leaveBalance.findFirst({
      where: { employeeId: emp.id, year: leaveYear, leaveType: "LEAVE" },
    });
    if (isFirstRun) {
      if (leaveBalance) {
        leaveBalance = await prisma.leaveBalance.update({
          where: { id: leaveBalance.id },
          data: { totalAllocated: { increment: 1.33 } },
        });
      } else {
        leaveBalance = await prisma.leaveBalance.create({
          data: { employeeId: emp.id, year: leaveYear, leaveType: "LEAVE", totalAllocated: 1.33, used: 0 },
        });
      }
    }

    const explicitLeaveDays = emp.attendanceRecords.filter(r => r.status === "LEAVE").length;

    const enrichedRecords = emp.attendanceRecords.map(r => ({
      ...r,
      calendarDayType: calendarMap.get(toUTCKey(r.attendanceDate)) ?? null,
    }));

    // Inject synthetic records for calendar holidays with no device record
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

    // Auto-convert LOP days to paid leave if employee has sufficient leave balance
    const availableBalance = leaveBalance
      ? Math.max(0, Number(leaveBalance.totalAllocated) - Number(leaveBalance.used))
      : 0;
    const lopCandidates = rawSummary.lopDays;
    const daysToConvertFromBalance = Math.min(lopCandidates, availableBalance);

    // Deduct auto-converted days from leave balance
    if (daysToConvertFromBalance > 0 && leaveBalance) {
      await prisma.leaveBalance.update({
        where: { id: leaveBalance.id },
        data: { used: { increment: daysToConvertFromBalance } },
      });
    }

    const summary = {
      ...rawSummary,
      paidLeaveDays: rawSummary.paidLeaveDays + daysToConvertFromBalance,
      lopDays: Math.max(0, rawSummary.lopDays - daysToConvertFromBalance),
    };

    const breakdown = calculateSalary(monthlySalary, summary, emp.employeeType as "OFFICE" | "WAREHOUSE", settings);

    await prisma.payrollRecord.create({
      data: {
        payrollRunId: payrollRun.id,
        employeeId: emp.id,
        monthlySalary: breakdown.monthlySalary,
        perDaySalary: breakdown.perDaySalary,
        totalDays: recordedDays,
        presentDays: summary.presentDays,
        absentDays: rawSummary.lopDays, // raw LOP candidates before leave balance auto-conversion
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
      },
    });
    newCount++;
  }

  const allRecords = await prisma.payrollRecord.findMany({
    where: { payrollRunId: payrollRun.id },
    select: { grossEarnings: true, totalDeductions: true, netSalary: true },
  });
  const totals = allRecords.reduce(
    (acc, r) => ({ gross: acc.gross + Number(r.grossEarnings), deductions: acc.deductions + Number(r.totalDeductions), net: acc.net + Number(r.netSalary) }),
    { gross: 0, deductions: 0, net: 0 }
  );

  await prisma.payrollRun.update({
    where: { id: payrollRun.id },
    data: { totalGross: totals.gross, totalDeductions: totals.deductions, totalNet: totals.net, totalEmployees: allRecords.length },
  });

  await prisma.attendanceUpload.update({
    where: { id: uploadId },
    data: { status: "PROCESSED", processedAt: new Date() },
  });

  await createAuditLog({
    actorId: initiatorId, actorRole: "HR", action: "PAYROLL_GENERATED",
    entityType: "payroll_run", entityId: payrollRun.id,
    description: `Payroll generated for ${upload.payrollMonth}. ${newCount} employees. Net: ₹${totals.net.toFixed(2)}`,
  });

  return { payrollRunId: payrollRun.id, totalEmployees: allRecords.length };
}
