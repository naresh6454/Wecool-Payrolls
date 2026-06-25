"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, Pencil, UserCheck, UserMinus, Trash2, Loader2 } from "lucide-react";

interface Props {
  userId: string;
  status: string;
  employeeId: string;
  isActive: boolean;
}

export default function EmployeeActions({ userId, status, employeeId, isActive }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function toggleActive() {
    setLoading("active");
    const res = await fetch(`/api/hr/employees/${employeeId}/active`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (res.ok) {
      toast.success(isActive ? "Employee marked as inactive" : "Employee marked as active");
      router.refresh();
    } else {
      toast.error("Failed to update status");
    }
    setLoading(null);
  }

  async function deleteEmployee() {
    setLoading("delete");
    const res = await fetch(`/api/hr/employees/${employeeId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Employee deleted");
      router.refresh();
    } else {
      const d = await res.json();
      toast.error(d.error || "Failed to delete");
    }
    setLoading(null);
    setConfirmDelete(false);
  }

  async function approveUser() {
    setLoading("approve");
    const res = await fetch(`/api/hr/employees/${userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    });
    if (res.ok) { toast.success("Employee approved"); router.refresh(); }
    else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Failed to approve employee. Please try again.");
    }
    setLoading(null);
  }

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {/* View */}
      <button
        onClick={() => router.push(`/hr/employees/${employeeId}`)}
        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-all"
        title="View"
      >
        <Eye className="w-3.5 h-3.5" />
      </button>

      {/* Edit */}
      <button
        onClick={() => router.push(`/hr/employees/${employeeId}/edit`)}
        className="p-1.5 rounded-lg hover:bg-blue-50 text-stone-400 hover:text-blue-600 transition-all"
        title="Edit"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>

      {/* Approve if pending */}
      {status === "PENDING" && (
        <button
          onClick={approveUser}
          disabled={!!loading}
          className="p-1.5 rounded-lg hover:bg-green-50 text-stone-400 hover:text-green-600 transition-all disabled:opacity-50"
          title="Approve"
        >
          {loading === "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* Active / Inactive toggle — only for approved employees */}
      {status === "APPROVED" && (
        <button
          onClick={toggleActive}
          disabled={!!loading}
          className={`p-1.5 rounded-lg transition-all disabled:opacity-50 ${
            isActive
              ? "hover:bg-amber-50 text-green-500 hover:text-amber-600"
              : "hover:bg-green-50 text-stone-300 hover:text-green-600"
          }`}
          title={isActive ? "Mark as Inactive" : "Mark as Active"}
        >
          {loading === "active"
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <UserMinus className="w-3.5 h-3.5" />
          }
        </button>
      )}

      {/* Delete */}
      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-all"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <span className="text-xs text-red-500 font-medium whitespace-nowrap">Sure?</span>
          <button
            onClick={deleteEmployee}
            disabled={!!loading}
            className="px-2 py-0.5 rounded text-xs bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-all"
          >
            {loading === "delete" ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Yes"}
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="px-2 py-0.5 rounded text-xs bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all"
          >
            No
          </button>
        </div>
      )}
    </div>
  );
}
