import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({ password: z.string().min(6, "Password must be at least 6 characters") });

export async function POST(req: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) {
  try {
    await requireAuth("HR");
    const { employeeId } = await params;
    const body = schema.parse(await req.json());

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { userId: true },
    });
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    const passwordHash = await bcrypt.hash(body.password, 10);
    await prisma.user.update({ where: { id: employee.userId }, data: { passwordHash } });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}
