import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { format } from "date-fns";
import { ClipboardCheck, Users, AlertCircle, ArrowRight } from "lucide-react";

export default async function PayrollReviewListPage() {
  await requireAuth("HR");

  const runs = await prisma.payrollRun.findMany({
    where: { status: { in: ["DRAFT", "UNDER_REVIEW"] } },
    include: {
      payrollRecords: { select: { id: true, status: true } },
      initiatedBy: { select: { email: true } },
    },
    orderBy: { initiatedAt: "desc" },
  });

  const allRuns = await prisma.payrollRun.findMany({
    where: { status: { in: ["APPROVED", "PAYSLIPS_GENERATED", "COMPLETED"] } },
    include: { payrollRecords: { select: { id: true } } },
    orderBy: { initiatedAt: "desc" },
    take: 5,
  });

  return (
    <div>
      <PageHeader
        title="Payroll Review"
        subtitle="Review and approve employee payroll records"
        icon={<ClipboardCheck className="w-5 h-5" />}
      />

      {/* Pending Review */}
      <Card className="mb-6">
        <CardHeader
          title="Pending Review"
          subtitle="Payroll runs waiting for your approval"
        />
        {runs.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck className="w-7 h-7 text-green-500" />
            </div>
            <p className="text-stone-600 font-semibold">All caught up!</p>
            <p className="text-stone-400 text-sm mt-1">No payroll runs are pending review</p>
            <Link
              href="/hr/attendance/upload"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-all"
            >
              Start New Payroll Run
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {runs.map((run) => {
              const approved = run.payrollRecords.filter(r => r.status === "APPROVED").length;
              const total = run.payrollRecords.length;
              const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
              return (
                <div key={run.id} className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 transition-all">
                  <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <ClipboardCheck className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-stone-900">{run.payrollMonth}</p>
                      <Badge variant="amber">Needs Review</Badge>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {format(new Date(run.periodStart), "MMM d")} – {format(new Date(run.periodEnd), "MMM d, yyyy")}
                      <span className="mx-1.5">·</span>
                      {run.totalEmployees} employees
                      <span className="mx-1.5">·</span>
                      Net: <span className="font-semibold text-green-600">₹{Number(run.totalNet).toLocaleString("en-IN")}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 max-w-32 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-1.5 bg-green-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-stone-400">{approved}/{total} approved</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-stone-400">
                      <Users className="w-3.5 h-3.5" />
                      {total - approved} remaining
                    </div>
                    <Link
                      href={`/hr/payroll/${run.id}/review`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-xs font-semibold rounded-xl hover:bg-orange-600 transition-all"
                    >
                      Review Now <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Recently Approved */}
      {allRuns.length > 0 && (
        <Card>
          <CardHeader title="Recently Approved" subtitle="Last 5 completed payroll runs" />
          <div className="divide-y divide-stone-50">
            {allRuns.map((run) => (
              <div key={run.id} className="flex items-center gap-4 px-6 py-3 hover:bg-stone-50 transition-all">
                <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-stone-900">{run.payrollMonth}</p>
                  <p className="text-xs text-stone-400">{run.payrollRecords.length} employees</p>
                </div>
                <Badge variant="green">{run.status.replace("_", " ")}</Badge>
                <Link href={`/hr/payroll/${run.id}/review`} className="text-xs text-orange-500 font-semibold hover:underline">
                  View
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
