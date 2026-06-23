import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/hr/calendar/2026-01-26 — remove entry (reverts to unconfigured)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  try {
    await requireAuth("HR");
    const { date } = await params;
    const utcDate = new Date(date + "T00:00:00.000Z");
    await prisma.companyCalendar.deleteMany({ where: { date: utcDate } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
