import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import {
  FileSpreadsheet, Wallet, CalendarCheck, FileText,
  Users, ShieldCheck, BarChart3, Clock
} from "lucide-react";

export default async function RootPage() {
  const session = await getSession();
  if (session) {
    if (session.role === "HR") redirect("/hr/dashboard");
    redirect("/employee/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0f1f38] text-white overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0f1f38]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative rounded-xl overflow-hidden bg-white p-0.5">
              <Image src="/logo.jpeg" alt="Wecool Logo" fill className="object-contain" sizes="40px" quality={100} />
            </div>
            <div>
              <p className="text-white font-extrabold text-lg leading-none tracking-wide">Wecool</p>
              <p className="text-orange-400 text-[10px] font-semibold tracking-widest uppercase">Payroll System</p>
            </div>
          </div>
          <Link href="/login"
            className="px-5 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30">
            Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 flex flex-col items-center text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mb-8 w-32 h-32 rounded-3xl overflow-hidden bg-white shadow-2xl shadow-orange-500/20 ring-4 ring-orange-500/30">
          <Image src="/logo.jpeg" alt="Wecool Logo" fill className="object-contain p-2" sizes="128px" quality={100} />
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-4 leading-none">
          <span className="text-white">We</span><span className="text-orange-400">cool</span>
        </h1>
        <p className="text-xl sm:text-2xl font-semibold text-blue-200 mb-4 tracking-widest uppercase">
          Payroll System
        </p>
        <p className="text-stone-400 max-w-xl text-base sm:text-lg mb-10 leading-relaxed">
          Streamline your payroll operations with precision — from attendance tracking and leave management to automated salary calculation and payslip generation.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/login"
            className="px-8 py-3.5 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-2xl text-base transition-all shadow-xl shadow-orange-500/30 hover:shadow-orange-400/40 hover:scale-105">
            Get Started →
          </Link>
          <div className="flex items-center gap-2 text-stone-400 text-sm">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            Secure · Role-based access
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white/5 border-y border-white/10 py-8 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { label: "Employees Managed", value: "∞" },
            { label: "Auto Payslips", value: "✓" },
            { label: "Leave Tracking", value: "✓" },
            { label: "Audit Logs", value: "✓" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl font-black text-orange-400 mb-1">{s.value}</p>
              <p className="text-stone-400 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-3">Everything you need</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Built for modern payroll teams</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: FileSpreadsheet,
                title: "Attendance Upload",
                desc: "Import device or simple Excel formats. Auto-matches employees and flags exceptions instantly.",
                color: "text-blue-400",
                bg: "bg-blue-500/10",
              },
              {
                icon: Wallet,
                title: "Smart Payroll",
                desc: "Automatic salary calculation with LOP, late deductions, OT, professional tax, and leave balance.",
                color: "text-orange-400",
                bg: "bg-orange-500/10",
              },
              {
                icon: CalendarCheck,
                title: "Leave Management",
                desc: "Approve leaves, track balances, auto-accrue monthly entitlements, and convert LOP to paid leave.",
                color: "text-green-400",
                bg: "bg-green-500/10",
              },
              {
                icon: FileText,
                title: "Payslip Generation",
                desc: "One-click payslip generation and email delivery with full salary breakdown per employee.",
                color: "text-purple-400",
                bg: "bg-purple-500/10",
              },
              {
                icon: Users,
                title: "Employee Profiles",
                desc: "Complete employee records with salary structure, department, designation, and employment details.",
                color: "text-pink-400",
                bg: "bg-pink-500/10",
              },
              {
                icon: BarChart3,
                title: "Payroll Review",
                desc: "Review and manually adjust any record before approval. Add bonuses or deductions on the fly.",
                color: "text-yellow-400",
                bg: "bg-yellow-500/10",
              },
              {
                icon: ShieldCheck,
                title: "Role-based Access",
                desc: "Separate HR and Employee portals. Employees see only their own data and payslips.",
                color: "text-cyan-400",
                bg: "bg-cyan-500/10",
              },
              {
                icon: Clock,
                title: "Audit Trail",
                desc: "Every action is logged with timestamp and actor — full accountability for compliance.",
                color: "text-red-400",
                bg: "bg-red-500/10",
              },
            ].map(f => (
              <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/8 hover:border-white/20 transition-all group">
                <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="text-white font-bold text-sm mb-2">{f.title}</h3>
                <p className="text-stone-400 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-white/5 border-y border-white/10">
        <div className="max-w-4xl mx-auto text-center mb-14">
          <p className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-3">Simple workflow</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white">How it works</h2>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
          <div className="hidden sm:block absolute top-8 left-[20%] right-[20%] h-px bg-gradient-to-r from-orange-500/0 via-orange-500/40 to-orange-500/0" />
          {[
            { step: "01", title: "Upload Attendance", desc: "HR uploads the monthly attendance Excel. System auto-processes and matches employees." },
            { step: "02", title: "Review Payroll", desc: "HR reviews generated payroll, adjusts entries, approves or flags individual records." },
            { step: "03", title: "Generate Payslips", desc: "One click generates and delivers payslips to all employees via email automatically." },
          ].map(s => (
            <div key={s.step} className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center mb-5 z-10">
                <span className="text-orange-400 font-black text-lg">{s.step}</span>
              </div>
              <h3 className="text-white font-bold text-base mb-2">{s.title}</h3>
              <p className="text-stone-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/5 to-transparent pointer-events-none" />
        <div className="relative max-w-xl mx-auto">
          <div className="w-20 h-20 relative mx-auto mb-6 rounded-2xl overflow-hidden bg-white shadow-2xl shadow-orange-500/20">
            <Image src="/logo.jpeg" alt="Wecool" fill className="object-contain p-1.5" sizes="80px" quality={100} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to get started?</h2>
          <p className="text-stone-400 mb-8">Log in to your Wecool Payroll dashboard and take control of your payroll process.</p>
          <Link href="/login"
            className="inline-block px-10 py-4 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-2xl text-base transition-all shadow-xl shadow-orange-500/30 hover:scale-105">
            Login to Dashboard →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 relative rounded-lg overflow-hidden bg-white p-0.5">
              <Image src="/logo.jpeg" alt="Wecool" fill className="object-contain" sizes="28px" quality={100} />
            </div>
            <span className="text-white font-bold text-sm">Wecool <span className="text-stone-500 font-normal">Payroll System</span></span>
          </div>
          <p className="text-stone-600 text-xs">© {new Date().getFullYear()} Wecool. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
