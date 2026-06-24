"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, CalendarCheck, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface LeaveBalance { leaveType: string; totalAllocated: number; used: number; }
interface LeaveRequest {
  id: string; leaveType: string; fromDate: string; toDate: string;
  totalDays: number; status: string; reason: string; rejectionReason: string | null; createdAt: string;
}

export default function LeavesPage() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ leaveType: "CASUAL", fromDate: "", toDate: "", reason: "" });

  const fetchData = async () => {
    const [b, r] = await Promise.all([
      fetch("/api/employee/leaves/balances").then(x => x.json()),
      fetch("/api/employee/leaves").then(x => x.json()),
    ]);
    setBalances(b);
    setRequests(r);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fromDate || !form.toDate || !form.reason) return toast.error("Fill all fields");
    setSubmitting(true);
    const res = await fetch("/api/employee/leaves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Leave request submitted!");
      setShowForm(false);
      setForm({ leaveType: "CASUAL", fromDate: "", toDate: "", reason: "" });
      fetchData();
    } else {
      const d = await res.json();
      toast.error(d.error || "Failed to submit");
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="My Leaves"
        subtitle="Manage your leave requests and balances"
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Apply for Leave
          </button>
        }
      />

      {/* Leave Apply Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h2 className="text-base font-bold text-stone-900">Apply for Leave</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-stone-100 transition-all">
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Leave Type</label>
                <select
                  value={form.leaveType}
                  onChange={e => setForm(p => ({ ...p, leaveType: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="MEDICAL">Medical Leave</option>
                  <option value="LOP">Loss of Pay</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1.5">From Date</label>
                  <input
                    type="date"
                    value={form.fromDate}
                    onChange={e => setForm(p => ({ ...p, fromDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1.5">To Date</label>
                  <input
                    type="date"
                    value={form.toDate}
                    onChange={e => setForm(p => ({ ...p, toDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Reason</label>
                <textarea
                  value={form.reason}
                  onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                  rows={3}
                  placeholder="Describe the reason for leave..."
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-sm font-semibold hover:bg-stone-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Balances */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {balances.map((b) => {
          const avail = Number(b.totalAllocated) - Number(b.used);
          return (
            <div key={b.leaveType} className="bg-white rounded-2xl border border-stone-100 p-4 shadow-sm">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">{b.leaveType}</p>
              <p className="text-2xl font-black text-stone-900">{avail.toFixed(1)}</p>
              <p className="text-xs text-stone-400 mt-1">{Number(b.used)} used of {Number(b.totalAllocated)}</p>
              <div className="h-1 bg-stone-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-1 bg-orange-400 rounded-full"
                  style={{ width: `${Number(b.totalAllocated) > 0 ? Math.min((Number(b.used) / Number(b.totalAllocated)) * 100, 100) : 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Leave Requests */}
      <Card>
        <CardHeader title="My Leave Requests" />
        {requests.length === 0 ? (
          <div className="px-6 py-12 text-center text-stone-400">
            <CalendarCheck className="w-8 h-8 mx-auto mb-2 text-stone-300" />
            <p>No leave requests yet</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {requests.map((lr) => (
              <div key={lr.id} className="flex items-start gap-3 px-4 sm:px-6 py-3 hover:bg-stone-50 transition-all">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CalendarCheck className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-stone-900">
                      {lr.leaveType} Leave — {Number(lr.totalDays)} day{Number(lr.totalDays) !== 1 ? "s" : ""}
                    </p>
                    <Badge variant={lr.status === "APPROVED" ? "green" : lr.status === "PENDING" ? "amber" : "red"}>
                      {lr.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {format(new Date(lr.fromDate), "MMM d")} – {format(new Date(lr.toDate), "MMM d, yyyy")}
                    <span className="mx-1">·</span>
                    {lr.reason}
                  </p>
                  {lr.status === "REJECTED" && lr.rejectionReason && (
                    <p className="text-xs text-red-500 mt-1 font-medium">Rejected: {lr.rejectionReason}</p>
                  )}
                  <p className="text-xs text-stone-400 mt-0.5 sm:hidden">{format(new Date(lr.createdAt), "MMM d, yyyy")}</p>
                </div>
                <p className="text-xs text-stone-400 hidden sm:block flex-shrink-0">{format(new Date(lr.createdAt), "MMM d, yyyy")}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
