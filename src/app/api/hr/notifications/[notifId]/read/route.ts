import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ notifId: string }> }) {
  try {
    const session = await requireAuth("HR");
    const { notifId } = await params;
    await prisma.notification.updateMany({
      where: { id: notifId, userId: session.userId },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
