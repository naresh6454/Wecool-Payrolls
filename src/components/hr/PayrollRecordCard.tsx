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
  onDeleteAdj: (recordId: string, adjId: string) => void;
  warehouseOt: { days: string; rate: string };
  onOtChange: (val: { days?: string; rate?: string }) => void;
  onSaveOt: (id: string) => void;
  onSaveEdit: (id: string, fields: EditFields, useLeaveBalance?: boolean) => Promise<void>;
}

const fmt = (n: number) => Number(n).toLocaleString("en-IN");

export default function PayrollRecordCard({
  rec, isExpanded, onToggle, saving, onApprove,
  adj, onAdjChange, onAddAdj, onDeleteAdj,
  warehouseOt: ot, onOtChange, onSaveOt, onSaveEdit,
}: Props) {
  const isWarehouse = rec.employee.employeeType === "WAREHOUSE";
  const otTotal = (parseFloat(ot.days || "0") || 0) * (parseFloat(ot.rate || "0") || 0);

  const perDay = Number(rec.perDaySalary) || (Number(rec.monthlySalary) / 26);
  const LATE_FREE = 5;
  const LATE_PER_HALF = 2;

  const availableBalance = Math.max(
    0,
    Number(rec.leaveBalance?.totalAllocated ?? 0) - Number(rec.leaveBalance?.used ?? 0)
  );

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
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingFields, setPendingFields] = useState<EditFields | null>(null);

  const liveGross = (parseFloat(fields.basicSalary) || 0) + (parseFloat(fields.hra) || 0) +
    (parseFloat(fields.conveyance) || 0) + (parseFloat(fields.bonus) || 0) +
    (parseFloat(fields.specialAllowance) || 0) + (parseFloat(fields.overtimeAmount) || 0);
  const liveDed = (parseFloat(fields.professionalTax) || 0) + (parseFloat(fields.lopDeduction) || 0) +
    (parseFloat(fields.lateDeduction) || 0);
  const adjDelta = rec.manualAdjustments.reduce((sum, a) => a.adjustmentType === "ADDITION" ? sum + Number(a.amount) : sum - Number(a.amount), 0);
  const liveNet = Math.max(0, liveGross - liveDed + adjDelta);
  const adjNet = Math.max(0, Number(rec.netSalary) + adjDelta);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFields(initFields());
    setIsEditing(true);
  };

  const handleSaveClick = async () => {
    const newLop = parseFloat(fields.lopDays) || 0;

    // If there are LOP days and leave balance is available → show dialog
    if (newLop > 0 && availableBalance > 0) {
      setPendingFields(fields);
      setShowLeaveDialog(true);
      return;
    }

    // Otherwise save directly
    setEditSaving(true);
    await onSaveEdit(rec.id, fields);
    setEditSaving(false);
    setIsEditing(false);
  };

  const confirmSave = async (useLeaveBalance: boolean) => {
    if (!pendingFields) return;
    setShowLeaveDialog(false);
    setEditSaving(true);
    await onSaveEdit(rec.id, pendingFields, useLeaveBalance);
    setEditSaving(false);
    setIsEditing(false);
    setPendingFields(null);
  };

  const f = (key: keyof EditFields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFields(prev => {
      const next = { ...prev, [key]: val };
      if (key === "lopDays") {
        const lop = parseFloat(val) || 0;
        next.lopDeduction = String(Math.round(lop * perDay * 100) / 100);
      }
      if (key === "lateCount") {
        const late = parseFloat(val) || 0;
        const billableLates = Math.max(0, late - LATE_FREE);
        const halfDays = Math.ceil(billableLates / LATE_PER_HALF);
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

  // LOP dialog values
  const newLopForDialog = parseFloat(pendingFields?.lopDays ?? "0") || 0;
  const daysConvertible = Math.min(newLopForDialog, availableBalance);

  return (
    <>
      {/* Leave Balance Dialog */}
      {showLeaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-bold text-stone-900 mb-1">Use Leave Balance?</h3>
            <p className="text-sm text-stone-500 mb-4">
              This employee has <b className="text-stone-700">{newLopForDialog} LOP {newLopForDialog === 1 ? "day" : "days"}</b> and{" "}
              <b className="text-blue-600">{availableBalance.toFixed(2)} days</b> of leave balance available.
              Do you want to use the leave balance to cover the LOP?
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-sm text-blue-800 space-y-1">
              <p><b>{daysConvertible.toFixed(2)} day(s)</b> will be converted from LOP → Paid Leave</p>
              <p>Leave balance used: <b>-{daysConvertible.toFixed(2)} days</b></p>
              <p>Remaining LOP after conversion: <b>{Math.max(0, newLopForDialog - daysConvertible).toFixed(2)} days</b></p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => confirmSave(true)}
                className="flex-1 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all"
              >
                Use Leave Balance
              </button>
              <button
                onClick={() => confirmSave(false)}
                className="flex-1 py-2 bg-stone-100 text-stone-700 text-sm font-semibold rounded-xl hover:bg-stone-200 transition-all"
              >
                Keep as LOP
              </button>
            </div>
            <button
              onClick={() => { setShowLeaveDialog(false); setPendingFields(null); }}
              className="w-full mt-2 py-1.5 text-xs text-stone-400 hover:text-stone-600 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
              <span>Net: <b className="text-green-600 text-sm">₹{fmt(adjNet)}</b></span>
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
                    <button onClick={handleSaveClick} disabled={editSaving}
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
                        ["Late", rec.lateCount, "lateCount", "times"],
                        ["OT", rec.overtimeDays, null, `days${Number(rec.overtimeAmount) > 0 ? ` · ₹${fmt(rec.overtimeAmount)}` : ""}`],
                      ] as [string, number, keyof EditFields | null, string][]).map(([l, v, key, u]) => (
                        <div key={l} className="flex justify-between items-center text-stone-600 text-sm">
                          <span>{l}</span>
                          {isEditing && key
                            ? <input type="number" min="0" step="0.5" value={fields[key]} onChange={f(key)}
                                className="w-20 text-right px-2 py-0.5 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
                            : <span className="font-medium">{Number(v)} {u}</span>}
                        </div>
                      ))}
                      {/* LOP row — shows full absent days with leave coverage breakdown */}
                      <div className="flex justify-between items-start text-stone-600 text-sm">
                        <span>LOP</span>
                        {isEditing ? (
                          <input type="number" min="0" step="0.5" value={fields.lopDays} onChange={f("lopDays")}
                            className="w-20 text-right px-2 py-0.5 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
                        ) : (() => {
                          const actualLop = Number(rec.lopDays);
                          const coveredByLeave = Number(rec.paidLeaveDays);
                          const totalAbsent = actualLop + coveredByLeave;
                          if (totalAbsent === 0) return <span className="font-medium">0 days</span>;
                          if (coveredByLeave <= 0) return <span className="font-medium">{actualLop} days</span>;
                          return (
                            <div className="text-right">
                              <span className="font-medium">{totalAbsent} days</span>
                              {coveredByLeave === totalAbsent ? (
                                <p className="text-xs text-blue-500">{coveredByLeave} covered by leave</p>
                              ) : (
                                <p className="text-xs text-blue-500">{coveredByLeave} covered · {actualLop} deducted</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    {rec.leaveBalance !== null && (
                      <div className="mt-2 pt-2 border-t border-stone-100">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-stone-500">Leave Balance</span>
                          <span className="font-bold text-blue-600">
                            {availableBalance.toFixed(2)} days avail
                          </span>
                        </div>
                        <div className="flex justify-between text-stone-400 text-xs mt-0.5">
                          <span>{Number(rec.paidLeaveDays ?? 0).toFixed(2)} used this month</span>
                          <span>of {Number(rec.leaveBalance?.totalAllocated ?? 0).toFixed(2)} allocated</span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-stone-100 font-bold">
                      <span className="text-green-700">Net Pay</span>
                      <span className="text-green-600">₹{fmt(isEditing ? liveNet : adjNet)}</span>
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
                      <span className="text-stone-500 flex-1">{a.description}</span>
                      <button onClick={() => onDeleteAdj(rec.id, a.id)}
                        className="text-stone-300 hover:text-red-400 transition-colors text-xs font-bold px-1">✕</button>
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
    </>
  );
}
