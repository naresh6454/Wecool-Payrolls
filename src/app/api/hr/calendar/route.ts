import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// GET /api/hr/calendar?year=2026
export async function GET(req: NextRequest) {
  try {
    await requireAuth("HR");
    const year = Number(req.nextUrl.searchParams.get("year") ?? new Date().getFullYear());
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(`${year}-12-31T23:59:59.999Z`);

    const entries = await prisma.companyCalendar.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(entries.map(e => ({
      id: e.id,
      date: e.date.toISOString().split("T")[0],
      dayOfWeek: e.dayOfWeek,
      status: e.status,
      holidayName: e.holidayName,
      description: e.description,
    })));
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

const upsertSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["WORKING_DAY", "WEEKLY_OFF", "COMPANY_HOLIDAY"]),
  holidayName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

// POST /api/hr/calendar — upsert a single date
export async function POST(req: NextRequest) {
  try {
    await requireAuth("HR");
    const body = upsertSchema.parse(await req.json());
    const date = new Date(body.date + "T00:00:00.000Z");
    const dayOfWeek = DAY_NAMES[date.getUTCDay()];

    const entry = await prisma.companyCalendar.upsert({
      where: { date },
      create: {
        date,
        dayOfWeek,
        status: body.status,
        holidayName: body.holidayName ?? null,
        description: body.description ?? null,
      },
      update: {
        status: body.status,
        holidayName: body.holidayName ?? null,
        description: body.description ?? null,
      },
    });

    return NextResponse.json({
      id: entry.id,
      date: entry.date.toISOString().split("T")[0],
      dayOfWeek: entry.dayOfWeek,
      status: entry.status,
      holidayName: entry.holidayName,
      description: entry.description,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
