import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { differenceInCalendarDays } from "date-fns";

const schema = z.object({
  leaveType: z.enum(["CASUAL", "SICK", "MEDICAL", "LOP"]),
  fromDate: z.string(),
  toDate: z.string(),
  reason: z.string().min(3),
});

export async function GET() {
  try {
    const session = await requireAuth("EMPLOYEE");
    const employee = await prisma.employee.findUnique({ where: { userId: session.userId } });
    if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const leaves = await prisma.leaveRequest.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(leaves);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth("EMPLOYEE");
    const employee = await prisma.employee.findUnique({ where: { userId: session.userId } });
    if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data = schema.parse(await req.json());
    const from = new Date(data.fromDate);
    const to = new Date(data.toDate);
    if (to < from) return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });

    const totalDays = differenceInCalendarDays(to, from) + 1;

    // Check balance for paid leaves
    if (data.leaveType !== "LOP") {
      const balance = await prisma.leaveBalance.findUnique({
        where: { employeeId_year_leaveType: { employeeId: employee.id, year: from.getFullYear(), leaveType: data.leaveType } },
      });
      if (balance) {
        const avail = Number(balance.totalAllocated) - Number(balance.used);
        if (avail < totalDays) {
          return NextResponse.json({ error: `Insufficient ${data.leaveType} leave balance. Available: ${avail.toFixed(1)} days` }, { status: 400 });
        }
      }
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        leaveType: data.leaveType,
        fromDate: from,
        toDate: to,
        totalDays,
        reason: data.reason,
        status: "PENDING",
      },
    });

    // Notify HR
    const hrUsers = await prisma.user.findMany({ where: { role: "HR" } });
    for (const hr of hrUsers) {
      await prisma.notification.create({
        data: {
          userId: hr.id,
          type: "LEAVE_REQUEST",
          title: "New Leave Request",
          message: `${employee.firstName} ${employee.lastName} requested ${data.leaveType} leave for ${totalDays} day(s)`,
        },
      });
    }

    return NextResponse.json(leave);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
