"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle, XCircle } from "lucide-react";

export default function OTActionButtons({ otId }: { otId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function action(status: "APPROVED" | "REJECTED") {
    setLoading(status);
    const res = await fetch(`/api/hr/overtime/${otId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { toast.success(status === "APPROVED" ? "OT approved" : "OT rejected"); router.refresh(); }
    else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || `Failed to ${status === "APPROVED" ? "approve" : "reject"} OT. Please try again.`);
    }
    setLoading(null);
  }

  return (
    <div className="flex gap-1.5">
      <button onClick={() => action("APPROVED")} disabled={!!loading}
        className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-all disabled:opacity-50">
        <CheckCircle className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => action("REJECTED")} disabled={!!loading}
        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all disabled:opacity-50">
        <XCircle className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
