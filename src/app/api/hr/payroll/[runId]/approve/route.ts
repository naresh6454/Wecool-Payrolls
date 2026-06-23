import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { sendPayslipEmail } from "@/lib/email";
import { format } from "date-fns";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const session = await requireAuth("HR");
    const { runId } = await params;

    const run = await prisma.payrollRun.findUnique({
      where: { id: runId },
      include: {
        payrollRecords: {
          include: {
            employee: {
              include: {
                user: { select: { email: true } },
                department: { select: { name: true } },
                designation: { select: { name: true } },
              },
            },
            manualAdjustments: true,
          },
        },
      },
    });

    if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const unapproved = run.payrollRecords.filter(r => r.status !== "APPROVED");
    if (unapproved.length > 0) {
      return NextResponse.json({ error: `${unapproved.length} records are not yet approved` }, { status: 400 });
    }

    await prisma.payrollRun.update({
      where: { id: runId },
      data: { status: "APPROVED", approvedById: session.userId, approvedAt: new Date() },
    });

    let emailsSent = 0;
    let emailsFailed = 0;
    const leaveYear = new Date(run.periodEnd).getFullYear();

    for (const record of run.payrollRecords) {
      const emp = record.employee;

      let adjustedNet = Number(record.netSalary);
      for (const adj of record.manualAdjustments) {
        if (adj.adjustmentType === "ADDITION") adjustedNet += Number(adj.amount);
        else adjustedNet -= Number(adj.amount);
      }

      // Get leave balance for this employee
      const leaveBalance = await prisma.leaveBalance.findFirst({
        where: { employeeId: emp.id, year: leaveYear, leaveType: "LEAVE" },
      });

      const leaveAddition = 1.33;
      const totalAllocated = leaveBalance ? Number(leaveBalance.totalAllocated) : leaveAddition;
      const used = leaveBalance ? Number(leaveBalance.used) : 0;
      const leaveAvailed = Number(record.paidLeaveDays);
      const leaveBalanceNow = totalAllocated - used;
      const leaveTotalTillLastMonth = totalAllocated - leaveAddition; // before this month's accrual but before used
      const leaveBalancePrev = leaveTotalTillLastMonth - (used - leaveAvailed < 0 ? 0 : used - leaveAvailed);

      // NDP = present days + weekly off (paid days)
      const netDaysPresent = Number(record.presentDays) + Number(record.weeklyOffDays);

      // Create payslip record
      const existing = await prisma.payslip.findUnique({ where: { payrollRecordId: record.id } });
      if (!existing) {
        await prisma.payslip.create({
          data: {
            payrollRecordId: record.id,
            employeeId: emp.id,
            payrollRunId: runId,
            filePath: "",
            fileName: `payslip_${emp.employeeCode}_${run.payrollMonth}.pdf`,
            netSalary: adjustedNet,
            generatedById: session.userId,
          },
        });
      }

      const emailResult = await sendPayslipEmail({
        to: emp.user.email,
        employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
        employeeCode: emp.employeeCode,
        payrollMonth: run.payrollMonth,
        dateOfJoining: format(new Date(emp.dateOfJoining), "M/d/yyyy"),
        department: emp.department?.name || "",
        designation: emp.designation?.name || "",
        bankAccountNo: emp.bankAccountNo || "0000",
        panNumber: emp.panNumber || "—",
        totalDays: Number(record.totalDays),
        workingDays: Number(record.totalDays) - Number(record.weeklyOffDays),
        weeklyOffs: Number(record.weeklyOffDays),
        netDaysPresent,
        grossEarnings: Number(record.grossEarnings),
        totalDeductions: Number(record.totalDeductions),
        netSalary: adjustedNet,
        basicSalary: Number(record.basicSalary),
        hra: Number(record.hra),
        conveyance: Number(record.conveyance),
        bonus: Number(record.bonus),
        specialAllowance: Number(record.specialAllowance),
        overtimeAmount: Number(record.overtimeAmount),
        overtimeHours: Number((record as Record<string, unknown>).overtimeHours ?? 0),
        professionalTax: Number(record.professionalTax),
        tds: 0,
        lopDeduction: Number(record.lopDeduction),
        lateDeduction: Number(record.lateDeduction),
        lopDays: Number(record.lopDays),
        lateCount: record.lateCount,
        leaveBalancePrev: Math.max(0, leaveBalancePrev),
        leaveAddition,
        leaveTotalTillLastMonth: Math.max(0, leaveTotalTillLastMonth),
        leaveAvailed,
        leaveBalanceNow: Math.max(0, leaveBalanceNow),
      });

      await prisma.payslip.updateMany({
        where: { payrollRecordId: record.id },
        data: {
          emailSent: emailResult.success,
          emailSentAt: emailResult.success ? new Date() : null,
          emailError: emailResult.error ?? null,
        },
      });

      if (emailResult.success) emailsSent++;
      else emailsFailed++;

      await prisma.notification.create({
        data: {
          userId: emp.userId,
          type: "PAYROLL_PROCESSED",
          title: "Payslip Ready",
          message: `Your payslip for ${run.payrollMonth} is ready. Net pay: ₹${adjustedNet.toLocaleString("en-IN", { maximumFractionDigits: 0 })}. Check your email.`,
        },
      });
    }

    // Update payroll run status based on email results
    const finalStatus = emailsFailed === 0 ? "COMPLETED" : "PAYSLIPS_GENERATED";
    await prisma.payrollRun.update({
      where: { id: runId },
      data: { status: finalStatus },
    });

    await createAuditLog({
      actorId: session.userId, actorRole: "HR",
      action: "PAYROLL_APPROVED",
      entityType: "payroll_run", entityId: runId,
      description: `Payroll approved for ${run.payrollMonth}. ${emailsSent} payslip emails sent, ${emailsFailed} failed. Status: ${finalStatus}.`,
    });

    return NextResponse.json({ success: true, emailsSent, emailsFailed, status: finalStatus });
  } catch (e) {
    console.error("APPROVE ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
