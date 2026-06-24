"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle, Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import PayrollRecordCard, { PayrollRecord } from "@/components/hr/PayrollRecordCard";

interface PayrollRun {
  id: string;
  payrollMonth: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalEmployees: number;
  totalGross: number;
  totalNet: number;
  uploadId: string;
  upload: { id: string; status: string } | null;
  payrollRecords: PayrollRecord[];
}

export default function PayrollReviewPage() {
  const { runId } = useParams<{ runId: string }>();
  const router = useRouter();
  const [run, setRun] = useState<PayrollRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newAdj, setNewAdj] = useState<Record<string, { adjustmentType: "ADDITION" | "DEDUCTION"; amount: number; description: string }>>({});
  const [warehouseOt, setWarehouseOt] = useState<Record<string, { days: string; rate: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    fetch(`/api/hr/payroll/${runId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error || !d.payrollRecords) { setLoading(false); return; }
        setRun({ ...d, payrollRecords: d.payrollRecords ?? [] });
        const otInit: Record<string, { days: string; rate: string }> = {};
        for (const rec of (d.payrollRecords ?? []) as PayrollRecord[]) {
          if (rec.employee.employeeType === "WAREHOUSE") {
            otInit[rec.id] = { days: String(Number(rec.overtimeDays) || ""), rate: String(Number(rec.otAmountPerDay) || "") };
          }
        }
        setWarehouseOt(otInit);
        setLoading(false);
      });
  }, [runId]);

  const updateRecordStatus = async (recordId: string, status: "APPROVED" | "REJECTED") => {
    setSaving(recordId);
    const res = await fetch(`/api/hr/payroll/records/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setRun(prev => prev ? { ...prev, payrollRecords: prev.payrollRecords.map(r => r.id === recordId ? { ...r, status } : r) } : prev);
      toast.success(`Record ${status.toLowerCase()}`);
    } else toast.error("Failed to update");
    setSaving(null);
  };

  const saveWarehouseOt = async (recordId: string) => {
    const ot = warehouseOt[recordId];
    setSaving(recordId + "-ot");
    const res = await fetch(`/api/hr/payroll/records/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otDays: parseFloat(ot?.days || "0") || 0, otAmountPerDay: parseFloat(ot?.rate || "0") || 0 }),
    });
    if (res.ok) {
      const data = await res.json();
      setRun(prev => prev ? {
        ...prev,
        payrollRecords: prev.payrollRecords.map(r =>
          r.id === recordId ? { ...r, overtimeDays: data.overtimeDays, otAmountPerDay: data.otAmountPerDay, overtimeAmount: data.overtimeAmount, grossEarnings: data.grossEarnings, netSalary: data.netSalary } : r
        ),
      } : prev);
      toast.success("OT saved");
    } else toast.error("Failed to save OT");
    setSaving(null);
  };

  const addAdjustment = async (recordId: string) => {
    const adj = newAdj[recordId];
    if (!adj?.description || !adj?.amount) return toast.error("Fill all fields");
    setSaving(recordId + "-adj");
    const res = await fetch(`/api/hr/payroll/records/${recordId}/adjustments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adj),
    });
    if (res.ok) {
      const saved = await res.json();
      setRun(prev => prev ? {
        ...prev,
        payrollRecords: prev.payrollRecords.map(r => r.id === recordId ? { ...r, manualAdjustments: [...r.manualAdjustments, saved] } : r),
      } : prev);
      setNewAdj(prev => ({ ...prev, [recordId]: { adjustmentType: "ADDITION", amount: 0, description: "" } }));
      toast.success("Adjustment added");
    } else toast.error("Failed to add");
    setSaving(null);
  };

  const saveEdit = async (recordId: string, fields: Record<string, string>) => {
    const body = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, parseFloat(v) || 0]));
    const res = await fetch(`/api/hr/payroll/records/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      setRun(prev => prev ? {
        ...prev,
        payrollRecords: prev.payrollRecords.map(r => r.id === recordId ? { ...r, ...data } : r),
      } : prev);
      toast.success("Record updated");
    } else {
      toast.error(data.error || "Failed to save changes");
    }
  };

  const recalculate = async () => {
    if (!run?.uploadId) return toast.error("No upload linked to this payroll run");
    setRecalculating(true);
    const res = await fetch("/api/hr/payroll/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId: run.uploadId }),
    });
    if (res.ok) {
      toast.success("Payroll recalculated! Refreshing...");
      // Reload data
      const data = await fetch(`/api/hr/payroll/${runId}`).then(r => r.json());
      setRun(data);
    } else {
      const j = await res.json();
      toast.error(j.error || "Recalculation failed");
    }
    setRecalculating(false);
  };

  const approveAll = async () => {
    setApproving(true);
    const res = await fetch(`/api/hr/payroll/${runId}/approve`, { method: "POST" });
    if (res.ok) { toast.success("Payroll approved! Generating payslips..."); router.push("/hr/payroll"); }
    else toast.error("Failed to approve");
    setApproving(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-orange-400 animate-spin" /></div>;
  if (!run) return <div className="p-6 text-stone-500">Payroll run not found</div>;

  const allApproved = (run.payrollRecords ?? []).every(r => r.status === "APPROVED");

  return (
    <div>
      <PageHeader
        title={`Review Payroll — ${run.payrollMonth}`}
        subtitle={`${format(new Date(run.periodStart), "MMM d")} – ${format(new Date(run.periodEnd), "MMM d, yyyy")} · ${run.totalEmployees} employees`}
        actions={
          <div className="flex gap-2">
            <Button onClick={recalculate} disabled={recalculating} className="bg-stone-700 hover:bg-stone-800 text-white">
              {recalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Recalculate
            </Button>
            <Button onClick={approveAll} disabled={!allApproved || approving} className="bg-green-600 hover:bg-green-700 text-white">
              {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Approve & Generate Payslips
            </Button>
          </div>
        }
      />

      {!allApproved && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium">
          Approve all employee records before generating payslips
        </div>
      )}

      <div className="space-y-3">
        {(run.payrollRecords ?? []).map((rec) => {
          const adj = newAdj[rec.id] || { adjustmentType: "ADDITION" as const, amount: 0, description: "" };
          const ot = warehouseOt[rec.id] || { days: "", rate: "" };
          return (
            <PayrollRecordCard
              key={rec.id}
              rec={rec}
              isExpanded={expandedId === rec.id}
              onToggle={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
              saving={saving}
              onApprove={updateRecordStatus}
              adj={adj}
              onAdjChange={val => setNewAdj(p => ({ ...p, [rec.id]: { ...adj, ...val } }))}
              onAddAdj={addAdjustment}
              warehouseOt={ot}
              onOtChange={val => setWarehouseOt(p => ({ ...p, [rec.id]: { ...ot, ...val } }))}
              onSaveOt={saveWarehouseOt}
              onSaveEdit={saveEdit}
            />
          );
        })}
      </div>
    </div>
  );
}
