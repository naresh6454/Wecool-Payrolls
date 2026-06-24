import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { format } from "date-fns";
import { Shield } from "lucide-react";

export default async function AuditPage() {
  await requireAuth("HR");

  const logs = await prisma.auditLog.findMany({
    include: { actor: { select: { email: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const actionColors: Record<string, string> = {
    USER_LOGIN: "bg-blue-100 text-blue-700",
    EMPLOYEE_APPROVED: "bg-green-100 text-green-700",
    EMPLOYEE_REJECTED: "bg-red-100 text-red-600",
    EMPLOYEE_REGISTERED: "bg-orange-100 text-orange-700",
    LEAVE_APPROVED: "bg-green-100 text-green-700",
    LEAVE_REJECTED: "bg-red-100 text-red-600",
    OT_APPROVED: "bg-green-100 text-green-700",
    OT_REJECTED: "bg-red-100 text-red-600",
    PAYROLL_APPROVED: "bg-emerald-100 text-emerald-700",
    PAYROLL_PROCESSED: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Complete trail of all system actions"
        icon={<Shield className="w-5 h-5" />}
      />

      <Card>
        <CardHeader title={`${logs.length} Recent Actions`} subtitle="Last 100 entries" />
        <div className="divide-y divide-stone-50">
          {logs.length === 0 ? (
            <div className="px-6 py-12 text-center text-stone-400">No audit logs yet</div>
          ) : logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 px-4 sm:px-6 py-3 hover:bg-stone-50 transition-all">
              <div className="flex-shrink-0 pt-0.5 hidden sm:block w-32">
                <p className="text-xs text-stone-400">{format(log.createdAt, "MMM d, h:mm a")}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${actionColors[log.action] || "bg-stone-100 text-stone-600"}`}>
                    {log.action.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm text-stone-700 truncate">{log.description}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0 mt-0.5 text-xs text-stone-400">
                  <span className="sm:hidden">{format(log.createdAt, "MMM d, h:mm a")} ·</span>
                  <span className="truncate">{log.actor?.email || "System"}</span>
                  <span>·</span>
                  <span>{log.actorRole}</span>
                  <span>·</span>
                  <span>{log.entityType}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
