import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { format } from "date-fns";
import { CheckCircle, Clock, FileText, Users, AlertCircle } from "lucide-react";

export default async function PayrollPage() {
  await requireAuth("HR");

  const runs = await prisma.payrollRun.findMany({
    include: { initiatedBy: true, payrollRecords: { select: { id: true, status: true } } },
    orderBy: { initiatedAt: "desc" },
    take: 10,
  });

  const statusMap: Record<string, { label: string; variant: "green" | "amber" | "orange" | "red" | "default" }> = {
    DRAFT:              { label: "Draft",            variant: "amber" },
    UNDER_REVIEW:       { label: "In Review",        variant: "orange" },
    APPROVED:           { label: "Approved",         variant: "green" },
    PAYSLIPS_GENERATED: { label: "Payslips Ready",   variant: "green" },
    EMAILS_SENT:        { label: "Emails Sent",      variant: "green" },
    COMPLETED:          { label: "Completed",        variant: "green" },
  };

  return (
    <div>
      <PageHeader
        title="Payroll Runs"
        subtitle="Manage payroll processing cycles"
        actions={
          <Link
            href="/hr/attendance/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-all shadow-sm"
          >
            <FileText className="w-4 h-4" />
            New Payroll Run
          </Link>
        }
      />

      {/* How it works */}
      <Card className="mb-6 bg-orange-50 border-orange-100">
        <div className="p-5">
          <p className="text-sm font-semibold text-orange-700 mb-3">Payroll Workflow</p>
          <div className="flex items-center gap-2 flex-wrap">
            {["1. Upload Attendance Excel", "2. Validate Records", "3. Process Payroll", "4. Review & Adjust", "5. Approve", "6. Generate Payslips", "7. Send to Employees"].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs bg-white border border-orange-200 text-orange-700 px-2 py-1 rounded-lg font-medium">{step}</span>
                {i < 6 && <span className="text-orange-300">→</span>}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Payroll History" subtitle="All payroll runs" />
        {runs.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-stone-400" />
            </div>
            <p className="text-stone-500 font-medium mb-1">No payroll runs yet</p>
            <p className="text-stone-400 text-sm mb-4">Upload attendance data to start your first payroll run</p>
            <Link
              href="/hr/attendance/upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-all"
            >
              Upload Attendance
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {runs.map((run) => {
              const s = statusMap[run.status] || { label: run.status, variant: "default" as const };
              const approved = run.payrollRecords.filter(r => r.status === "APPROVED").length;
              return (
                <div key={run.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-stone-50 transition-all">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-stone-900">{run.payrollMonth}</p>
                      <p className="text-xs text-stone-400 truncate">
                        {format(run.periodStart, "MMM d")} – {format(run.periodEnd, "MMM d, yyyy")} · {run.totalEmployees} emp · Net: <span className="font-semibold text-green-600">₹{Number(run.totalNet).toLocaleString("en-IN")}</span>
                      </p>
                      <div className="flex items-center gap-3 text-xs text-stone-400 mt-0.5 sm:hidden">
                        <span>{approved}/{run.payrollRecords.length} approved</span>
                        <span>{format(run.initiatedAt, "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-xs text-stone-400 flex-shrink-0">
                    <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /><span>{approved}/{run.payrollRecords.length} approved</span></div>
                    <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /><span>{format(run.initiatedAt, "MMM d, yyyy")}</span></div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={s.variant}>{s.label}</Badge>
                    {(run.status === "DRAFT" || run.status === "UNDER_REVIEW") && (
                      <Link href={`/hr/payroll/${run.id}/review`} className="px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition-all">Review</Link>
                    )}
                    {run.status === "APPROVED" && (
                      <Link href={`/hr/payroll/${run.id}/payslips`} className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-all">Payslips</Link>
                    )}
                    {(run.status === "COMPLETED" || run.status === "EMAILS_SENT") && (
                      <div className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" /><span className="text-xs font-semibold">Done</span></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
