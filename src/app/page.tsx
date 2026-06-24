import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import {
  FileSpreadsheet, Wallet, CalendarCheck, FileText,
  Users, ShieldCheck, BarChart3, Clock, CheckCircle
} from "lucide-react";

export default async function RootPage() {
  const session = await getSession();
  if (session) {
    if (session.role === "HR") redirect("/hr/dashboard");
    redirect("/employee/dashboard");
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 relative">
              <Image src="/wecool-logo.png" alt="Wecool Logo" fill className="object-contain" sizes="56px" quality={100} />
            </div>
            <div>
              <p className="text-gray-900 font-extrabold text-lg leading-none">Wecool</p>
              <p className="text-orange-500 text-[10px] font-bold tracking-widest uppercase">Payroll System</p>
            </div>
          </div>
          <Link href="/login"
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-orange-200">
            Login →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-6 bg-gradient-to-br from-orange-50 via-white to-green-50">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 text-xs font-bold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
              Smart Payroll Management
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-gray-900 mb-4 leading-tight">
              Payroll made<br />
              <span className="text-orange-500">simple</span> &{" "}
              <span className="text-green-600">accurate</span>
            </h1>
            <p className="text-gray-500 text-lg mb-8 max-w-lg leading-relaxed">
              Wecool Payroll automates your entire payroll workflow — from attendance to payslips — with zero errors and full transparency.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/login"
                className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl text-base transition-all shadow-lg shadow-orange-200 hover:scale-105">
                Get Started →
              </Link>
              <div className="flex items-center gap-2 px-6 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm text-gray-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                Secure & Role-based
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-6 mt-10 justify-center lg:justify-start">
              {[
                { label: "Attendance Upload", color: "text-orange-500" },
                { label: "Auto Payslips", color: "text-green-600" },
                { label: "Leave Tracking", color: "text-red-500" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <CheckCircle className={`w-4 h-4 ${s.color}`} />
                  <span className="text-sm text-gray-600 font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side — dashboard mockup */}
          <div className="flex-shrink-0 relative w-full max-w-lg">

            {/* Dashboard mockup illustration */}
            <div className="relative">
              {/* Glow behind */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-white to-green-100 rounded-3xl blur-xl opacity-60 scale-105"/>
              {/* Browser frame */}
              <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Browser chrome */}
                <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"/>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"/>
                    <div className="w-3 h-3 rounded-full bg-green-400"/>
                  </div>
                  <div className="flex-1 mx-3 bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200">
                    wecoolpayroll.co.in/hr/payroll
                  </div>
                </div>
                {/* Dashboard content */}
                <div className="bg-[#F7F6F3] p-4 space-y-3">
                  {/* Top stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Total Payroll", value: "₹8,42,300", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
                      { label: "Employees", value: "24 Active", color: "text-green-700", bg: "bg-green-50", border: "border-green-100" },
                      { label: "Payslips", value: "24 Sent", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                    ].map(s => (
                      <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-2.5`}>
                        <p className="text-gray-400 text-[9px] font-semibold uppercase tracking-wide">{s.label}</p>
                        <p className={`${s.color} text-sm font-black mt-0.5`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Payroll table header */}
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-900 px-3 py-2 flex items-center justify-between">
                      <span className="text-white text-[10px] font-bold">Payroll — June 2026</span>
                      <span className="bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Processing</span>
                    </div>
                    {/* Table rows */}
                    {[
                      { name: "Arjun Kumar", dept: "Engineering", days: "21", net: "₹61,299", status: "Approved", color: "bg-green-100 text-green-700" },
                      { name: "Priya Sharma", dept: "HR", days: "20", net: "₹48,750", status: "Approved", color: "bg-green-100 text-green-700" },
                      { name: "Rahul Mehta", dept: "Finance", days: "19", net: "₹54,200", status: "Review", color: "bg-orange-100 text-orange-700" },
                      { name: "Sneha Patel", dept: "Design", days: "21", net: "₹42,500", status: "Approved", color: "bg-green-100 text-green-700" },
                    ].map((row, i) => (
                      <div key={row.name} className={`px-3 py-2 flex items-center text-[10px] border-b border-gray-50 ${i % 2 === 1 ? "bg-gray-50/50" : "bg-white"}`}>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-[8px] flex-shrink-0">
                          {row.name[0]}
                        </div>
                        <div className="w-28 pl-2">
                          <p className="text-gray-800 font-semibold truncate">{row.name}</p>
                          <p className="text-gray-400">{row.dept}</p>
                        </div>
                        <div className="w-8 text-center text-gray-500">{row.days}d</div>
                        <div className="w-16 text-right text-gray-900 font-bold">{row.net}</div>
                        <div className="flex-1 flex justify-end">
                          <span className={`${row.color} text-[8px] font-bold px-2 py-0.5 rounded-full`}>{row.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Bottom: mini chart + leave */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Attendance bar chart */}
                    <div className="bg-white rounded-xl border border-gray-100 p-3">
                      <p className="text-[9px] font-bold text-gray-500 uppercase mb-2">Attendance</p>
                      <div className="flex items-end gap-1 h-10">
                        {[70, 85, 90, 75, 95, 88, 92].map((h, i) => (
                          <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i === 4 ? "#f97316" : "#e2e8f0" }}/>
                        ))}
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[8px] text-gray-400">Mon</span>
                        <span className="text-[8px] text-gray-400">Sun</span>
                      </div>
                    </div>
                    {/* Leave summary */}
                    <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-1.5">
                      <p className="text-[9px] font-bold text-gray-500 uppercase">Leave Summary</p>
                      {[
                        { label: "Present", val: 21, color: "bg-green-500", total: 26 },
                        { label: "LOP", val: 2, color: "bg-red-400", total: 26 },
                        { label: "W/Off", val: 4, color: "bg-gray-300", total: 26 },
                      ].map(l => (
                        <div key={l.label}>
                          <div className="flex justify-between mb-0.5">
                            <span className="text-[8px] text-gray-500">{l.label}</span>
                            <span className="text-[8px] font-bold text-gray-700">{l.val}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${l.color} rounded-full`} style={{ width: `${(l.val/l.total)*100}%` }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -top-3 -right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-orange-200">
                June 2026 ✓
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-gray-900 py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: "100%", label: "Accurate Calculations", color: "text-orange-400" },
            { value: "Auto", label: "Payslip Delivery", color: "text-green-400" },
            { value: "2 Roles", label: "HR & Employee", color: "text-red-400" },
            { value: "Full", label: "Audit Trail", color: "text-orange-400" },
          ].map(s => (
            <div key={s.label}>
              <p className={`text-3xl font-black mb-1 ${s.color}`}>{s.value}</p>
              <p className="text-gray-400 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Everything your payroll team needs</h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">One platform to handle attendance, payroll, leaves, and payslips — end to end.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: FileSpreadsheet, title: "Attendance Upload", desc: "Import device or Excel formats. Auto-matches employees and flags exceptions.", color: "bg-orange-50", iconColor: "text-orange-500", border: "border-orange-100" },
              { icon: Wallet, title: "Smart Payroll", desc: "Auto salary calc with LOP, late deductions, OT, leave balance and tax.", color: "bg-green-50", iconColor: "text-green-600", border: "border-green-100" },
              { icon: CalendarCheck, title: "Leave Management", desc: "Approve leaves, track balances, auto-accrue and convert LOP to paid leave.", color: "bg-red-50", iconColor: "text-red-500", border: "border-red-100" },
              { icon: FileText, title: "Payslip Generation", desc: "One-click payslip generation and email delivery with full salary breakdown.", color: "bg-orange-50", iconColor: "text-orange-500", border: "border-orange-100" },
              { icon: Users, title: "Employee Profiles", desc: "Complete records with salary structure, department, and designation.", color: "bg-green-50", iconColor: "text-green-600", border: "border-green-100" },
              { icon: BarChart3, title: "Payroll Review", desc: "Manually adjust any record before approval. Add bonuses or deductions.", color: "bg-red-50", iconColor: "text-red-500", border: "border-red-100" },
              { icon: ShieldCheck, title: "Role-based Access", desc: "Separate HR and Employee portals. Employees see only their own data.", color: "bg-orange-50", iconColor: "text-orange-500", border: "border-orange-100" },
              { icon: Clock, title: "Audit Trail", desc: "Every action logged with timestamp and actor for full compliance.", color: "bg-green-50", iconColor: "text-green-600", border: "border-green-100" },
            ].map(f => (
              <div key={f.title} className={`${f.color} border ${f.border} rounded-2xl p-5 hover:shadow-md transition-all`}>
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm">
                  <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                </div>
                <h3 className="text-gray-900 font-bold text-sm mb-2">{f.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-green-600 text-sm font-bold uppercase tracking-widest mb-3">Simple workflow</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">How it works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Upload Attendance", desc: "HR uploads the monthly attendance Excel. System auto-processes and matches all employees instantly.", color: "bg-orange-500", light: "bg-orange-50 text-orange-600" },
              { step: "02", title: "Review Payroll", desc: "HR reviews generated payroll, adjusts entries manually, and approves or flags individual records.", color: "bg-green-600", light: "bg-green-50 text-green-700" },
              { step: "03", title: "Generate Payslips", desc: "One click generates and delivers payslips to all employees via email automatically.", color: "bg-red-500", light: "bg-red-50 text-red-600" },
            ].map(s => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 ${s.color} rounded-2xl flex items-center justify-center mb-5 shadow-lg`}>
                  <span className="text-white font-black text-xl">{s.step}</span>
                </div>
                <h3 className="text-gray-900 font-bold text-base mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-32 h-24 relative mx-auto mb-6">
            <Image src="/wecool-logo.png" alt="Wecool" fill className="object-contain" sizes="128px" quality={100} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Ready to streamline<br />your payroll?
          </h2>
          <p className="text-gray-400 mb-8 text-base">Log in to your Wecool Payroll dashboard and take full control of your payroll process today.</p>
          <Link href="/login"
            className="inline-block px-10 py-4 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-2xl text-base transition-all shadow-xl shadow-orange-900/30 hover:scale-105">
            Login to Dashboard →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 relative">
              <Image src="/wecool-logo.png" alt="Wecool" fill className="object-contain" sizes="32px" quality={100} />
            </div>
            <span className="text-white font-bold text-sm">Wecool <span className="text-gray-500 font-normal">Payroll System</span></span>
          </div>
          <p className="text-gray-600 text-xs">© {new Date().getFullYear()} Wecool. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
