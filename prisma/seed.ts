import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create HR user
  const hrHash = await bcrypt.hash("hr123456", 12);
  const hr = await prisma.user.upsert({
    where: { email: "hr@wecool.com" },
    update: {},
    create: {
      email: "hr@wecool.com",
      passwordHash: hrHash,
      role: "HR",
      status: "APPROVED",
    },
  });

  // Create departments
  const dept = await prisma.department.upsert({
    where: { name: "Engineering" },
    update: {},
    create: { name: "Engineering", description: "Software Engineering Team" },
  });

  const warehouseDept = await prisma.department.upsert({
    where: { name: "Warehouse" },
    update: {},
    create: { name: "Warehouse", description: "Warehouse Operations" },
  });

  // Create designations
  const desig = await prisma.designation.upsert({
    where: { name: "Senior Developer" },
    update: {},
    create: { name: "Senior Developer", departmentId: dept.id },
  });

  const whDesig = await prisma.designation.upsert({
    where: { name: "Warehouse Operator" },
    update: {},
    create: { name: "Warehouse Operator", departmentId: warehouseDept.id },
  });

  // Create employee user
  const empHash = await bcrypt.hash("emp123456", 12);
  const empUser = await prisma.user.upsert({
    where: { email: "emp@wecool.com" },
    update: {},
    create: {
      email: "emp@wecool.com",
      passwordHash: empHash,
      role: "EMPLOYEE",
      status: "APPROVED",
      employee: {
        create: {
          employeeCode: "EMP-001",
          firstName: "Sneha",
          lastName: "Pillai",
          phone: "+91 9876543210",
          employeeType: "OFFICE",
          dateOfJoining: new Date("2024-01-10"),
          gender: "FEMALE",
          departmentId: dept.id,
          designationId: desig.id,
        },
      },
    },
    include: { employee: true },
  });

  if (empUser.employee) {
    await prisma.salaryStructure.upsert({
      where: { id: "seed-salary-1" },
      update: {},
      create: {
        id: "seed-salary-1",
        employeeId: empUser.employee.id,
        monthlySalary: 45000,
        effectiveFrom: new Date("2024-01-10"),
        isActive: true,
        createdById: hr.id,
      },
    }).catch(() => prisma.salaryStructure.create({
      data: {
        employeeId: empUser.employee!.id,
        monthlySalary: 45000,
        effectiveFrom: new Date("2024-01-10"),
        isActive: true,
        createdById: hr.id,
      },
    }));

    // Leave balances
    const year = new Date().getFullYear();
    const leaveTypes = ["CASUAL", "SICK", "MEDICAL", "LOP"] as const;
    for (const lt of leaveTypes) {
      await prisma.leaveBalance.upsert({
        where: { employeeId_year_leaveType: { employeeId: empUser.employee.id, year, leaveType: lt } },
        update: {},
        create: {
          employeeId: empUser.employee.id,
          year,
          leaveType: lt,
          totalAllocated: lt === "LOP" ? 0 : lt === "MEDICAL" ? 0 : 8,
          used: lt === "CASUAL" ? 2 : 0,
        },
      });
    }
  }

  // Company settings
  const settings = [
    { key: "payroll_cycle_start_day", value: "15", dataType: "NUMBER", category: "PAYROLL" as const, label: "Payroll Cycle Start Day" },
    { key: "working_hours_per_day", value: "9", dataType: "NUMBER", category: "ATTENDANCE" as const, label: "Working Hours Per Day" },
    { key: "office_start_time", value: "09:00", dataType: "STRING", category: "ATTENDANCE" as const, label: "Office Start Time" },
    { key: "office_end_time", value: "18:00", dataType: "STRING", category: "ATTENDANCE" as const, label: "Office End Time" },
    { key: "professional_tax", value: "200", dataType: "NUMBER", category: "PAYROLL" as const, label: "Professional Tax (₹)" },
    { key: "fixed_conveyance", value: "1600", dataType: "NUMBER", category: "PAYROLL" as const, label: "Fixed Conveyance (₹)" },
    { key: "fixed_bonus", value: "2000", dataType: "NUMBER", category: "PAYROLL" as const, label: "Fixed Bonus (₹)" },
    { key: "basic_salary_percent", value: "50", dataType: "NUMBER", category: "PAYROLL" as const, label: "Basic Salary %" },
    { key: "hra_percent_of_basic", value: "40", dataType: "NUMBER", category: "PAYROLL" as const, label: "HRA % of Basic" },
    { key: "annual_leave_quota", value: "16", dataType: "NUMBER", category: "LEAVE" as const, label: "Annual Leave Quota" },
    { key: "monthly_leave_credit", value: "1.33", dataType: "NUMBER", category: "LEAVE" as const, label: "Monthly Leave Credit" },
    { key: "late_free_count", value: "3", dataType: "NUMBER", category: "ATTENDANCE" as const, label: "Free Late Arrivals" },
    { key: "late_per_half_day", value: "2", dataType: "NUMBER", category: "ATTENDANCE" as const, label: "Lates Per Half-Day" },
    { key: "ot_warehouse_daily_rate", value: "1000", dataType: "NUMBER", category: "OVERTIME" as const, label: "Warehouse OT Rate (₹/day)" },
    { key: "salary_credit_day", value: "1", dataType: "NUMBER", category: "PAYROLL" as const, label: "Salary Credit Day" },
    { key: "company_name", value: "Wecool Technologies", dataType: "STRING", category: "COMPANY" as const, label: "Company Name" },
  ];

  for (const s of settings) {
    await prisma.companySetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  // Leave policies
  const policies = [
    { leaveType: "CASUAL" as const, annualQuota: 8, monthlyCredit: 0.67, isPaid: true },
    { leaveType: "SICK" as const, annualQuota: 8, monthlyCredit: 0.67, isPaid: true },
    { leaveType: "MEDICAL" as const, annualQuota: 0, monthlyCredit: 0, requiresDocument: true, requiresApproval: true, isPaid: true },
    { leaveType: "LOP" as const, annualQuota: 0, monthlyCredit: 0, isPaid: false },
  ];

  for (const p of policies) {
    await prisma.leavePolicy.upsert({
      where: { leaveType: p.leaveType },
      update: {},
      create: p,
    });
  }

  console.log("✅ Seed complete!");
  console.log("   HR:       hr@wecool.com / hr123456");
  console.log("   Employee: emp@wecool.com / emp123456");
}

main().catch(console.error).finally(() => prisma.$disconnect());
