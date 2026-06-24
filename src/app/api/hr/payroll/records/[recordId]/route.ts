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
  professionalTax: z.number().min(0),
  lopDeduction: z.number().min(0),
  lateDeduction: z.number().min(0),
  presentDays: z.number().min(0),
  lopDays: z.number().min(0),
  lateCount: z.number().min(0),
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
      const grossEarnings = body.basicSalary + body.hra + body.conveyance + body.bonus + body.specialAllowance + body.overtimeAmount;
      const totalDeductions = body.professionalTax + body.lopDeduction + body.lateDeduction;
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
          professionalTax: body.professionalTax,
          lopDeduction: body.lopDeduction,
          lateDeduction: body.lateDeduction,
          presentDays: body.presentDays,
          lopDays: body.lopDays,
          lateCount: body.lateCount,
          grossEarnings,
          totalDeductions,
          netSalary,
        },
      });

      return NextResponse.json({
        basicSalary: Number(updated.basicSalary),
        hra: Number(updated.hra),
        conveyance: Number(updated.conveyance),
        bonus: Number(updated.bonus),
        specialAllowance: Number(updated.specialAllowance),
        overtimeAmount: Number(updated.overtimeAmount),
        professionalTax: Number(updated.professionalTax),
        lopDeduction: Number(updated.lopDeduction),
        lateDeduction: Number(updated.lateDeduction),
        presentDays: Number(updated.presentDays),
        lopDays: Number(updated.lopDays),
        lateCount: Number(updated.lateCount),
        grossEarnings: Number(updated.grossEarnings),
        totalDeductions: Number(updated.totalDeductions),
        netSalary: Number(updated.netSalary),
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
