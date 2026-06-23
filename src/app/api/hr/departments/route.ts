import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAuth("HR");
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return NextResponse.json(departments);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth("HR");
    const { name, description } = await req.json();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const dept = await prisma.department.create({ data: { name, description } });
    return NextResponse.json(dept, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e instanceof Error ? e.message : e) }, { status: 500 });
  }
}
