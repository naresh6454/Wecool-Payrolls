import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { Wallet, CalendarCheck, Clock, TrendingDown, Download, Bell } from "lucide-react";
import { format } from "date-fns";

export default async function EmployeeDashboard() {
  const user = await getAuthUser();
  if (!user || !user.employee) redirect("/login");

  const emp = user.employee;

  const [payslips, leaveBalances, recentLeave, notifications, latestRecord] = await Promise.all([
    prisma.payslip.findMany({
      where: { employeeId: emp.id },
      include: { payrollRunRel: true },
      orderBy: { generatedAt: "desc" },
      take: 5,
    }),
    prisma.leaveBalance.findMany({
      where: { employeeId: emp.id, year: new Date().getFullYear() },
    }),
    prisma.leaveRequest.findMany({
      where: { employeeId: emp.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.payrollRecord.findFirst({
      where: { employeeId: emp.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalLeaveBalance = leaveBalances.reduce((acc, b) => {
    if (b.leaveType !== "LOP") acc += Number(b.totalAllocated) - Number(b.used);
    return acc;
  }, 0);

  const latestPayslip = payslips[0];

  return (
    <div>
      <PageHeader
        title={`Welcome, ${emp.firstName}! 👋`}
        subtitle={`${emp.employeeCode} · ${emp.employeeType} Employee · ${format(new Date(), "MMMM d, yyyy")}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Last Net Pay"
          value={latestPayslip ? `₹${Number(latestPayslip.netSalary).toLocaleString("en-IN")}` : "—"}
          icon={Wallet}
          color="green"
          sub={latestPayslip ? latestPayslip.payrollRunRel.payrollMonth : "No payslip yet"}
        />
        <StatCard
          label="Leave Balance"
          value={`${totalLeaveBalance.toFixed(1)} days`}
          icon={CalendarCheck}
          color="orange"
          sub={`${new Date().getFullYear()} total`}
        />
        <StatCard
          label="Present Days"
          value={latestRecord ? Number(latestRecord.presentDays) : "—"}
          icon={Clock}
          color="blue"
          sub="Last payroll period"
        />
        <StatCard
          label="LOP Days"
          value={latestRecord ? Number(latestRecord.lopDays) : 0}
          icon={TrendingDown}
          color={latestRecord && Number(latestRecord.lopDays) > 0 ? "red" : "green"}
          sub="Loss of pay"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payslips */}
        <Card>
          <CardHeader
            title="My Recent Payslips"
            actions={<Link href="/employee/payslips" className="text-orange-500 text-xs font-semibold">View All</Link>}
          />
          <div className="divide-y divide-stone-50">
            {payslips.length === 0 ? (
              <div className="px-6 py-10 text-center text-stone-400 text-sm">No payslips yet</div>
            ) : payslips.map((ps) => (
              <div key={ps.id} className="flex items-center gap-3 px-6 py-3 hover:bg-stone-50 transition-all">
                <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-stone-900">{ps.payrollRunRel.payrollMonth}</p>
                  <p className="text-xs text-stone-400">Net: <span className="font-semibold text-green-600">₹{Number(ps.netSalary).toLocaleString("en-IN")}</span></p>
                </div>
                <a href={ps.filePath} download className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-all">
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader
            title="Notifications"
            actions={<Badge variant="orange">{notifications.filter(n => !n.isRead).length} New</Badge>}
          />
          <div className="divide-y divide-stone-50">
            {notifications.length === 0 ? (
              <div className="px-6 py-10 text-center text-stone-400 text-sm">No notifications</div>
            ) : notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 px-6 py-3 hover:bg-stone-50 transition-all">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.isRead ? "bg-stone-200" : "bg-orange-500"}`} />
                <div>
                  <p className="text-sm font-semibold text-stone-900">{n.title}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-stone-300 mt-1">{format(n.createdAt, "MMM d, h:mm a")}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Leave Balance */}
        <Card>
          <CardHeader title="Leave Balances" subtitle={`Year ${new Date().getFullYear()}`} />
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {leaveBalances.map((lb) => {
              const balance = Number(lb.totalAllocated) - Number(lb.used);
              const pct = Number(lb.totalAllocated) > 0 ? (Number(lb.used) / Number(lb.totalAllocated)) * 100 : 0;
              return (
                <div key={lb.id} className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-stone-500">{lb.leaveType}</span>
                    <span className="text-sm font-bold text-orange-600">{balance.toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div className="h-1.5 bg-orange-400 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <p className="text-xs text-stone-400 mt-1">{Number(lb.used)} used of {Number(lb.totalAllocated)}</p>
                </div>
              );
            })}
          </div>
          <div className="px-6 pb-4">
            <Link href="/employee/leaves">
              <button className="w-full py-2 border border-orange-200 text-orange-500 rounded-xl text-sm font-semibold hover:bg-orange-50 transition-all">
                Apply for Leave
              </button>
            </Link>
          </div>
        </Card>

        {/* Recent Leaves */}
        <Card>
          <CardHeader title="My Leave Requests" />
          <div className="divide-y divide-stone-50">
            {recentLeave.length === 0 ? (
              <div className="px-6 py-10 text-center text-stone-400 text-sm">No leave requests</div>
            ) : recentLeave.map((lr) => (
              <div key={lr.id} className="flex items-center gap-3 px-6 py-3 hover:bg-stone-50 transition-all">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <CalendarCheck className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-stone-900">
                    {lr.leaveType} — {Number(lr.totalDays)} day{Number(lr.totalDays) > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-stone-400">
                    {format(lr.fromDate, "MMM d")} – {format(lr.toDate, "MMM d, yyyy")}
                  </p>
                </div>
                <Badge variant={lr.status === "APPROVED" ? "green" : lr.status === "PENDING" ? "amber" : "red"}>
                  {lr.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
