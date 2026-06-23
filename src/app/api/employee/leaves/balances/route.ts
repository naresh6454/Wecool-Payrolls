import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireAuth("EMPLOYEE");
    const employee = await prisma.employee.findUnique({ where: { userId: session.userId } });
    if (!employee) return NextResponse.json([]);

    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId: employee.id, year: new Date().getFullYear() },
    });
    return NextResponse.json(balances);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
