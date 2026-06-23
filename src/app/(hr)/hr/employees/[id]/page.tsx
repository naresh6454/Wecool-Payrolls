import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { format } from "date-fns";
import { User, Wallet, CalendarCheck, Clock, ArrowLeft, Mail, Phone, Building2, Briefcase, Pencil } from "lucide-react";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth("HR");
  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, status: true, role: true, createdAt: true } },
      department: true,
      designation: true,
      salaryStructures: { where: { isActive: true }, orderBy: { effectiveFrom: "desc" }, take: 1 },
      leaveBalances: { where: { year: new Date().getFullYear() } },
      leaveRequests: { orderBy: { createdAt: "desc" }, take: 5 },
      payrollRecords: { orderBy: { createdAt: "desc" }, take: 6 },
    },
  });

  if (!employee) notFound();

  const activeSalary = employee.salaryStructures[0];
  const latestPayroll = employee.payrollRecords[0];

  const statusVariant = (s: string): "green" | "amber" | "red" | "gray" =>
    s === "APPROVED" ? "green" : s === "PENDING" ? "amber" : s === "REJECTED" ? "red" : "gray";

  return (
    <div>
      <div className="mb-6">
        <Link href="/hr/employees" className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-all mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Employees
        </Link>
        <PageHeader
          title={`${employee.firstName} ${employee.lastName}`}
          subtitle={`${employee.employeeCode} · ${employee.employeeType} Employee`}
          actions={
            <div className="flex items-center gap-3">
              <Badge variant={statusVariant(employee.user.status)}>
                {employee.user.status}
              </Badge>
              <Link
                href={`/hr/employees/${employee.id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-all shadow-sm"
              >
                <Pencil className="w-4 h-4" /> Edit
              </Link>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Monthly Salary", value: activeSalary ? `₹${Number(activeSalary.monthlySalary).toLocaleString("en-IN")}` : "—", icon: Wallet, color: "bg-green-100 text-green-600" },
          { label: "Last Net Pay", value: latestPayroll ? `₹${Number(latestPayroll.netSalary).toLocaleString("en-IN")}` : "—", icon: Wallet, color: "bg-orange-100 text-orange-600" },
          { label: "Joined", value: format(new Date(employee.dateOfJoining), "MMM d, yyyy"), icon: Clock, color: "bg-blue-100 text-blue-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-400 font-semibold">{s.label}</p>
              <p className="text-lg font-black text-stone-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Info */}
        <Card>
          <CardHeader title="Personal Information" icon={<User className="w-4 h-4" />} />
          <div className="px-6 pb-5 pt-4 space-y-3">
            {[
              { label: "Full Name", value: `${employee.firstName} ${employee.lastName}`, icon: User },
              { label: "Email", value: employee.user.email, icon: Mail },
              { label: "Phone", value: employee.phone || "—", icon: Phone },
              { label: "Department", value: employee.department?.name || "—", icon: Building2 },
              { label: "Designation", value: employee.designation?.name || "—", icon: Briefcase },
              { label: "Employee Type", value: employee.employeeType, icon: User },
              { label: "Gender", value: employee.gender || "—", icon: User },
              { label: "Bank Account", value: employee.bankAccountNo || "—", icon: Wallet },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start py-1 border-b border-stone-50 last:border-0">
                <span className="text-xs font-semibold text-stone-400">{label}</span>
                <span className="text-sm font-medium text-stone-800 text-right max-w-48">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          {/* Leave Balances */}
          <Card>
            <CardHeader title="Leave Balances" subtitle={`Year ${new Date().getFullYear()}`} icon={<CalendarCheck className="w-4 h-4" />} />
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {employee.leaveBalances.length === 0 ? (
                <p className="col-span-2 text-sm text-stone-400 text-center py-4">No leave balances set</p>
              ) : employee.leaveBalances.map((lb) => {
                const used = Number(lb.used);
                const allocated = Number(lb.totalAllocated);
                const avail = Math.max(0, allocated - used);
                const pct = allocated > 0 ? Math.min((used / allocated) * 100, 100) : 0;
                return (
                  <div key={lb.id} className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-stone-500">{lb.leaveType}</span>
                      <span className="text-sm font-bold text-orange-600">{avail.toFixed(1)} days</span>
                    </div>
                    <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-1.5 bg-orange-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-stone-400 mt-1">{used.toFixed(1)} used of {allocated.toFixed(1)}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Recent Leave Requests */}
          <Card>
            <CardHeader title="Recent Leave Requests" />
            {employee.leaveRequests.length === 0 ? (
              <div className="px-6 py-6 text-center text-stone-400 text-sm">No leave requests</div>
            ) : (
              <div className="divide-y divide-stone-50">
                {employee.leaveRequests.map((lr) => (
                  <div key={lr.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-stone-800">{lr.leaveType} — {Number(lr.totalDays)} day(s)</p>
                      <p className="text-xs text-stone-400">{format(new Date(lr.fromDate), "MMM d")} – {format(new Date(lr.toDate), "MMM d, yyyy")}</p>
                    </div>
                    <Badge variant={statusVariant(lr.status)} size="sm">{lr.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Payroll History */}
        <Card className="col-span-2">
          <CardHeader title="Payroll History" subtitle="Last 6 payroll records" />
          {employee.payrollRecords.length === 0 ? (
            <div className="px-6 py-10 text-center text-stone-400 text-sm">No payroll records yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100">
                    {["Present", "Week Off", "LOP", "Late", "Gross", "Deductions", "Net Pay", "Status"].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-bold text-stone-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {employee.payrollRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-50 transition-all">
                      <td className="px-6 py-3 text-stone-700">{Number(r.presentDays)}d</td>
                      <td className="px-6 py-3 text-blue-500">{Number(r.weeklyOffDays)}d</td>
                      <td className="px-6 py-3 text-red-500">{Number(r.lopDays)}d</td>
                      <td className="px-6 py-3 text-amber-600">{r.lateCount}×</td>
                      <td className="px-6 py-3 text-stone-700">₹{Number(r.grossEarnings).toLocaleString("en-IN")}</td>
                      <td className="px-6 py-3 text-red-500">-₹{Number(r.totalDeductions).toLocaleString("en-IN")}</td>
                      <td className="px-6 py-3 font-bold text-green-600">₹{Number(r.netSalary).toLocaleString("en-IN")}</td>
                      <td className="px-6 py-3">
                        <Badge variant={r.status === "APPROVED" ? "green" : "amber"} size="sm">{r.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
