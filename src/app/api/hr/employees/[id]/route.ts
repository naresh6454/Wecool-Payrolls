import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth("HR");
    const { id } = await params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: { select: { email: true } },
        salaryStructures: { where: { isActive: true }, orderBy: { effectiveFrom: "desc" }, take: 1 },
      },
    });
    if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const year = new Date().getFullYear();
    const leaveBalance = await prisma.leaveBalance.findFirst({
      where: { employeeId: id, year, leaveType: "LEAVE" },
      select: { id: true, totalAllocated: true, used: true },
    });
    return NextResponse.json({
      ...employee,
      email: employee.user.email,
      monthlySalary: employee.salaryStructures[0]?.monthlySalary ?? null,
      leaveBalance,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

const schema = z.object({
  leaveBalance: z.number().min(0).optional(),
  employeeCode: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().optional().default(""),
  email: z.string().email(),
  phone: z.string().optional(),
  employeeType: z.enum(["OFFICE", "WAREHOUSE"]),
  dateOfJoining: z.string(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  monthlySalary: z.string().min(1),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  panNumber: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankName: z.string().optional(),
  ifscCode: z.string().optional(),
  address: z.string().optional(),
  biometricId: z.string().optional(),
});

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth("HR");
    const { id } = await params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { firstName: true, lastName: true, employeeCode: true, userId: true },
    });
    if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Block deletion if employee has approved payroll records
    const approvedRecords = await prisma.payrollRecord.count({ where: { employeeId: id, status: "APPROVED" } });
    if (approvedRecords > 0) {
      return NextResponse.json({ error: "Cannot delete employee with approved payroll records. Mark as inactive instead." }, { status: 400 });
    }

    // Delete in dependency order
    await prisma.payrollRecord.deleteMany({ where: { employeeId: id } });
    await prisma.leaveBalance.deleteMany({ where: { employeeId: id } });
    await prisma.attendanceRecord.deleteMany({ where: { employeeId: id } });
    await prisma.salaryStructure.deleteMany({ where: { employeeId: id } });
    await prisma.notification.deleteMany({ where: { userId: employee.userId } });
    await prisma.employee.delete({ where: { id } });
    await prisma.user.delete({ where: { id: employee.userId } });

    await createAuditLog({
      actorId: session.userId, actorRole: "HR",
      action: "EMPLOYEE_DELETED",
      entityType: "employee", entityId: id,
      description: `HR deleted employee ${employee.firstName} ${employee.lastName} (${employee.employeeCode})`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/hr/employees/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth("HR");
    const { id } = await params;
    const data = schema.parse(await req.json());

    const employee = await prisma.employee.findUnique({ where: { id }, include: { user: true } });
    if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Check employee code uniqueness if changed
    if (data.employeeCode !== employee.employeeCode) {
      const codeExists = await prisma.employee.findFirst({ where: { employeeCode: data.employeeCode, NOT: { id } } });
      if (codeExists) return NextResponse.json({ error: `Employee code ${data.employeeCode} already in use` }, { status: 409 });
    }

    // Check email uniqueness if changed
    if (data.email.toLowerCase() !== employee.user.email) {
      const emailExists = await prisma.user.findFirst({ where: { email: data.email.toLowerCase(), NOT: { id: employee.userId } } });
      if (emailExists) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      await prisma.user.update({ where: { id: employee.userId }, data: { email: data.email.toLowerCase() } });
    }

    await prisma.employee.update({
      where: { id },
      data: {
        employeeCode: data.employeeCode.trim().toUpperCase(),
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        employeeType: data.employeeType,
        dateOfJoining: new Date(data.dateOfJoining),
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender || null,
        departmentId: data.departmentId || null,
        designationId: data.designationId || null,
        panNumber: data.panNumber || null,
        aadhaarNumber: data.aadhaarNumber || null,
        bankAccountNo: data.bankAccountNo || null,
        bankName: data.bankName || null,
        ifscCode: data.ifscCode || null,
        address: data.address || null,
        biometricId: data.biometricId?.trim() || null,
      },
    });

    // Update salary if changed
    const activeSalary = await prisma.salaryStructure.findFirst({ where: { employeeId: id, isActive: true } });
    if (!activeSalary || Number(activeSalary.monthlySalary) !== Number(data.monthlySalary)) {
      if (activeSalary) await prisma.salaryStructure.update({ where: { id: activeSalary.id }, data: { isActive: false } });
      await prisma.salaryStructure.create({
        data: { employeeId: id, monthlySalary: Number(data.monthlySalary), effectiveFrom: new Date(), isActive: true, createdById: session.userId },
      });
    }

    // Update leave balance if provided
    if (data.leaveBalance !== undefined) {
      const year = new Date().getFullYear();
      const lb = await prisma.leaveBalance.findFirst({ where: { employeeId: id, year, leaveType: "LEAVE" } });
      if (lb) {
        await prisma.leaveBalance.update({ where: { id: lb.id }, data: { totalAllocated: data.leaveBalance } });
      } else {
        await prisma.leaveBalance.create({ data: { employeeId: id, year, leaveType: "LEAVE", totalAllocated: data.leaveBalance, used: 0 } });
      }
    }

    await createAuditLog({
      actorId: session.userId, actorRole: "HR",
      action: "EMPLOYEE_UPDATED", entityType: "employee", entityId: id,
      description: `HR updated employee ${data.firstName} ${data.lastName} (${data.employeeCode})${data.leaveBalance !== undefined ? `. Leave balance set to ${data.leaveBalance}` : ""}`,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
