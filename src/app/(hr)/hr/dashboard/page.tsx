import { prisma } from "@/lib/prisma";
import { Users, Clock, Wallet, CalendarCheck, TrendingUp, AlertCircle } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { format } from "date-fns";

export default async function HRDashboard() {
  const [
    totalEmployees,
    pendingApprovals,
    pendingLeaves,
    latestPayrollRun,
    recentRegistrations,
    recentLeaves,
  ] = await Promise.all([
    prisma.employee.count({ where: { isActive: true } }),
    prisma.user.count({ where: { status: "PENDING", role: "EMPLOYEE" } }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.payrollRun.findFirst({ orderBy: { initiatedAt: "desc" } }),
    prisma.user.findMany({
      where: { role: "EMPLOYEE" },
      include: { employee: { include: { department: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.leaveRequest.findMany({
      where: { status: "PENDING" },
      include: { employee: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const payrollSteps = [
    "Upload Excel", "Validate", "Auto Calculate", "HR Review", "Approve", "Generate PDFs", "Send Emails"
  ];

  const statusStepMap: Record<string, number> = {
    DRAFT: 2,
    UNDER_REVIEW: 3,
    APPROVED: 5,
    PAYSLIPS_GENERATED: 6,
    EMAILS_SENT: 7,
    COMPLETED: 7,
  };

  const currentStep = latestPayrollRun ? statusStepMap[latestPayrollRun.status] ?? 0 : 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Good morning! Here's your payroll overview — ${format(new Date(), "MMMM d, yyyy")}`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Employees" value={totalEmployees} icon={Users} color="orange"
          sub="Active employees" trend={{ value: "3 new this month", up: true }} />
        <StatCard label="Pending Approvals" value={pendingApprovals} icon={Clock} color="amber"
          sub="Awaiting HR action" />
        <StatCard
          label="Payroll Status"
          value={latestPayrollRun
            ? { UNDER_REVIEW: "In Review", APPROVED: "Approved", PAYSLIPS_GENERATED: "PDFs Ready", EMAILS_SENT: "Emails Sent", COMPLETED: "Completed", DRAFT: "Draft" }[latestPayrollRun.status] ?? latestPayrollRun.status
            : "None"}
          icon={Wallet}
          color="green"
          sub={latestPayrollRun?.payrollMonth ?? "No payroll yet"}
        />
        <StatCard label="Leave Requests" value={pendingLeaves} icon={CalendarCheck} color="red"
          sub="Pending review" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Payroll Timeline */}
        <Card>
          <CardHeader title="Payroll Timeline" subtitle={latestPayrollRun?.payrollMonth ?? "No active payroll"} />
          <CardBody>
            {latestPayrollRun ? (
              <>
                <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
                  {payrollSteps.map((step, i) => {
                    const done = i < currentStep;
                    const active = i === currentStep;
                    return (
                      <div key={step} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                            done ? "bg-green-500 border-green-500 text-white"
                                 : active ? "bg-orange-500 border-orange-500 text-white"
                                 : "bg-white border-stone-200 text-stone-400"
                          }`}>
                            {done ? "✓" : i + 1}
                          </div>
                          <span className={`text-[9px] mt-1 text-center font-medium ${
                            done ? "text-green-600" : active ? "text-orange-600" : "text-stone-400"
                          }`}>{step}</span>
                        </div>
                        {i < payrollSteps.length - 1 && (
                          <div className={`h-0.5 flex-1 -mt-3 ${done ? "bg-green-400" : "bg-stone-200"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="bg-stone-50 rounded-xl p-4 text-sm space-y-2 border border-stone-100">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Period</span>
                    <span className="font-semibold text-stone-800">
                      {format(latestPayrollRun.periodStart, "MMM d")} – {format(latestPayrollRun.periodEnd, "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Employees</span>
                    <span className="font-semibold text-stone-800">{latestPayrollRun.totalEmployees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Total Net</span>
                    <span className="font-bold text-orange-600">₹{Number(latestPayrollRun.totalNet).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Status</span>
                    <Badge variant={latestPayrollRun.status === "COMPLETED" ? "green" : "orange"}>
                      {latestPayrollRun.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                <Link href="/hr/payroll">
                  <button className="mt-4 w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-all">
                    Continue Payroll →
                  </button>
                </Link>
              </>
            ) : (
              <div className="text-center py-8">
                <Wallet className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500 text-sm">No payroll run yet</p>
                <Link href="/hr/attendance/upload">
                  <button className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold">
                    Start Payroll
                  </button>
                </Link>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recent Registrations */}
        <Card>
          <CardHeader
            title="Recent Registrations"
            subtitle="Employees awaiting approval"
            actions={
              <Link href="/hr/employees" className="text-orange-500 text-xs font-semibold hover:text-orange-600">
                View All
              </Link>
            }
          />
          <div className="divide-y divide-stone-50">
            {recentRegistrations.length === 0 ? (
              <div className="px-6 py-8 text-center text-stone-400 text-sm">No registrations yet</div>
            ) : (
              recentRegistrations.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-stone-50 transition-all">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {u.employee?.firstName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">
                      {u.employee?.firstName} {u.employee?.lastName}
                    </p>
                    <p className="text-xs text-stone-400">{u.employee?.employeeType} · {format(u.createdAt, "MMM d, yyyy")}</p>
                  </div>
                  <Badge variant={u.status === "APPROVED" ? "green" : u.status === "PENDING" ? "amber" : "red"}>
                    {u.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Pending Leaves */}
      {recentLeaves.length > 0 && (
        <Card>
          <CardHeader
            title="Pending Leave Requests"
            subtitle={`${pendingLeaves} requests need your attention`}
            actions={
              <Link href="/hr/leaves">
                <button className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600">
                  Review All
                </button>
              </Link>
            }
          />
          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-stone-50">
            {recentLeaves.map((lr) => (
              <div key={lr.id} className="px-4 py-3 flex items-center gap-3 hover:bg-stone-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-900">{lr.employee.firstName} {lr.employee.lastName}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <Badge variant={lr.leaveType === "MEDICAL" ? "red" : lr.leaveType === "SICK" ? "amber" : "blue"} size="sm">{lr.leaveType}</Badge>
                    <span className="text-xs text-stone-400">{format(lr.fromDate, "MMM d")} – {format(lr.toDate, "MMM d")} · {Number(lr.totalDays)}d</span>
                  </div>
                </div>
                <Link href="/hr/leaves">
                  <button className="text-xs font-semibold text-orange-500 hover:text-orange-600 flex-shrink-0">Review →</button>
                </Link>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100">
                  {["Employee", "Leave Type", "From", "To", "Days", "Action"].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {recentLeaves.map((lr) => (
                  <tr key={lr.id} className="hover:bg-stone-50 transition-all">
                    <td className="px-6 py-3 text-sm font-medium text-stone-900">{lr.employee.firstName} {lr.employee.lastName}</td>
                    <td className="px-6 py-3">
                      <Badge variant={lr.leaveType === "MEDICAL" ? "red" : lr.leaveType === "SICK" ? "amber" : "blue"}>{lr.leaveType}</Badge>
                    </td>
                    <td className="px-6 py-3 text-sm text-stone-600">{format(lr.fromDate, "MMM d, yyyy")}</td>
                    <td className="px-6 py-3 text-sm text-stone-600">{format(lr.toDate, "MMM d, yyyy")}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-stone-800">{Number(lr.totalDays)}</td>
                    <td className="px-6 py-3">
                      <Link href="/hr/leaves"><button className="text-xs font-semibold text-orange-500 hover:text-orange-600">Review →</button></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
