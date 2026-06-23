import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { format } from "date-fns";
import LeaveActionButtons from "./LeaveActionButtons";
import OTActionButtons from "./OTActionButtons";

export default async function LeavesPage() {
  const [leaveRequests, overtimeRequests] = await Promise.all([
    prisma.leaveRequest.findMany({
      include: { employee: { include: { department: true } } },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.overtimeRequest.findMany({
      include: { employee: { include: { department: true } } },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const pending = leaveRequests.filter(l => l.status === "PENDING");
  const otPending = overtimeRequests.filter(o => o.status === "PENDING");

  return (
    <div>
      <PageHeader
        title="Leave & OT Approval"
        subtitle={`${pending.length} leave · ${otPending.length} OT pending`}
      />

      {/* Leave Requests */}
      <Card className="mb-6">
        <CardHeader title="Leave Requests" subtitle={`${pending.length} pending`} actions={<Badge variant="orange">{pending.length} Pending</Badge>} />

        {/* Mobile cards */}
        <div className="lg:hidden divide-y divide-stone-100">
          {leaveRequests.length === 0 ? (
            <div className="px-4 py-10 text-center text-stone-400 text-sm">No leave requests</div>
          ) : leaveRequests.map((lr) => (
            <div key={lr.id} className="px-4 py-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-stone-900">{lr.employee.firstName} {lr.employee.lastName}</p>
                  <p className="text-xs text-stone-400">{lr.employee.employeeCode}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={lr.status === "APPROVED" ? "green" : lr.status === "PENDING" ? "amber" : "red"} size="sm">{lr.status}</Badge>
                  <Badge variant={lr.leaveType === "MEDICAL" ? "red" : lr.leaveType === "SICK" ? "amber" : lr.leaveType === "LOP" ? "gray" : "blue"} size="sm">{lr.leaveType}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-stone-500">
                <span>{format(lr.fromDate, "MMM d")} – {format(lr.toDate, "MMM d, yyyy")}</span>
                <span className="font-semibold text-stone-700">{Number(lr.totalDays)} days</span>
              </div>
              {lr.reason && <p className="text-xs text-stone-400 line-clamp-2">{lr.reason}</p>}
              {lr.status === "PENDING" && <div className="pt-1"><LeaveActionButtons leaveId={lr.id} /></div>}
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                {["Employee", "Type", "From", "To", "Days", "Reason", "Status", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {leaveRequests.map((lr) => (
                <tr key={lr.id} className="hover:bg-stone-50 transition-all">
                  <td className="px-5 py-3">
                    <p className="text-sm font-semibold text-stone-900">{lr.employee.firstName} {lr.employee.lastName}</p>
                    <p className="text-xs text-stone-400">{lr.employee.employeeCode}</p>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={lr.leaveType === "MEDICAL" ? "red" : lr.leaveType === "SICK" ? "amber" : lr.leaveType === "LOP" ? "gray" : "blue"}>{lr.leaveType}</Badge>
                  </td>
                  <td className="px-5 py-3 text-sm text-stone-600">{format(lr.fromDate, "MMM d, yyyy")}</td>
                  <td className="px-5 py-3 text-sm text-stone-600">{format(lr.toDate, "MMM d, yyyy")}</td>
                  <td className="px-5 py-3 text-sm font-bold text-stone-800">{Number(lr.totalDays)}</td>
                  <td className="px-5 py-3 text-sm text-stone-500 max-w-[160px] truncate">{lr.reason}</td>
                  <td className="px-5 py-3">
                    <Badge variant={lr.status === "APPROVED" ? "green" : lr.status === "PENDING" ? "amber" : "red"}>{lr.status}</Badge>
                  </td>
                  <td className="px-5 py-3">{lr.status === "PENDING" && <LeaveActionButtons leaveId={lr.id} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* OT Requests */}
      <Card>
        <CardHeader title="Overtime Requests" subtitle={`${otPending.length} pending`} actions={<Badge variant="orange">{otPending.length} Pending</Badge>} />

        {/* Mobile cards */}
        <div className="lg:hidden divide-y divide-stone-100">
          {overtimeRequests.length === 0 ? (
            <div className="px-4 py-10 text-center text-stone-400 text-sm">No overtime requests</div>
          ) : overtimeRequests.map((ot) => (
            <div key={ot.id} className="px-4 py-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-stone-900">{ot.employee.firstName} {ot.employee.lastName}</p>
                  <p className="text-xs text-stone-400">{ot.employee.employeeCode}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={ot.status === "APPROVED" ? "green" : ot.status === "PENDING" ? "amber" : "red"} size="sm">{ot.status}</Badge>
                  <Badge variant={ot.employee.employeeType === "OFFICE" ? "blue" : "purple"} size="sm">{ot.employee.employeeType}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-stone-500">
                <span>{format(ot.overtimeDate, "MMM d, yyyy")}</span>
                <span className="font-semibold text-stone-700">{Number(ot.hoursWorked)}h</span>
                <span className="text-green-600 font-semibold">{ot.employee.employeeType === "WAREHOUSE" ? "₹1,000/day" : "1 day salary"}</span>
              </div>
              {ot.reason && <p className="text-xs text-stone-400">{ot.reason}</p>}
              {ot.status === "PENDING" && <div className="pt-1"><OTActionButtons otId={ot.id} /></div>}
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                {["Employee", "Type", "Date", "Hours", "Rate", "Reason", "Status", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {overtimeRequests.map((ot) => (
                <tr key={ot.id} className="hover:bg-stone-50 transition-all">
                  <td className="px-5 py-3">
                    <p className="text-sm font-semibold text-stone-900">{ot.employee.firstName} {ot.employee.lastName}</p>
                    <p className="text-xs text-stone-400">{ot.employee.employeeCode}</p>
                  </td>
                  <td className="px-5 py-3"><Badge variant={ot.employee.employeeType === "OFFICE" ? "blue" : "purple"}>{ot.employee.employeeType}</Badge></td>
                  <td className="px-5 py-3 text-sm text-stone-600">{format(ot.overtimeDate, "MMM d, yyyy")}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-stone-800">{Number(ot.hoursWorked)}h</td>
                  <td className="px-5 py-3 text-sm font-semibold text-green-600">{ot.employee.employeeType === "WAREHOUSE" ? "₹1,000/day" : "1 day salary"}</td>
                  <td className="px-5 py-3 text-sm text-stone-500 max-w-[140px] truncate">{ot.reason ?? "—"}</td>
                  <td className="px-5 py-3"><Badge variant={ot.status === "APPROVED" ? "green" : ot.status === "PENDING" ? "amber" : "red"}>{ot.status}</Badge></td>
                  <td className="px-5 py-3">{ot.status === "PENDING" && <OTActionButtons otId={ot.id} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
