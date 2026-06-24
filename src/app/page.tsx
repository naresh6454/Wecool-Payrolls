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
            <div className="w-10 h-10 relative">
              <Image src="/wecool-logo.png" alt="Wecool Logo" fill className="object-contain" sizes="40px" quality={100} />
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

          {/* Right side illustration */}
          <div className="flex-shrink-0 relative w-full max-w-lg">
            {/* Logo */}
            <div className="w-72 h-44 relative mx-auto">
              <Image src="/wecool-logo.png" alt="Wecool" fill className="object-contain" sizes="288px" quality={100} />
            </div>
            <p className="text-center mt-1 text-xl font-black text-gray-900">Wecool</p>
            <p className="text-center text-xs font-bold text-orange-500 tracking-widest uppercase mb-4">Payroll System</p>

            {/* Flat-design people illustration — 3×2 grid, reference art style */}
            <svg viewBox="0 0 520 310" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <defs>
                <filter id="cs" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000018"/>
                </filter>
              </defs>

              {/* ── ROW 1 ── */}

              {/* P1 — Man, purple-blue shirt + tie, right hand raised holding phone */}
              <g transform="translate(88,108)">
                <path d="M-38 20C-42 58-40 92-38 108L38 108C40 92 42 58 38 20C24 32 12 36 0 36C-12 36-24 32-38 20Z" fill="#7B86E2" stroke="#212121" strokeWidth="2.2" strokeLinejoin="round"/>
                <path d="M-11 20L0 34L11 20" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
                <path d="M-5 20L0 29L5 20" fill="#212121"/>
                <path d="M-3.5 29L0 72L3.5 29Z" fill="#212121"/>
                <rect x="-8" y="6" width="16" height="16" rx="7" fill="#FECBA1" stroke="#212121" strokeWidth="2"/>
                <ellipse cx="0" cy="-22" rx="28" ry="30" fill="#FECBA1" stroke="#212121" strokeWidth="2.5"/>
                <path d="M-28-28Q-26-56 0-58Q26-56 28-28Q22-42 0-44Q-22-42-28-28Z" fill="#212121"/>
                <ellipse cx="-28" cy="-22" rx="4.5" ry="6" fill="#FECBA1" stroke="#212121" strokeWidth="1.8"/>
                <ellipse cx="28" cy="-22" rx="4.5" ry="6" fill="#FECBA1" stroke="#212121" strokeWidth="1.8"/>
                <ellipse cx="-10" cy="-24" rx="4" ry="4.5" fill="#212121"/><circle cx="-8.5" cy="-25.5" r="1.5" fill="white"/>
                <ellipse cx="10" cy="-24" rx="4" ry="4.5" fill="#212121"/><circle cx="11.5" cy="-25.5" r="1.5" fill="white"/>
                <path d="M-16-32Q-10-36-4-32" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <path d="M4-32Q10-36 16-32" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <path d="M-8-12Q0-5 8-12" stroke="#212121" strokeWidth="2" strokeLinecap="round" fill="none"/>
                {/* right arm up holding phone */}
                <path d="M38 26Q62 12 66-10" stroke="#FECBA1" strokeWidth="18" strokeLinecap="round" fill="none"/>
                <path d="M38 26Q62 12 66-10" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <rect x="58" y="-36" width="22" height="38" rx="4" fill="#E8EAF6" stroke="#212121" strokeWidth="2"/>
                <rect x="62" y="-31" width="14" height="25" rx="2" fill="#9FA8DA"/>
                <circle cx="69" cy="-5" r="2.5" fill="#7986CB"/>
                {/* left arm down open hand */}
                <path d="M-38 26Q-60 42-56 68" stroke="#FECBA1" strokeWidth="18" strokeLinecap="round" fill="none"/>
                <path d="M-38 26Q-60 42-56 68" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <ellipse cx="-54" cy="74" rx="12" ry="8" fill="#FECBA1" stroke="#212121" strokeWidth="2"/>
              </g>

              {/* P2 — Woman, dark blazer, lavender hair, phone to right ear */}
              <g transform="translate(260,108)">
                <path d="M-40 20C-44 58-42 92-40 108L40 108C42 92 44 58 40 20C26 34 13 38 0 38C-13 38-26 34-40 20Z" fill="#2D3748" stroke="#212121" strokeWidth="2.2" strokeLinejoin="round"/>
                <path d="M-13 20L0 36L13 20" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
                <path d="M-40 20L-13 20" stroke="#212121" strokeWidth="1.5" fill="none"/>
                <path d="M40 20L13 20" stroke="#212121" strokeWidth="1.5" fill="none"/>
                <rect x="-8" y="6" width="16" height="16" rx="7" fill="#F5C5A3" stroke="#212121" strokeWidth="2"/>
                <ellipse cx="0" cy="-22" rx="28" ry="30" fill="#F5C5A3" stroke="#212121" strokeWidth="2.5"/>
                {/* lavender hair */}
                <path d="M-28-30Q-26-58 0-60Q26-58 28-30Q22-44 0-46Q-22-44-28-30Z" fill="#C4A8D4" stroke="#212121" strokeWidth="1.5"/>
                <path d="M-28-30Q-38 2-36 52Q-36 82-32 108" stroke="#C4A8D4" strokeWidth="18" strokeLinecap="round" fill="none"/>
                <path d="M28-30Q38 2 36 52Q36 82 32 108" stroke="#C4A8D4" strokeWidth="18" strokeLinecap="round" fill="none"/>
                <ellipse cx="-28" cy="-22" rx="4.5" ry="6" fill="#F5C5A3" stroke="#212121" strokeWidth="1.8"/>
                <ellipse cx="-10" cy="-24" rx="4" ry="4.5" fill="#212121"/><circle cx="-8.5" cy="-25.5" r="1.5" fill="white"/>
                <ellipse cx="10" cy="-24" rx="4" ry="4.5" fill="#212121"/><circle cx="11.5" cy="-25.5" r="1.5" fill="white"/>
                <path d="M-16-32Q-10-36-4-32" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <path d="M4-32Q10-36 16-32" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <path d="M-6-12Q0-6 6-12" stroke="#212121" strokeWidth="2" strokeLinecap="round" fill="none"/>
                {/* right arm raised to ear */}
                <path d="M40 26Q58 8 54-18" stroke="#F5C5A3" strokeWidth="18" strokeLinecap="round" fill="none"/>
                <path d="M40 26Q58 8 54-18" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <rect x="46" y="-44" width="18" height="30" rx="4" fill="#374151" stroke="#212121" strokeWidth="2"/>
                <rect x="49" y="-39" width="12" height="18" rx="2" fill="#6B7280"/>
                {/* left arm crosses body */}
                <path d="M-40 26Q-30 52-12 58" stroke="#F5C5A3" strokeWidth="18" strokeLinecap="round" fill="none"/>
                <path d="M-40 26Q-30 52-12 58" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <ellipse cx="-8" cy="62" rx="12" ry="8" fill="#F5C5A3" stroke="#212121" strokeWidth="2"/>
              </g>

              {/* P3 — Man, yellow sweater, blue short hair, holding phone in right hand */}
              <g transform="translate(432,108)">
                <path d="M-38 20C-42 58-40 92-38 108L38 108C40 92 42 58 38 20C24 32 12 36 0 36C-12 36-24 32-38 20Z" fill="#F5C842" stroke="#212121" strokeWidth="2.2" strokeLinejoin="round"/>
                <rect x="-8" y="6" width="16" height="16" rx="7" fill="#FECBA1" stroke="#212121" strokeWidth="2"/>
                <ellipse cx="0" cy="-22" rx="28" ry="30" fill="#FECBA1" stroke="#212121" strokeWidth="2.5"/>
                {/* blue-teal short hair */}
                <path d="M-28-28Q-26-56 0-58Q26-56 28-28Q22-42 0-44Q-22-42-28-28Z" fill="#5B9BD5" stroke="#212121" strokeWidth="1.5"/>
                <ellipse cx="-28" cy="-22" rx="4.5" ry="6" fill="#FECBA1" stroke="#212121" strokeWidth="1.8"/>
                <ellipse cx="28" cy="-22" rx="4.5" ry="6" fill="#FECBA1" stroke="#212121" strokeWidth="1.8"/>
                <ellipse cx="-10" cy="-24" rx="4" ry="4.5" fill="#212121"/><circle cx="-8.5" cy="-25.5" r="1.5" fill="white"/>
                <ellipse cx="10" cy="-24" rx="4" ry="4.5" fill="#212121"/><circle cx="11.5" cy="-25.5" r="1.5" fill="white"/>
                <path d="M-16-32Q-10-36-4-32" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <path d="M4-32Q10-36 16-32" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <path d="M-8-12Q0-5 8-12" stroke="#212121" strokeWidth="2" strokeLinecap="round" fill="none"/>
                {/* right arm out holding phone */}
                <path d="M38 26Q56 22 60 42" stroke="#FECBA1" strokeWidth="18" strokeLinecap="round" fill="none"/>
                <path d="M38 26Q56 22 60 42" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <rect x="54" y="30" width="22" height="36" rx="4" fill="#374151" stroke="#212121" strokeWidth="2"/>
                <rect x="58" y="34" width="14" height="24" rx="2" fill="#4B5563"/>
                <circle cx="65" cy="62" r="2.5" fill="#6B7280"/>
                {/* left arm down */}
                <path d="M-38 26Q-56 40-52 70" stroke="#FECBA1" strokeWidth="18" strokeLinecap="round" fill="none"/>
                <path d="M-38 26Q-56 40-52 70" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
              </g>

              {/* ── ROW 2 ── */}

              {/* P4 — Woman, yellow top, black hair bun, both arms holding laptop */}
              <g transform="translate(88,258)">
                <path d="M-38 18C-42 54-40 88-38 104L38 104C40 88 42 54 38 18C24 30 12 34 0 34C-12 34-24 30-38 18Z" fill="#F5C842" stroke="#212121" strokeWidth="2.2" strokeLinejoin="round"/>
                <rect x="-8" y="5" width="16" height="16" rx="7" fill="#F5C5A3" stroke="#212121" strokeWidth="2"/>
                <ellipse cx="0" cy="-22" rx="27" ry="28" fill="#F5C5A3" stroke="#212121" strokeWidth="2.5"/>
                {/* dark hair + bun */}
                <path d="M-26-28Q-24-52 0-54Q24-52 26-28Q20-42 0-44Q-20-42-26-28Z" fill="#212121"/>
                <circle cx="0" cy="-54" r="10" fill="#212121" stroke="#212121" strokeWidth="1.5"/>
                <ellipse cx="-27" cy="-22" rx="4" ry="5.5" fill="#F5C5A3" stroke="#212121" strokeWidth="1.8"/>
                <ellipse cx="27" cy="-22" rx="4" ry="5.5" fill="#F5C5A3" stroke="#212121" strokeWidth="1.8"/>
                <ellipse cx="-10" cy="-24" rx="4" ry="4.5" fill="#212121"/><circle cx="-8.5" cy="-25.5" r="1.5" fill="white"/>
                <ellipse cx="10" cy="-24" rx="4" ry="4.5" fill="#212121"/><circle cx="11.5" cy="-25.5" r="1.5" fill="white"/>
                <path d="M-16-32Q-10-36-4-32" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <path d="M4-32Q10-36 16-32" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <path d="M-7-12Q0-5 7-12" stroke="#212121" strokeWidth="2" strokeLinecap="round" fill="none"/>
                {/* arms holding laptop from below */}
                <path d="M-38 24Q-58 38-60 58" stroke="#F5C5A3" strokeWidth="18" strokeLinecap="round" fill="none"/>
                <path d="M-38 24Q-58 38-60 58" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <path d="M38 24Q58 38 60 58" stroke="#F5C5A3" strokeWidth="18" strokeLinecap="round" fill="none"/>
                <path d="M38 24Q58 38 60 58" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                {/* laptop */}
                <rect x="-52" y="46" width="104" height="62" rx="6" fill="#E2E8F0" stroke="#212121" strokeWidth="2"/>
                <rect x="-47" y="50" width="94" height="50" rx="4" fill="#1E293B"/>
                <rect x="-43" y="54" width="86" height="42" rx="2" fill="#7B86E2"/>
                <rect x="-38" y="60" width="48" height="4" rx="2" fill="white" opacity="0.8"/>
                <rect x="-38" y="68" width="32" height="3" rx="1.5" fill="white" opacity="0.5"/>
                <rect x="-38" y="75" width="38" height="3" rx="1.5" fill="white" opacity="0.5"/>
                <rect x="16" y="60" width="24" height="18" rx="3" fill="white" opacity="0.2"/>
                <text x="18" y="73" fontSize="7" fill="white" fontWeight="bold">₹PAY</text>
              </g>

              {/* P5 — Woman, purple top, blonde hair, smiling, holding phone in right hand */}
              <g transform="translate(260,258)">
                <path d="M-38 18C-42 54-40 88-38 104L38 104C40 88 42 54 38 18C24 30 12 34 0 34C-12 34-24 30-38 18Z" fill="#9B7FE8" stroke="#212121" strokeWidth="2.2" strokeLinejoin="round"/>
                <rect x="-8" y="5" width="16" height="16" rx="7" fill="#F5C5A3" stroke="#212121" strokeWidth="2"/>
                <ellipse cx="0" cy="-22" rx="27" ry="29" fill="#F5C5A3" stroke="#212121" strokeWidth="2.5"/>
                {/* blonde hair */}
                <path d="M-27-30Q-25-56 0-58Q25-56 27-30Q21-44 0-46Q-21-44-27-30Z" fill="#F5C842" stroke="#212121" strokeWidth="1.5"/>
                <path d="M-27-30Q-36 2-34 52" stroke="#F5C842" strokeWidth="16" strokeLinecap="round" fill="none"/>
                <path d="M27-30Q36 2 34 52" stroke="#F5C842" strokeWidth="16" strokeLinecap="round" fill="none"/>
                <ellipse cx="-27" cy="-22" rx="4" ry="5.5" fill="#F5C5A3" stroke="#212121" strokeWidth="1.8"/>
                <ellipse cx="27" cy="-22" rx="4" ry="5.5" fill="#F5C5A3" stroke="#212121" strokeWidth="1.8"/>
                <ellipse cx="-10" cy="-24" rx="4" ry="4.5" fill="#212121"/><circle cx="-8.5" cy="-25.5" r="1.5" fill="white"/>
                <ellipse cx="10" cy="-24" rx="4" ry="4.5" fill="#212121"/><circle cx="11.5" cy="-25.5" r="1.5" fill="white"/>
                <path d="M-16-32Q-10-36-4-32" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <path d="M4-32Q10-36 16-32" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                {/* big smile */}
                <path d="M-9-10Q0 0 9-10" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                {/* right arm holding phone */}
                <path d="M38 24Q52 36 52 60" stroke="#F5C5A3" strokeWidth="18" strokeLinecap="round" fill="none"/>
                <path d="M38 24Q52 36 52 60" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <rect x="44" y="52" width="20" height="34" rx="4" fill="#374151" stroke="#212121" strokeWidth="2"/>
                <rect x="47" y="56" width="14" height="22" rx="2" fill="#16A34A"/>
                <rect x="50" y="60" width="8" height="2" rx="1" fill="white" opacity="0.7"/>
                <rect x="50" y="65" width="6" height="2" rx="1" fill="white" opacity="0.5"/>
                {/* left arm crosses body */}
                <path d="M-38 24Q-26 46-8 52" stroke="#F5C5A3" strokeWidth="18" strokeLinecap="round" fill="none"/>
                <path d="M-38 24Q-26 46-8 52" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <ellipse cx="-4" cy="56" rx="11" ry="7" fill="#F5C5A3" stroke="#212121" strokeWidth="2"/>
              </g>

              {/* P6 — Man, light-blue shirt, brown hair, holding dark tablet */}
              <g transform="translate(432,258)">
                <path d="M-38 18C-42 54-40 88-38 104L38 104C40 88 42 54 38 18C24 30 12 34 0 34C-12 34-24 30-38 18Z" fill="#93C5FD" stroke="#212121" strokeWidth="2.2" strokeLinejoin="round"/>
                <rect x="-8" y="5" width="16" height="16" rx="7" fill="#FECBA1" stroke="#212121" strokeWidth="2"/>
                <ellipse cx="0" cy="-22" rx="28" ry="30" fill="#FECBA1" stroke="#212121" strokeWidth="2.5"/>
                {/* brown hair */}
                <path d="M-28-28Q-26-56 0-58Q26-56 28-28Q22-42 0-44Q-22-42-28-28Z" fill="#92400E" stroke="#212121" strokeWidth="1.5"/>
                <ellipse cx="-28" cy="-22" rx="4.5" ry="6" fill="#FECBA1" stroke="#212121" strokeWidth="1.8"/>
                <ellipse cx="28" cy="-22" rx="4.5" ry="6" fill="#FECBA1" stroke="#212121" strokeWidth="1.8"/>
                <ellipse cx="-10" cy="-24" rx="4" ry="4.5" fill="#212121"/><circle cx="-8.5" cy="-25.5" r="1.5" fill="white"/>
                <ellipse cx="10" cy="-24" rx="4" ry="4.5" fill="#212121"/><circle cx="11.5" cy="-25.5" r="1.5" fill="white"/>
                <path d="M-16-32Q-10-36-4-32" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <path d="M4-32Q10-36 16-32" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <path d="M-7-12Q0-5 7-12" stroke="#212121" strokeWidth="2" strokeLinecap="round" fill="none"/>
                {/* both arms holding tablet */}
                <path d="M-38 24Q-58 36-58 58" stroke="#FECBA1" strokeWidth="18" strokeLinecap="round" fill="none"/>
                <path d="M-38 24Q-58 36-58 58" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <path d="M38 24Q58 36 58 58" stroke="#FECBA1" strokeWidth="18" strokeLinecap="round" fill="none"/>
                <path d="M38 24Q58 36 58 58" stroke="#212121" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                {/* dark tablet */}
                <rect x="-52" y="46" width="104" height="66" rx="6" fill="#1E293B" stroke="#212121" strokeWidth="2"/>
                <rect x="-47" y="50" width="94" height="54" rx="4" fill="#334155"/>
                <rect x="-42" y="55" width="84" height="40" rx="2" fill="#E2E8F0"/>
                <rect x="-36" y="61" width="52" height="4" rx="2" fill="#1E293B" opacity="0.4"/>
                <rect x="-36" y="69" width="36" height="3" rx="1.5" fill="#1E293B" opacity="0.25"/>
                <rect x="-36" y="76" width="42" height="3" rx="1.5" fill="#1E293B" opacity="0.25"/>
                <rect x="22" y="61" width="18" height="14" rx="2" fill="#16A34A"/>
                <text x="24" y="72" fontSize="7" fill="white" fontWeight="bold">✓</text>
              </g>

              {/* Decorative dots */}
              <circle cx="176" cy="178" r="5" fill="#fed7aa"/>
              <circle cx="164" cy="195" r="3.5" fill="#bbf7d0"/>
              <circle cx="190" cy="190" r="2.5" fill="#fca5a5"/>
              <circle cx="344" cy="178" r="4" fill="#c4b5fd"/>
              <circle cx="358" cy="192" r="3" fill="#fed7aa"/>
            </svg>
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
