import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({ isActive: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth("HR");
    const { id } = await params;
    const { isActive } = schema.parse(await req.json());

    const employee = await prisma.employee.update({
      where: { id },
      data: { isActive },
      select: { firstName: true, lastName: true, employeeCode: true },
    });

    await createAuditLog({
      actorId: session.userId, actorRole: "HR",
      action: isActive ? "EMPLOYEE_ACTIVATED" : "EMPLOYEE_DEACTIVATED",
      entityType: "employee", entityId: id,
      description: `HR marked ${employee.firstName} ${employee.lastName} (${employee.employeeCode}) as ${isActive ? "active" : "inactive"}`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
