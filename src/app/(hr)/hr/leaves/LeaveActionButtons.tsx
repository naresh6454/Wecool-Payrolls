"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, X, AlertTriangle } from "lucide-react";

export default function LeaveActionButtons({ leaveId }: { leaveId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [lopWarning, setLopWarning] = useState<{ available: number; requested: number } | null>(null);

  async function approve(asLop = false) {
    setLoading("APPROVED");
    const res = await fetch(`/api/hr/leaves/${leaveId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED", asLop }),
    });
    const data = await res.json();

    if (res.ok && data.warning) {
      // Insufficient balance — show LOP dialog
      setLopWarning({ available: data.availableBalance, requested: data.requestedDays });
      setLoading(null);
      return;
    }

    if (res.ok) {
      toast.success(asLop ? "Leave approved as LOP" : "Leave approved");
      setLopWarning(null);
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Failed to approve leave. Please try again.");
    }
    setLoading(null);
  }

  async function reject() {
    if (!rejectionReason.trim()) { toast.error("Please provide a rejection reason"); return; }
    setLoading("REJECTED");
    const res = await fetch(`/api/hr/leaves/${leaveId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REJECTED", reason: rejectionReason.trim() }),
    });
    if (res.ok) {
      toast.success("Leave rejected");
      setShowRejectModal(false);
      setRejectionReason("");
      setLopWarning(null);
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Failed to reject leave. Please try again.");
    }
    setLoading(null);
  }

  return (
    <>
      <div className="flex gap-1.5">
        <button onClick={() => approve(false)} disabled={!!loading}
          className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-all disabled:opacity-50" title="Approve">
          <CheckCircle className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setShowRejectModal(true)} disabled={!!loading}
          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all disabled:opacity-50" title="Reject">
          <XCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Insufficient Balance — LOP Warning Modal */}
      {lopWarning && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-stone-100">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-base font-bold text-stone-900">Insufficient Leave Balance</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500">Available Balance</span>
                  <span className="font-bold text-stone-800">{lopWarning.available.toFixed(2)} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Requested Days</span>
                  <span className="font-bold text-stone-800">{lopWarning.requested} days</span>
                </div>
                <div className="flex justify-between border-t border-amber-200 pt-1.5 mt-1.5">
                  <span className="text-stone-500">Shortfall</span>
                  <span className="font-bold text-red-600">{(lopWarning.requested - lopWarning.available).toFixed(2)} days</span>
                </div>
              </div>
              <p className="text-sm text-stone-500">
                The employee does not have enough leave balance. You can approve this as <strong>Loss of Pay (LOP)</strong> — the salary for these days will be deducted — or reject the request.
              </p>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowRejectModal(true)} disabled={!!loading}
                  className="flex-1 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-all">
                  Reject Instead
                </button>
                <button onClick={() => approve(true)} disabled={loading === "APPROVED"}
                  className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-all disabled:opacity-50">
                  {loading === "APPROVED" ? "Approving..." : "Approve as LOP"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h2 className="text-base font-bold text-stone-900">Reject Leave Request</h2>
              <button onClick={() => { setShowRejectModal(false); setRejectionReason(""); }}
                className="p-1 rounded-lg hover:bg-stone-100 transition-all">
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-stone-500">Provide a reason for rejecting this leave request. The employee will see this reason.</p>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Rejection Reason <span className="text-red-500">*</span></label>
                <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                  rows={3} autoFocus
                  placeholder="e.g. Insufficient leave balance, critical project deadline..."
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setShowRejectModal(false); setRejectionReason(""); }}
                  className="flex-1 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-sm font-semibold hover:bg-stone-50 transition-all">
                  Cancel
                </button>
                <button onClick={reject} disabled={loading === "REJECTED" || !rejectionReason.trim()}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50">
                  {loading === "REJECTED" ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
