import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({ status: z.enum(["APPROVED", "REJECTED", "SUSPENDED"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth("HR");
    const { id } = await params;
    const { status } = schema.parse(await req.json());

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      include: { employee: true },
    });

    if (status === "APPROVED") {
      await prisma.notification.create({
        data: {
          userId: id,
          type: "ACCOUNT_APPROVED",
          title: "Account Approved",
          message: "Your account has been approved by HR. You can now log in.",
        },
      });
      const year = new Date().getFullYear();
      const leaveDefaults: Record<string, number> = { LEAVE: 12, MEDICAL: 0, EARNED: 0, LOP: 0 };
      for (const [lt, allocated] of Object.entries(leaveDefaults)) {
        const exists = await prisma.leaveBalance.findFirst({
          where: { employeeId: user.employee!.id, year, leaveType: lt },
        });
        if (!exists) {
          await prisma.leaveBalance.create({
            data: { employeeId: user.employee!.id, year, leaveType: lt, totalAllocated: allocated, used: 0 },
          });
        }
      }
    }

    await createAuditLog({
      actorId: session.userId, actorRole: "HR",
      action: `EMPLOYEE_${status}`,
      entityType: "user", entityId: id,
      description: `HR ${status.toLowerCase()} employee ${user.email}`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
