import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  try {
    await requireAuth("HR");
    const { runId } = await params;

    const payslips = await prisma.payslip.findMany({
      where: { payrollRunId: runId },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeCode: true,
            employeeType: true,
            user: { select: { email: true } },
          },
        },
      },
      orderBy: { generatedAt: "asc" },
    });

    return NextResponse.json(payslips);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
