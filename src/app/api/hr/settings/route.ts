import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAuth("HR");
    const settings = await prisma.companySetting.findMany({ orderBy: { category: "asc" } });
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAuth("HR");
    const changes: Record<string, string> = await req.json();

    await Promise.all(
      Object.entries(changes).map(([key, value]) =>
        prisma.companySetting.updateMany({ where: { key }, data: { value } })
      )
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
