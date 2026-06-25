import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const manualEditSchema = z.object({
  basicSalary: z.number().min(0),
  hra: z.number().min(0),
  conveyance: z.number().min(0),
  bonus: z.number().min(0),
  specialAllowance: z.number().min(0),
  overtimeAmount: z.number().min(0),
  overtimeDays: z.number().min(0),
  professionalTax: z.number().min(0),
  lopDeduction: z.number().min(0),
  lateDeduction: z.number().min(0),
  presentDays: z.number().min(0),
  lopDays: z.number().min(0),
  lateCount: z.number().min(0),
  weeklyOffDays: z.number().min(0).optional(),
  useLeaveBalance: z.boolean().optional(),
});

const schema = z.union([
  z.object({ status: z.enum(["APPROVED", "REJECTED", "DRAFT"]) }),
  z.object({ otDays: z.number().min(0), otAmountPerDay: z.number().min(0) }),
  manualEditSchema,
]);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ recordId: string }> }) {
  try {
    await requireAuth("HR");
    const { recordId } = await params;
    const body = schema.parse(await req.json());

    if ("status" in body) {
      await prisma.payrollRecord.update({ where: { id: recordId }, data: { status: body.status } });
      return NextResponse.json({ success: true });
    }

    // Manual field edit — recalculate gross/deductions/net
    if ("basicSalary" in body) {
      const record = await prisma.payrollRecord.findUnique({
        where: { id: recordId },
        select: { employeeId: true, payrollRunId: true, perDaySalary: true, paidLeaveDays: true },
      });
      if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

      let finalLopDays = body.lopDays;
      let finalLopDeduction = body.lopDeduction;
      let finalPaidLeaveDays = Number(record.paidLeaveDays);

      // If HR chose to use leave balance, convert as much LOP as possible to paid leave
      if (body.useLeaveBalance) {
        const payrollRun = await prisma.payrollRun.findUnique({
          where: { id: record.payrollRunId },
          select: { periodEnd: true },
        });
        const leaveYear = new Date(payrollRun!.periodEnd).getFullYear();
        const lb = await prisma.leaveBalance.findFirst({
          where: { employeeId: record.employeeId, year: leaveYear, leaveType: "LEAVE" },
        });

        if (lb) {
          const rawAvailable = Math.max(0, Number(lb.totalAllocated) - Number(lb.used));
          const available = Math.floor(rawAvailable * 2) / 2;
          const daysToConvert = Math.min(finalLopDays, available);

          if (daysToConvert > 0) {
            finalPaidLeaveDays += daysToConvert;
            finalLopDays = Math.max(0, finalLopDays - daysToConvert);
            const perDay = Number(record.perDaySalary);
            finalLopDeduction = Math.round(finalLopDays * perDay * 100) / 100;

            await prisma.leaveBalance.update({
              where: { id: lb.id },
              data: { used: { increment: daysToConvert } },
            });
          }
        }
      }

      const grossEarnings = body.basicSalary + body.hra + body.conveyance + body.bonus + body.specialAllowance + body.overtimeAmount;
      const totalDeductions = body.professionalTax + finalLopDeduction + body.lateDeduction;
      const netSalary = Math.max(0, grossEarnings - totalDeductions);

      const updated = await prisma.payrollRecord.update({
        where: { id: recordId },
        data: {
          basicSalary: body.basicSalary,
          hra: body.hra,
          conveyance: body.conveyance,
          bonus: body.bonus,
          specialAllowance: body.specialAllowance,
          overtimeAmount: body.overtimeAmount,
          overtimeDays: body.overtimeDays,
          professionalTax: body.professionalTax,
          lopDeduction: finalLopDeduction,
          lateDeduction: body.lateDeduction,
          presentDays: body.presentDays,
          lopDays: finalLopDays,
          paidLeaveDays: finalPaidLeaveDays,
          lateCount: body.lateCount,
          ...(body.weeklyOffDays !== undefined ? { weeklyOffDays: body.weeklyOffDays } : {}),
          grossEarnings,
          totalDeductions,
          netSalary,
          status: "DRAFT",
        },
      });

      // Fetch updated leave balance so the UI can reflect changes
      const payrollRun2 = await prisma.payrollRun.findUnique({
        where: { id: record.payrollRunId },
        select: { periodEnd: true },
      });
      const leaveYear2 = new Date(payrollRun2!.periodEnd).getFullYear();
      const updatedLb = await prisma.leaveBalance.findFirst({
        where: { employeeId: record.employeeId, year: leaveYear2, leaveType: "LEAVE" },
        select: { totalAllocated: true, used: true },
      });

      return NextResponse.json({
        basicSalary: Number(updated.basicSalary),
        hra: Number(updated.hra),
        conveyance: Number(updated.conveyance),
        bonus: Number(updated.bonus),
        specialAllowance: Number(updated.specialAllowance),
        overtimeAmount: Number(updated.overtimeAmount),
        overtimeDays: Number(updated.overtimeDays),
        professionalTax: Number(updated.professionalTax),
        lopDeduction: Number(updated.lopDeduction),
        lateDeduction: Number(updated.lateDeduction),
        presentDays: Number(updated.presentDays),
        lopDays: Number(updated.lopDays),
        paidLeaveDays: Number(updated.paidLeaveDays),
        lateCount: Number(updated.lateCount),
        weeklyOffDays: Number(updated.weeklyOffDays),
        grossEarnings: Number(updated.grossEarnings),
        totalDeductions: Number(updated.totalDeductions),
        netSalary: Number(updated.netSalary),
        status: "DRAFT",
        leaveBalance: updatedLb
          ? { totalAllocated: Number(updatedLb.totalAllocated), used: Number(updatedLb.used) }
          : null,
      });
    }

    // Warehouse OT update — recalculate overtime amount and net salary
    const record = await prisma.payrollRecord.findUnique({ where: { id: recordId } });
    if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const overtimeAmount = body.otDays * body.otAmountPerDay;
    const grossEarnings = Number(record.monthlySalary) + overtimeAmount;
    const netSalary = Math.max(0, grossEarnings - Number(record.totalDeductions));

    const updated = await prisma.payrollRecord.update({
      where: { id: recordId },
      data: {
        overtimeDays: body.otDays,
        otAmountPerDay: body.otAmountPerDay,
        overtimeAmount,
        grossEarnings,
        netSalary,
      },
    });

    return NextResponse.json({
      overtimeDays: Number(updated.overtimeDays),
      otAmountPerDay: Number(updated.otAmountPerDay),
      overtimeAmount: Number(updated.overtimeAmount),
      grossEarnings: Number(updated.grossEarnings),
      netSalary: Number(updated.netSalary),
    });
  } catch (e) {
    console.error("PATCH payroll record error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}
