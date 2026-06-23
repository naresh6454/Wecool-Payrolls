import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPayslipEmail } from "@/lib/email";
import { format } from "date-fns";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string; payslipId: string }> }
) {
  try {
    await requireAuth("HR");
    const { payslipId } = await params;

    const payslip = await prisma.payslip.findUnique({
      where: { id: payslipId },
      include: {
        payrollRunRel: true,
        payrollRecord: { include: { manualAdjustments: true } },
        employee: {
          include: {
            user: { select: { email: true } },
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
      },
    });

    if (!payslip) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const emp = payslip.employee;
    const record = payslip.payrollRecord;
    const run = payslip.payrollRunRel;
    const leaveYear = new Date(run.periodEnd).getFullYear();

    let adjustedNet = Number(record.netSalary);
    for (const adj of record.manualAdjustments) {
      if (adj.adjustmentType === "ADDITION") adjustedNet += Number(adj.amount);
      else adjustedNet -= Number(adj.amount);
    }

    const leaveBalance = await prisma.leaveBalance.findFirst({
      where: { employeeId: emp.id, year: leaveYear, leaveType: "LEAVE" },
    });

    const leaveAddition = 1.33;
    const totalAllocated = leaveBalance ? Number(leaveBalance.totalAllocated) : leaveAddition;
    const used = leaveBalance ? Number(leaveBalance.used) : 0;
    const leaveAvailed = Number(record.paidLeaveDays);
    const leaveBalanceNow = totalAllocated - used;
    const leaveTotalTillLastMonth = totalAllocated - leaveAddition;
    const leaveBalancePrev = leaveTotalTillLastMonth - (used - leaveAvailed < 0 ? 0 : used - leaveAvailed);
    const netDaysPresent = Number(record.presentDays) + Number(record.weeklyOffDays);

    const result = await sendPayslipEmail({
      to: emp.user.email,
      employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
      employeeCode: emp.employeeCode,
      payrollMonth: run.payrollMonth,
      dateOfJoining: format(new Date(emp.dateOfJoining), "M/d/yyyy"),
      department: emp.department?.name || "",
      designation: emp.designation?.name || "",
      bankAccountNo: emp.bankAccountNo || "0000",
      totalDays: Number(record.totalDays),
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
      professionalTax: Number(record.professionalTax),
      lopDeduction: Number(record.lopDeduction),
      lateDeduction: Number(record.lateDeduction),
      lopDays: Number(record.lopDays),
      weeklyOffs: Number(record.weeklyOffDays),
      workingDays: Number(record.totalDays) - Number(record.weeklyOffDays),
      lateCount: record.lateCount,
      leaveBalancePrev: Math.max(0, leaveBalancePrev),
      leaveAddition,
      leaveTotalTillLastMonth: Math.max(0, leaveTotalTillLastMonth),
      leaveAvailed,
      leaveBalanceNow: Math.max(0, leaveBalanceNow),
    });

    await prisma.payslip.update({
      where: { id: payslipId },
      data: {
        emailSent: result.success,
        emailSentAt: result.success ? new Date() : null,
        emailError: result.error ?? null,
      },
    });

    if (!result.success) {
      console.error("EMAIL FAILED:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("RESEND ROUTE ERROR:", e);
    return NextResponse.json({ error: String(e instanceof Error ? e.message : e) }, { status: 500 });
  }
}
