import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  try {
    await requireAuth("HR");
    const { runId } = await params;

    const run = await prisma.payrollRun.findUnique({
      where: { id: runId },
      include: {
        payrollRecords: {
          include: {
            employee: { select: { firstName: true, lastName: true, employeeCode: true, employeeType: true } },
            manualAdjustments: true,
          },
          orderBy: { employee: { firstName: "asc" } },
        },
        upload: { select: { id: true, status: true } },
      },
    });

    if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Attach leave balance for each employee (current year)
    const year = new Date(run.periodEnd).getFullYear();
    const employeeIds = run.payrollRecords.map(r => r.employeeId);
    const leaveBalances = await prisma.leaveBalance.findMany({
      where: { employeeId: { in: employeeIds }, year, leaveType: "LEAVE" },
      select: { employeeId: true, totalAllocated: true, used: true },
    });
    const leaveMap = Object.fromEntries(leaveBalances.map(lb => [lb.employeeId, lb]));

    const recordsWithLeave = run.payrollRecords.map(r => ({
      ...r,
      leaveBalance: leaveMap[r.employeeId] ?? null,
    }));

    return NextResponse.json({ ...run, payrollRecords: recordsWithLeave });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
