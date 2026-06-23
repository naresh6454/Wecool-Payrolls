"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Mail, CheckCircle, XCircle, Clock, Send } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import toast from "react-hot-toast";
import PageHeader from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface Payslip {
  id: string;
  fileName: string;
  netSalary: number;
  emailSent: boolean;
  emailSentAt: string | null;
  emailError: string | null;
  generatedAt: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeCode: string;
    employeeType: string;
    user: { email: string };
  };
}

interface RunInfo {
  payrollMonth: string;
  status: string;
  totalEmployees: number;
}

export default function PayslipsPage() {
  const { runId } = useParams<{ runId: string }>();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [run, setRun] = useState<RunInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/hr/payroll/${runId}`).then(r => r.json()),
      fetch(`/api/hr/payroll/${runId}/payslips`).then(r => r.json()),
    ]).then(([runData, slipsData]) => {
      setRun(runData);
      setPayslips(Array.isArray(slipsData) ? slipsData : []);
      setLoading(false);
    });
  }, [runId]);

  const resendEmail = async (payslipId: string) => {
    setResending(payslipId);
    const res = await fetch(`/api/hr/payroll/${runId}/payslips/${payslipId}/resend`, { method: "POST" });
    if (res.ok) {
      toast.success("Email resent successfully");
      setPayslips(p => p.map(s => s.id === payslipId ? { ...s, emailSent: true, emailSentAt: new Date().toISOString(), emailError: null } : s));
    } else {
      toast.error("Failed to resend email");
    }
    setResending(null);
  };

  if (loading) return <div className="p-6 text-stone-400 text-sm">Loading payslips...</div>;

  const sent = payslips.filter(p => p.emailSent).length;
  const failed = payslips.filter(p => !p.emailSent && p.emailError).length;
  const pending = payslips.filter(p => !p.emailSent && !p.emailError).length;

  return (
    <div>
      <div className="mb-6">
        <Link href={`/hr/payroll/${runId}/review`}
          className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Review
        </Link>
        <PageHeader
          title={`Payslips — ${run?.payrollMonth ?? ""}`}
          subtitle={`${payslips.length} payslips generated`}
          icon={<Mail className="w-5 h-5" />}
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Emails Sent", value: sent, color: "text-green-600", bg: "bg-green-50 border-green-100", icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
          { label: "Failed", value: failed, color: "text-red-600", bg: "bg-red-50 border-red-100", icon: <XCircle className="w-5 h-5 text-red-500" /> },
          { label: "Pending", value: pending, color: "text-amber-600", bg: "bg-amber-50 border-amber-100", icon: <Clock className="w-5 h-5 text-amber-500" /> },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-4 p-4 rounded-xl border ${s.bg}`}>
            {s.icon}
            <div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-stone-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Payslip list */}
      <Card>
        <div className="divide-y divide-stone-100">
          {payslips.length === 0 ? (
            <div className="p-10 text-center text-stone-400 text-sm">
              No payslips generated yet. Approve the payroll run to generate them.
            </div>
          ) : payslips.map(p => (
            <div key={p.id} className="flex items-center gap-4 px-6 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-stone-800 text-sm">
                    {p.employee.firstName} {p.employee.lastName}
                  </span>
                  <Badge variant="default" size="sm">{p.employee.employeeCode}</Badge>
                  <Badge variant={p.employee.employeeType === "OFFICE" ? "blue" : "purple"} size="sm">
                    {p.employee.employeeType}
                  </Badge>
                </div>
                <div className="text-xs text-stone-400">{p.employee.user.email}</div>
                {p.emailError && (
                  <div className="text-xs text-red-500 mt-0.5">{p.emailError}</div>
                )}
              </div>

              <div className="text-right mr-6">
                <div className="text-sm font-bold text-green-600">
                  ₹{Number(p.netSalary).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-stone-400">Net Pay</div>
              </div>

              <div className="flex items-center gap-2">
                {p.emailSent ? (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    {p.emailSentAt ? format(new Date(p.emailSentAt), "dd MMM, hh:mm a") : "Sent"}
                  </div>
                ) : p.emailError ? (
                  <button
                    onClick={() => resendEmail(p.id)}
                    disabled={resending === p.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-all">
                    <Send className="w-3.5 h-3.5" />
                    {resending === p.id ? "Sending..." : "Retry"}
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                    <Clock className="w-4 h-4" />
                    Pending
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
