import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireAuth("EMPLOYEE");
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { employee: { include: { department: true, designation: true } } },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth("EMPLOYEE");
    const { phone } = await req.json();

    await prisma.employee.updateMany({
      where: { userId: session.userId },
      data: { phone },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
