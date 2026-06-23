import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  employeeType: z.enum(["OFFICE", "WAREHOUSE"]),
  dateOfJoining: z.string(),
  gender: z.string().optional(),
  aadhaarNumber: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    const passwordHash = await hashPassword(data.password);

    // Generate employee code
    const type = data.employeeType === "OFFICE" ? "EMP" : "WH";
    const count = await prisma.employee.count();
    const employeeCode = `${type}-${String(count + 1).padStart(3, "0")}`;

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        role: "EMPLOYEE",
        status: "PENDING",
        employee: {
          create: {
            employeeCode,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            employeeType: data.employeeType,
            dateOfJoining: new Date(data.dateOfJoining),
            gender: data.gender,
            aadhaarNumber: data.aadhaarNumber || undefined,
          },
        },
      },
    });

    await createAuditLog({
      actorRole: "SYSTEM",
      action: "EMPLOYEE_REGISTERED",
      entityType: "user",
      entityId: user.id,
      description: `New employee registered: ${data.email}. Pending HR approval.`,
    });

    return NextResponse.json({ success: true, message: "Registration successful. Await HR approval." });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
