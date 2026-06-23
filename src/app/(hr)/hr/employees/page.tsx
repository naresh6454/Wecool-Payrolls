import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmployeeActions from "./EmployeeActions";
import Link from "next/link";
import { format } from "date-fns";
import { UserPlus } from "lucide-react";

export default async function EmployeesPage() {
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: {
      id: true,
      email: true,
      status: true,
      createdAt: true,
      employee: {
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          employeeType: true,
          dateOfJoining: true,
          isActive: true,
          department: { select: { name: true } },
          salaryStructures: { where: { isActive: true }, select: { monthlySalary: true }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-full">
      <PageHeader
        title="Employee Management"
        subtitle={`${employees.length} employees in the system`}
        actions={
          <Link href="/hr/employees/new">
            <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
              <UserPlus className="w-4 h-4" /> Add Employee
            </button>
          </Link>
        }
      />

      <Card>
        {/* Mobile card list — shown below md */}
        <div className="md:hidden divide-y divide-stone-100">
          {employees.length === 0 ? (
            <div className="px-4 py-10 text-center text-stone-400 text-sm">No employees yet</div>
          ) : employees.map((u) => {
            const emp = u.employee;
            if (!emp) return null;
            const isActive = emp.isActive;
            const badgeVariant = u.status === "APPROVED" ? (isActive ? "green" : "amber") : u.status === "PENDING" ? "amber" : "red";
            const badgeLabel = u.status === "APPROVED" ? (isActive ? "Active" : "Inactive") : u.status;
            return (
              <div key={u.id} className="px-4 py-3 hover:bg-stone-50 transition-all">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/hr/employees/${emp.id}`} className="text-sm font-semibold text-stone-900 hover:text-orange-600 transition-colors">
                        {emp.firstName} {emp.lastName}
                      </Link>
                      <span className="text-[10px] font-mono font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">{emp.employeeCode}</span>
                      <Badge variant={badgeVariant} size="sm">{badgeLabel}</Badge>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5 truncate">{u.email}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-stone-500">
                      <Badge variant={emp.employeeType === "OFFICE" ? "blue" : "purple"} size="sm">{emp.employeeType}</Badge>
                      {emp.department && <span>{emp.department.name}</span>}
                      <span>{format(emp.dateOfJoining, "MMM d, yyyy")}</span>
                      {emp.salaryStructures[0] && (
                        <span className="font-semibold text-green-600">₹{Number(emp.salaryStructures[0].monthlySalary).toLocaleString("en-IN")}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    <EmployeeActions userId={u.id} status={u.status} employeeId={emp.id} isActive={isActive} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table — shown at md and above */}
        <div className="hidden md:block">
          <table className="w-full table-fixed">
            <colgroup>
              {/* Name+ID: flexible; Dept; Joined; Salary; Status; Actions */}
              <col className="w-[34%]" />
              <col className="w-[14%]" />
              <col className="w-[13%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[17%]" />
            </colgroup>
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                {["Employee", "Department", "Joined", "Salary", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {employees.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-stone-400 text-sm">No employees yet</td></tr>
              )}
              {employees.map((u) => {
                const emp = u.employee;
                if (!emp) return null;
                const isActive = emp.isActive;
                const badgeVariant = u.status === "APPROVED" ? (isActive ? "green" : "amber") : u.status === "PENDING" ? "amber" : "red";
                const badgeLabel = u.status === "APPROVED" ? (isActive ? "Active" : "Inactive") : u.status;
                return (
                  <tr key={u.id} className="hover:bg-stone-50/80 transition-all">
                    {/* Employee name + code + type */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link href={`/hr/employees/${emp.id}`} className="text-sm font-semibold text-stone-900 hover:text-orange-600 transition-colors truncate">
                              {emp.firstName} {emp.lastName}
                            </Link>
                            <Badge variant={emp.employeeType === "OFFICE" ? "blue" : "purple"} size="sm">{emp.employeeType}</Badge>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono font-bold text-orange-500">{emp.employeeCode}</span>
                            <span className="text-[10px] text-stone-300">·</span>
                            <span className="text-[10px] text-stone-400 truncate">{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-stone-600">{emp.department?.name ?? <span className="text-stone-300">—</span>}</td>

                    <td className="px-4 py-3 text-sm text-stone-600 whitespace-nowrap">{format(emp.dateOfJoining, "MMM d, yyyy")}</td>

                    <td className="px-4 py-3 text-sm font-semibold text-green-600">
                      {emp.salaryStructures[0]
                        ? `₹${Number(emp.salaryStructures[0].monthlySalary).toLocaleString("en-IN")}`
                        : <span className="text-stone-300 font-normal">—</span>}
                    </td>

                    <td className="px-4 py-3">
                      <Badge variant={badgeVariant}>{badgeLabel}</Badge>
                    </td>

                    <td className="px-4 py-3">
                      <EmployeeActions userId={u.id} status={u.status} employeeId={emp.id} isActive={isActive} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
