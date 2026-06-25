"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, ArrowLeft, Mail } from "lucide-react";
import Button from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || "Something went wrong. Please try again.");
      return;
    }
    setSent(true);
  }

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
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">Forgot your password?</h2>
          <p className="text-orange-100 text-[15px] leading-relaxed">
            No worries — enter your email and we&apos;ll send you a link to reset it.
          </p>
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

          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-stone-900 mb-2">Check your email</h1>
              <p className="text-stone-500 text-sm mb-6">
                If an account exists for <span className="font-semibold text-stone-700">{email}</span>, we&apos;ve sent a password reset link. It expires in 1 hour.
              </p>
              <Link href="/login" className="text-orange-500 font-semibold hover:text-orange-600 text-sm flex items-center justify-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-stone-900">Reset your password</h1>
                <p className="text-stone-500 text-sm mt-1">Enter your email and we&apos;ll send you a reset link</p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <Button type="submit" loading={loading} className="w-full py-2.5 text-sm" size="lg">
                  Send Reset Link
                </Button>
              </form>

              <p className="text-center text-sm text-stone-500 mt-6">
                <Link href="/login" className="text-orange-500 font-semibold hover:text-orange-600 flex items-center justify-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
