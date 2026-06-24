"use client";

import { useState } from "react";
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Plus, Loader2, Pencil, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface ManualAdjustment {
  id?: string;
  adjustmentType: "ADDITION" | "DEDUCTION";
  amount: number;
  description: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  status: string;
  monthlySalary: number;
  perDaySalary: number;
  presentDays: number;
  absentDays: number;
  paidLeaveDays: number;
  lopDays: number;
  halfDays: number;
  lateCount: number;
  overtimeDays: number;
  otAmountPerDay: number;
  weeklyOffDays: number;
  basicSalary: number;
  hra: number;
  conveyance: number;
  bonus: number;
  specialAllowance: number;
  overtimeAmount: number;
  grossEarnings: number;
  professionalTax: number;
  lopDeduction: number;
  lateDeduction: number;
  totalDeductions: number;
  netSalary: number;
  employee: { firstName: string; lastName: string; employeeCode: string; employeeType: string };
  manualAdjustments: ManualAdjustment[];
  leaveBalance: { totalAllocated: number; used: number } | null;
}

type EditFields = {
  basicSalary: string; hra: string; conveyance: string; bonus: string;
  specialAllowance: string; overtimeAmount: string;
  professionalTax: string; lopDeduction: string; lateDeduction: string;
  presentDays: string; lopDays: string; lateCount: string;
};

interface Props {
  rec: PayrollRecord;
  isExpanded: boolean;
  onToggle: () => void;
  saving: string | null;
  onApprove: (id: string, status: "APPROVED" | "REJECTED") => void;
  adj: ManualAdjustment;
  onAdjChange: (val: Partial<ManualAdjustment>) => void;
  onAddAdj: (id: string) => void;
  warehouseOt: { days: string; rate: string };
  onOtChange: (val: { days?: string; rate?: string }) => void;
  onSaveOt: (id: string) => void;
  onSaveEdit: (id: string, fields: EditFields) => Promise<void>;
}

const fmt = (n: number) => Number(n).toLocaleString("en-IN");

