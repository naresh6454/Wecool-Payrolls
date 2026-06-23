import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export async function POST(req: NextRequest) {
  try {
    await requireAuth("HR");
    const { year, overwrite } = z.object({
      year: z.number().int().min(2020).max(2100),
      overwrite: z.boolean().default(false),
    }).parse(await req.json());

    // Always use UTC midnight to avoid timezone shifting dates
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(`${year}-12-31T23:59:59.999Z`);

    if (overwrite) {
      await prisma.companyCalendar.deleteMany({ where: { date: { gte: start, lte: end } } });
    }

    // Fetch existing entries AFTER potential delete
    const existing = await prisma.companyCalendar.findMany({
      where: { date: { gte: start, lte: end } },
      select: { date: true },
    });
    const existingDates = new Set(existing.map(e => e.date.toISOString().split("T")[0]));

    // Build all 365/366 days using UTC to avoid DST drift
    const toCreate: Array<{
      date: Date; dayOfWeek: string; status: string; holidayName: null; description: null;
    }> = [];

    const current = new Date(`${year}-01-01T00:00:00.000Z`);
    while (current.getUTCFullYear() === year) {
      const dateStr = current.toISOString().split("T")[0];

      if (!existingDates.has(dateStr)) {
        const dow = current.getUTCDay(); // 0=Sun only
        const status = dow === 0 ? "WEEKLY_OFF" : "WORKING_DAY";
        toCreate.push({
          date: new Date(dateStr + "T00:00:00.000Z"),
          dayOfWeek: DAY_NAMES[dow],
          status,
          holidayName: null,
          description: null,
        });
      }

      current.setUTCDate(current.getUTCDate() + 1);
    }

    if (toCreate.length > 0) {
      await prisma.companyCalendar.createMany({ data: toCreate });
    }

    return NextResponse.json({ success: true, created: toCreate.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
