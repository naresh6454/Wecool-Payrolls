"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Eye, EyeOff, Building2, LogIn } from "lucide-react";
import Button from "@/components/ui/Button";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error || "Login failed");
    toast.success("Welcome back!");
    router.push(json.redirect);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — branding */}
      <div className="hidden lg:flex w-[44%] bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl">Wecool Payroll</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Smart payroll,<br />zero headaches.
          </h2>
          <p className="text-orange-100 text-[15px] leading-relaxed">
            Automate attendance, calculate salaries with precision, and deliver payslips — all in one place.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { val: "100%", label: "Automated Calculation" },
              { val: "0", label: "Manual Errors" },
              { val: "16+", label: "Leave Types Tracked" },
              { val: "PDF", label: "Instant Payslips" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{s.val}</div>
                <div className="text-orange-100 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-orange-200 text-xs">© 2025 Wecool Technologies</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-[#FAFAF8]">
        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-stone-900 font-bold text-lg">Wecool Payroll</span>
            </div>
            <h1 className="text-2xl font-bold text-stone-900">Sign in to your account</h1>
            <p className="text-stone-500 text-sm mt-1">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@company.com"
                className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all pr-10"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              <div className="text-right mt-1">
                <Link href="/forgot-password" className="text-xs text-orange-500 hover:text-orange-600 font-medium">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full py-2.5 text-sm" size="lg">
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-stone-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-orange-500 font-semibold hover:text-orange-600">
              Register here
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
