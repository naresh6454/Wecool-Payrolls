"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Building2, UserPlus, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  phone: z.string().optional(),
  employeeType: z.enum(["OFFICE", "WAREHOUSE"]),
  dateOfJoining: z.string().min(1, "Date of joining is required"),
  gender: z.string().optional(),
  aadhaarNumber: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { employeeType: "OFFICE" },
  });

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error || "Registration failed");
    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Registration Submitted!</h1>
          <p className="text-stone-500 mb-6">
            Your account is pending HR approval. You will be notified once approved. Please allow 1–2 business days.
          </p>
          <Link href="/login">
            <Button>Back to Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-[40%] bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl">Wecool Payroll</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Join the team.<br />Get paid on time.
          </h2>
          <p className="text-green-100 text-[15px]">
            Register your account. Our HR team will review and approve your registration within 1–2 business days.
          </p>
          <div className="mt-8 space-y-3">
            {["Fill in your details", "HR reviews your registration", "Account activated", "Access your payslips"].map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white text-xs font-bold">{i + 1}</div>
                <span className="text-green-100 text-sm">{s}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-green-200 text-xs">© 2025 Wecool Technologies</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-[#FAFAF8] overflow-y-auto">
        <div className="w-full max-w-[480px] py-4 sm:py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-stone-900">Create your account</h1>
            <p className="text-stone-500 text-sm mt-1">All fields marked are required for HR review</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">First Name *</label>
                <input {...register("firstName")} placeholder="Sneha"
                  className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all" />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">Last Name *</label>
                <input {...register("lastName")} placeholder="Pillai"
                  className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all" />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">Email Address *</label>
              <input {...register("email")} type="email" placeholder="you@company.com"
                className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">Password *</label>
              <input {...register("password")} type="password" placeholder="Min 8 characters"
                className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">Phone</label>
                <input {...register("phone")} placeholder="+91 9876543210"
                  className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">Gender</label>
                <select {...register("gender")}
                  className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all">
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">Employee Type *</label>
                <select {...register("employeeType")}
                  className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all">
                  <option value="OFFICE">Office Employee</option>
                  <option value="WAREHOUSE">Warehouse Employee</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">Date of Joining *</label>
                <input {...register("dateOfJoining")} type="date"
                  className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all" />
                {errors.dateOfJoining && <p className="text-red-500 text-xs mt-1">{errors.dateOfJoining.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">Aadhaar Number</label>
              <input {...register("aadhaarNumber")} placeholder="XXXX-XXXX-XXXX"
                className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all" />
            </div>

            <Button type="submit" variant="secondary" loading={isSubmitting} className="w-full py-2.5" size="lg">
              <UserPlus className="w-4 h-4" />
              Submit Registration
            </Button>
          </form>

          <p className="text-center text-sm text-stone-500 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-orange-500 font-semibold hover:text-orange-600">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
