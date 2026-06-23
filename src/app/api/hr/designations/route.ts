import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireAuth("HR");
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const designations = await prisma.designation.findMany({
      where: {
        isActive: true,
        ...(departmentId ? { departmentId } : {}),
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, departmentId: true },
    });
    return NextResponse.json(designations);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth("HR");
    const { name, departmentId } = await req.json();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const desig = await prisma.designation.create({ data: { name, departmentId: departmentId || null } });
    return NextResponse.json(desig, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e instanceof Error ? e.message : e) }, { status: 500 });
  }
}
