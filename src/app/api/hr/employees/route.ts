import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  employeeCode: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().optional().default(""),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  employeeType: z.enum(["OFFICE", "WAREHOUSE"]),
  dateOfJoining: z.string(),
  gender: z.string().optional(),
  monthlySalary: z.string().min(1),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  bankAccountNo: z.string().optional(),
  currentLeaveBalance: z.number().optional().default(0),
});

export async function GET(_req: NextRequest) {
  try {
    await requireAuth("HR");
    const employees = await prisma.employee.findMany({
      include: {
        user: { select: { email: true, status: true } },
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        salaryStructures: { where: { isActive: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ employees });
  } catch (e) {
    console.error("GET /api/hr/employees error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth("HR");
    const data = schema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    let employeeCode = data.employeeCode?.trim().toUpperCase() || "";
    if (!employeeCode) {
      const count = await prisma.employee.count();
      const prefix = data.employeeType === "OFFICE" ? "EMP" : "WH";
      employeeCode = `${prefix}-${String(count + 1).padStart(3, "0")}`;
    } else {
      const codeExists = await prisma.employee.findFirst({ where: { employeeCode } });
      if (codeExists) return NextResponse.json({ error: `Employee code ${employeeCode} already exists` }, { status: 409 });
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        role: "EMPLOYEE",
        status: "APPROVED",
        employee: {
          create: {
            employeeCode,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone || null,
            employeeType: data.employeeType,
            dateOfJoining: new Date(data.dateOfJoining),
            gender: data.gender || null,
            departmentId: data.departmentId || null,
            designationId: data.designationId || null,
            bankAccountNo: data.bankAccountNo || null,
          },
        },
      },
      include: { employee: true },
    });

    // Create salary structure
    if (user.employee) {
      await prisma.salaryStructure.create({
        data: {
          employeeId: user.employee.id,
          monthlySalary: Number(data.monthlySalary),
          effectiveFrom: new Date(data.dateOfJoining),
          isActive: true,
          createdById: session.userId,
        },
      });

      // Single leave balance — opening balance set by HR, accrues 1.33/month automatically
      const year = new Date().getFullYear();
      await prisma.leaveBalance.create({
        data: {
          employeeId: user.employee.id,
          year,
          leaveType: "LEAVE",
          totalAllocated: data.currentLeaveBalance ?? 0,
          used: 0,
        },
      });
      // LOP balance (always starts at 0)
      await prisma.leaveBalance.create({
        data: {
          employeeId: user.employee.id,
          year,
          leaveType: "LOP",
          totalAllocated: 0,
          used: 0,
        },
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "ACCOUNT_APPROVED",
          title: "Welcome to Wecool!",
          message: `Your employee account has been created. Employee code: ${employeeCode}`,
        },
      });
    }

    await createAuditLog({
      actorId: session.userId, actorRole: "HR",
      action: "EMPLOYEE_CREATED",
      entityType: "employee", entityId: user.employee?.id,
      description: `HR created employee ${data.firstName} ${data.lastName} (${employeeCode}). Opening leave balance: ${data.currentLeaveBalance ?? 0} days`,
      newValues: { openingLeaveBalance: data.currentLeaveBalance ?? 0 },
    });

    return NextResponse.json({ success: true, employeeId: user.employee?.id });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
