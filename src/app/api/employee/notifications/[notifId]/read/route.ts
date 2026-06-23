import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ notifId: string }> }) {
  try {
    const session = await requireAuth("EMPLOYEE");
    const { notifId } = await params;
    await prisma.notification.updateMany({
      where: { id: notifId, userId: session.userId },
      data: { isRead: true, readAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
