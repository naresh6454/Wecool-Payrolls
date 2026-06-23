import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  adjustmentType: z.enum(["ADDITION", "DEDUCTION"]),
  amount: z.number().positive(),
  description: z.string().min(1),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ recordId: string }> }) {
  try {
    const session = await requireAuth("HR");
    const { recordId } = await params;
    const data = schema.parse(await req.json());

    const adj = await prisma.manualAdjustment.create({
      data: { ...data, payrollRecordId: recordId, addedById: session.userId },
    });

    return NextResponse.json(adj);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ recordId: string }> }) {
  try {
    await requireAuth("HR");
    const { adjId } = await req.json();
    await prisma.manualAdjustment.delete({ where: { id: adjId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