export default function PayrollRecordCard({
  rec, isExpanded, onToggle, saving, onApprove,
  adj, onAdjChange, onAddAdj,
  warehouseOt: ot, onOtChange, onSaveOt, onSaveEdit,
}: Props) {
  const isWarehouse = rec.employee.employeeType === "WAREHOUSE";
  const otTotal = (parseFloat(ot.days || "0") || 0) * (parseFloat(ot.rate || "0") || 0);

  const perDay = Number(rec.perDaySalary) || (Number(rec.monthlySalary) / 26);
  // settings assumed from record (professional tax is fixed)
  const LATE_FREE = 3;
  const LATE_PER_HALF = 2;

  const initFields = (): EditFields => ({
    basicSalary: String(Number(rec.basicSalary)),
    hra: String(Number(rec.hra)),
    conveyance: String(Number(rec.conveyance)),
    bonus: String(Number(rec.bonus)),
    specialAllowance: String(Number(rec.specialAllowance)),
    overtimeAmount: String(Number(rec.overtimeAmount)),
    professionalTax: String(Number(rec.professionalTax)),
    lopDeduction: String(Number(rec.lopDeduction)),
    lateDeduction: String(Number(rec.lateDeduction)),
    presentDays: String(Number(rec.presentDays)),
    lopDays: String(Number(rec.lopDays)),
    lateCount: String(Number(rec.lateCount)),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [fields, setFields] = useState<EditFields>(initFields);

  // Derived live calculations shown during edit
  const liveGross = (parseFloat(fields.basicSalary) || 0) + (parseFloat(fields.hra) || 0) +
    (parseFloat(fields.conveyance) || 0) + (parseFloat(fields.bonus) || 0) +
    (parseFloat(fields.specialAllowance) || 0) + (parseFloat(fields.overtimeAmount) || 0);
  const liveDed = (parseFloat(fields.professionalTax) || 0) + (parseFloat(fields.lopDeduction) || 0) +
    (parseFloat(fields.lateDeduction) || 0);
  const liveNet = Math.max(0, liveGross - liveDed);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFields(initFields());
    setIsEditing(true);
  };

  const saveEdit = async () => {
    setEditSaving(true);
    await onSaveEdit(rec.id, fields);
    setEditSaving(false);
    setIsEditing(false);
  };

  const f = (key: keyof EditFields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFields(prev => {
      const next = { ...prev, [key]: val };
      // Auto-recalculate LOP deduction when lopDays changes
      if (key === "lopDays") {
        const lop = parseFloat(val) || 0;
        next.lopDeduction = String(Math.round(lop * perDay * 100) / 100);
      }
      // Auto-recalculate late deduction when lateCount changes
      if (key === "lateCount") {
        const late = parseFloat(val) || 0;
        const billableLates = Math.max(0, late - LATE_FREE);
        const halfDays = Math.floor(billableLates / LATE_PER_HALF);
        next.lateDeduction = String(Math.round(halfDays * perDay * 0.5 * 100) / 100);
      }
      return next;
    });
  };

  const editInput = (key: keyof EditFields, placeholder?: string) => (
    <input
      type="number" min="0" step="0.01"
      value={fields[key]}
      onChange={f(key)}
      placeholder={placeholder ?? "0"}
      className="w-28 text-right px-2 py-0.5 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 font-medium"
    />
  );

  return (
    <Card>
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 sm:px-6 py-4 cursor-pointer hover:bg-stone-50 transition-all"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-stone-900">
              {rec.employee.firstName} {rec.employee.lastName}
            </span>
            <span className="text-xs text-stone-400">{rec.employee.employeeCode}</span>
            <Badge variant={isWarehouse ? "amber" : "orange"} size="sm">
              {rec.employee.employeeType}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1 text-xs text-stone-400">
            <span>Gross: <b className="text-stone-700">₹{fmt(rec.grossEarnings)}</b></span>
            <span>Deductions: <b className="text-red-500">-₹{fmt(rec.totalDeductions)}</b></span>
            <span>Net: <b className="text-green-600 text-sm">₹{fmt(rec.netSalary)}</b></span>
            {rec.manualAdjustments.length > 0 && (
              <span className="text-orange-500">{rec.manualAdjustments.length} adj.</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={rec.status === "APPROVED" ? "green" : rec.status === "REJECTED" ? "red" : "amber"}>
            {rec.status}
          </Badge>
          {rec.status === "DRAFT" && (
            <>
              <button
                onClick={e => { e.stopPropagation(); onApprove(rec.id, "APPROVED"); }}
                disabled={saving === rec.id}
                className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-all"
                title="Approve"
              >
                {saving === rec.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              </button>
              <button
                onClick={e => { e.stopPropagation(); onApprove(rec.id, "REJECTED"); }}
                disabled={saving === rec.id}
                className="p-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition-all"
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-stone-100 px-4 sm:px-6 py-5 space-y-5">
          {/* Salary Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wide">Salary Breakdown</span>
              {!isEditing ? (
                <button onClick={startEdit}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-all">
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsEditing(false)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50 transition-all">
                    <X className="w-3 h-3" /> Cancel
                  </button>
                  <button onClick={saveEdit} disabled={editSaving}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-all disabled:opacity-50">
                    {editSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Save
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-stone-400 mb-2">Earnings</p>
                <div className="space-y-1.5 text-sm">
                  {([
                    ["Basic Salary", rec.basicSalary, "basicSalary"],
                    ["HRA", rec.hra, "hra"],
                    ["Conveyance", rec.conveyance, "conveyance"],
                    ["Bonus", rec.bonus, "bonus"],
                    ["Special Allowance", rec.specialAllowance, "specialAllowance"],
                    ["Overtime", rec.overtimeAmount, "overtimeAmount"],
                  ] as [string, number, keyof EditFields][]).map(([label, val, key]) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-stone-500">{label}</span>
                      {isEditing ? editInput(key) : <span className="font-medium text-stone-800">₹{fmt(val)}</span>}
                    </div>
                  ))}
                  <div className="flex justify-between pt-1 border-t border-stone-100 font-bold">
                    <span className="text-stone-700">Gross</span>
                    <span className="text-stone-900">₹{fmt(isEditing ? liveGross : rec.grossEarnings)}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-stone-400 mb-2">Deductions & Attendance</p>
                <div className="space-y-1.5 text-sm">
                  {([
                    ["Prof Tax", rec.professionalTax, "professionalTax"],
                    ["LOP Deduction", rec.lopDeduction, "lopDeduction"],
                    ["Late Deduction", rec.lateDeduction, "lateDeduction"],
                  ] as [string, number, keyof EditFields][]).map(([label, val, key]) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-stone-500">{label}</span>
                      {isEditing
                        ? editInput(key)
                        : <span className="font-medium text-red-500">-₹{fmt(val)}</span>}
                    </div>
                  ))}
                  <div className="pt-1 border-t border-stone-100 space-y-1">
                    {([
                      ["Present", rec.presentDays, "presentDays", "days"],
                      ["Weekly Off", rec.weeklyOffDays ?? 0, null, "days"],
                      ["LOP", rec.absentDays, "lopDays", "days"],
                      ["Late", rec.lateCount, "lateCount", "times"],
                      ["OT", rec.overtimeDays, null, `days${Number(rec.overtimeAmount) > 0 ? ` · ₹${fmt(rec.overtimeAmount)}` : ""}`],
                    ] as [string, number, keyof EditFields | null, string][]).map(([l, v, key, u]) => (
                      <div key={l} className="flex justify-between items-center text-stone-400">
                        <span>{l}</span>
                        {isEditing && key
                          ? <input type="number" min="0" step="0.5" value={fields[key]} onChange={f(key)}
                              className="w-20 text-right px-2 py-0.5 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
                          : <span>{Number(v)} {u}</span>}
                      </div>
                    ))}
                  </div>
                  {rec.leaveBalance !== null && (
                    <div className="mt-2 pt-2 border-t border-stone-100">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-stone-500">Leave Balance</span>
                        <span className="font-bold text-blue-600">
                          {Math.max(0, Number(rec.leaveBalance?.totalAllocated ?? 0) - Number(rec.leaveBalance?.used ?? 0)).toFixed(2)} days avail
                        </span>
                      </div>
                      <div className="flex justify-between text-stone-400 text-xs mt-0.5">
                        <span>{Number(rec.leaveBalance?.used ?? 0).toFixed(2)} used</span>
                        <span>of {Number(rec.leaveBalance?.totalAllocated ?? 0).toFixed(2)} allocated</span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-stone-100 font-bold">
                    <span className="text-green-700">Net Pay</span>
                    <span className="text-green-600">₹{fmt(isEditing ? liveNet : rec.netSalary)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Warehouse OT Entry */}
          {isWarehouse && (
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">Overtime (Manual Entry)</p>
              <div className="flex flex-wrap gap-2 items-end">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">OT Days</label>
                  <input type="number" min="0" step="0.5" value={ot.days}
                    onChange={e => onOtChange({ days: e.target.value })} placeholder="0"
                    className="w-24 px-3 py-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-200" />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Amount / Day (₹)</label>
                  <input type="number" min="0" value={ot.rate}
                    onChange={e => onOtChange({ rate: e.target.value })} placeholder="0"
                    className="w-32 px-3 py-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-200" />
                </div>
                <span className="text-xs text-stone-500 font-medium pb-0.5">= ₹{otTotal.toLocaleString("en-IN")}</span>
                <button onClick={() => onSaveOt(rec.id)} disabled={saving === rec.id + "-ot"}
                  className="px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition-all flex items-center gap-1 disabled:opacity-50">
                  {saving === rec.id + "-ot" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Save OT
                </button>
              </div>
            </div>
          )}

          {/* Manual Adjustments */}
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">Manual Adjustments</p>
            {rec.manualAdjustments.length > 0 && (
              <div className="space-y-1 mb-3">
                {rec.manualAdjustments.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${a.adjustmentType === "ADDITION" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                      {a.adjustmentType === "ADDITION" ? "+" : "-"}₹{fmt(a.amount)}
                    </span>
                    <span className="text-stone-500">{a.description}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <select value={adj.adjustmentType}
                onChange={e => onAdjChange({ adjustmentType: e.target.value as "ADDITION" | "DEDUCTION" })}
                className="px-3 py-1.5 border border-stone-200 rounded-lg text-xs bg-white">
                <option value="ADDITION">Addition</option>
                <option value="DEDUCTION">Deduction</option>
              </select>
              <input type="number" placeholder="Amount" value={adj.amount || ""}
                onChange={e => onAdjChange({ amount: Number(e.target.value) })}
                className="w-28 px-3 py-1.5 border border-stone-200 rounded-lg text-xs" />
              <input type="text" placeholder="Description" value={adj.description}
                onChange={e => onAdjChange({ description: e.target.value })}
                className="flex-1 min-w-[120px] px-3 py-1.5 border border-stone-200 rounded-lg text-xs" />
              <button onClick={() => onAddAdj(rec.id)} disabled={saving === rec.id + "-adj"}
                className="px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition-all flex items-center gap-1 disabled:opacity-50">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
