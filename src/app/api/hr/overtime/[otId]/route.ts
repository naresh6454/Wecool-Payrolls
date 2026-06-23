import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({ status: z.enum(["APPROVED", "REJECTED"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ otId: string }> }) {
  try {
    const session = await requireAuth("HR");
    const { otId } = await params;
    const { status } = schema.parse(await req.json());

    const ot = await prisma.overtimeRequest.findUnique({
      where: { id: otId }, include: { employee: true },
    });
    if (!ot) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.overtimeRequest.update({
      where: { id: otId },
      data: { status, reviewedById: session.userId, reviewedAt: new Date() },
    });

    await prisma.notification.create({
      data: {
        userId: ot.employee.userId,
        type: status === "APPROVED" ? "OT_APPROVED" : "OT_REJECTED",
        title: `Overtime ${status === "APPROVED" ? "Approved" : "Rejected"}`,
        message: `Your overtime request for ${ot.overtimeDate.toDateString()} has been ${status.toLowerCase()}.`,
      },
    });

    await createAuditLog({
      actorId: session.userId, actorRole: "HR", action: `OT_${status}`,
      entityType: "overtime_request", entityId: otId,
      description: `HR ${status.toLowerCase()} OT request for ${ot.employee.firstName}`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
