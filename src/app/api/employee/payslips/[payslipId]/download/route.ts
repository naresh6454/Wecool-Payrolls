import { NextRequest, NextResponse } from "next/server"; // NextResponse used for error responses
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePayslipPDF } from "@/lib/pdf";
import { format } from "date-fns";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ payslipId: string }> }) {
  try {
    const session = await requireAuth("EMPLOYEE");
    const { payslipId } = await params;

    const payslip = await prisma.payslip.findUnique({
      where: { id: payslipId },
      include: {
        employee: {
          include: {
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
        payrollRecord: {
          include: { manualAdjustments: true },
        },
        payrollRunRel: true,
      },
    });

    if (!payslip) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Ensure the employee can only download their own payslip
    if (payslip.employee.id !== session.employeeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const emp = payslip.employee;
    const record = payslip.payrollRecord;
    const run = payslip.payrollRunRel;
    const leaveYear = new Date(run.periodEnd).getFullYear();

    const leaveBalance = await prisma.leaveBalance.findFirst({
      where: { employeeId: emp.id, year: leaveYear, leaveType: "LEAVE" },
    });

    const leaveAddition = 1.33;
    const totalAllocated = leaveBalance ? Number(leaveBalance.totalAllocated) : leaveAddition;
    const used = leaveBalance ? Number(leaveBalance.used) : 0;
    const leaveAvailed = Number(record.paidLeaveDays);
    const leaveBalanceNow = totalAllocated - used;
    const leaveTotalTillLastMonth = totalAllocated - leaveAddition;
    const leaveBalancePrev = Math.max(0, leaveTotalTillLastMonth - (used - leaveAvailed < 0 ? 0 : used - leaveAvailed));

    let adjustedNet = Number(record.netSalary);
    for (const adj of record.manualAdjustments) {
      if (adj.adjustmentType === "ADDITION") adjustedNet += Number(adj.amount);
      else adjustedNet -= Number(adj.amount);
    }

    const netDaysPresent = Number(record.presentDays) + Number(record.weeklyOffDays);

    const pdfBuffer = await generatePayslipPDF({
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
      overtimeHours: 0,
      professionalTax: Number(record.professionalTax),
      tds: 0,
      lopDeduction: Number(record.lopDeduction),
      lateDeduction: Number(record.lateDeduction),
      lopDays: Number(record.lopDays),
      lateCount: record.lateCount,
      leaveBalancePrev,
      leaveAddition,
      leaveTotalTillLastMonth: Math.max(0, leaveTotalTillLastMonth),
      leaveAvailed,
      leaveBalanceNow: Math.max(0, leaveBalanceNow),
    });

    const blob = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" });
    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${payslip.fileName}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
