import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";
import { eachDayOfInterval, parseISO } from "date-fns";

const schema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("APPROVED"), asLop: z.boolean().optional() }),
  z.object({ status: z.literal("REJECTED"), reason: z.string().min(1, "Rejection reason is required") }),
]);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ leaveId: string }> }) {
  try {
    const session = await requireAuth("HR");
    const { leaveId } = await params;
    const parsed = schema.parse(await req.json());
    const status = parsed.status;
    const reason = parsed.status === "REJECTED" ? parsed.reason : undefined;
    const asLop = parsed.status === "APPROVED" ? (parsed.asLop ?? false) : false;

    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { employee: true },
    });
    if (!leave) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (leave.status !== "PENDING") return NextResponse.json({ error: "Leave is already reviewed" }, { status: 400 });

    const leaveDays = Number(leave.totalDays);
    const leaveYear = new Date(leave.fromDate).getFullYear();

    if (status === "APPROVED") {
      // LOP type = explicit LOP leave OR HR chose to approve as LOP due to insufficient balance
      const isLopType = leave.leaveType === "LOP" || asLop;

      if (!isLopType) {
        // All paid leave types (MEDICAL, CASUAL, SICK, etc.) share the accrued "LEAVE" balance.
        // If balance is sufficient → paid leave, deduct balance.
        // If insufficient → warn HR; HR can approve as LOP or reject.
        const balance = await prisma.leaveBalance.findFirst({
          where: { employeeId: leave.employeeId, year: leaveYear, leaveType: "LEAVE" },
        });
        const available = balance ? Number(balance.totalAllocated) - Number(balance.used) : 0;

        if (available < leaveDays) {
          // Insufficient balance — return warning so HR can decide
          return NextResponse.json({
            warning: true,
            availableBalance: available,
            requestedDays: leaveDays,
            message: `Insufficient leave balance. Employee has ${available.toFixed(2)} days available but requested ${leaveDays} days. Approve as LOP or reject.`,
          }, { status: 200 });
        }

        // Sufficient balance — deduct
        if (balance) {
          await prisma.leaveBalance.update({
            where: { id: balance.id },
            data: { used: { increment: leaveDays } },
          });
        }
      }

      // Update attendance records for each day of the leave period
      const days = eachDayOfInterval({
        start: parseISO(leave.fromDate.toISOString().split("T")[0]),
        end: parseISO(leave.toDate.toISOString().split("T")[0]),
      });

      for (const day of days) {
        await prisma.attendanceRecord.upsert({
          where: { employeeId_attendanceDate: { employeeId: leave.employeeId, attendanceDate: day } },
          update: { status: isLopType ? "ABSENT" : "LEAVE", isLate: false },
          create: {
            employeeId: leave.employeeId,
            attendanceDate: day,
            status: isLopType ? "ABSENT" : "LEAVE",
            isLate: false,
            lateMinutes: 0,
            overtimeHours: 0,
            entryType: "MANUAL",
          },
        });
      }

      await prisma.leaveRequest.update({
        where: { id: leaveId },
        data: {
          status: "APPROVED",
          reviewedById: session.userId,
          reviewedAt: new Date(),
        },
      });

      await prisma.notification.create({
        data: {
          userId: leave.employee.userId,
          type: "LEAVE_APPROVED",
          title: "Leave Approved",
          message: isLopType
            ? `Your ${leave.leaveType} leave for ${leaveDays} day(s) has been approved as Loss of Pay (LOP).`
            : `Your ${leave.leaveType} leave for ${leaveDays} day(s) has been approved. Balance deducted: ${leaveDays} day(s).`,
        },
      });

      await createAuditLog({
        actorId: session.userId, actorRole: "HR", action: "LEAVE_APPROVED",
        entityType: "leave_request", entityId: leaveId,
        description: `HR approved ${leaveDays} day(s) ${leave.leaveType} leave for ${leave.employee.firstName} ${leave.employee.lastName}${isLopType ? " (as LOP)" : ""}`,
      });

    } else {
      // REJECTED
      await prisma.leaveRequest.update({
        where: { id: leaveId },
        data: { status: "REJECTED", reviewedById: session.userId, reviewedAt: new Date(), rejectionReason: reason },
      });

      await prisma.notification.create({
        data: {
          userId: leave.employee.userId,
          type: "LEAVE_REJECTED",
          title: "Leave Rejected",
          message: `Your ${leave.leaveType} leave request for ${leaveDays} day(s) has been rejected. Reason: ${reason}`,
        },
      });

      await createAuditLog({
        actorId: session.userId, actorRole: "HR", action: "LEAVE_REJECTED",
        entityType: "leave_request", entityId: leaveId,
        description: `HR rejected leave for ${leave.employee.firstName} ${leave.employee.lastName}. Reason: ${reason}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("LEAVE PATCH ERROR:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
