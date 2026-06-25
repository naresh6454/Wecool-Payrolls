"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Eye, EyeOff, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || "Something went wrong. Please try again.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 3000);
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-500 text-sm mb-4">Invalid reset link.</p>
        <Link href="/forgot-password" className="text-orange-500 font-semibold hover:text-orange-600 text-sm">
          Request a new one
        </Link>
      </div>
    );
  }

  return done ? (
    <div className="text-center">
      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-7 h-7 text-green-600" />
      </div>
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Password updated!</h1>
      <p className="text-stone-500 text-sm">Redirecting you to sign in...</p>
    </div>
  ) : (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Set new password</h1>
        <p className="text-stone-500 text-sm mt-1">Choose a strong password for your account</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">New Password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all pr-10"
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">Confirm Password</label>
          <input
            type={showPw ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
          />
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <Button type="submit" loading={loading} className="w-full py-2.5 text-sm" size="lg">
          Update Password
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-[44%] bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl">Wecool Payroll</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">Almost there.</h2>
          <p className="text-orange-100 text-[15px] leading-relaxed">Set your new password and you&apos;re good to go.</p>
        </div>
        <p className="text-orange-200 text-xs">© 2025 Wecool Technologies</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-[#FAFAF8]">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-stone-900 font-bold text-lg">Wecool Payroll</span>
          </div>
          <Suspense fallback={<p className="text-stone-500 text-sm">Loading...</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
