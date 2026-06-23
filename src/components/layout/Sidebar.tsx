"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import {
  LayoutDashboard, Users, FileSpreadsheet, CheckCircle2, Wallet,
  ClipboardList, FileText, CalendarCheck, Settings, BookOpen,
  LogOut, Bell, User, ChevronRight, Calendar, Menu, X
} from "lucide-react";

const hrNav = [
  { label: "MAIN", items: [
    { href: "/hr/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/hr/employees", icon: Users, label: "Employees" },
  ]},
  { label: "ATTENDANCE", items: [
    { href: "/hr/attendance/upload", icon: FileSpreadsheet, label: "Upload Excel" },
    { href: "/hr/attendance/records", icon: CheckCircle2, label: "Records" },
  ]},
  { label: "PAYROLL", items: [
    { href: "/hr/payroll", icon: Wallet, label: "Payroll" },
    { href: "/hr/payroll/review", icon: ClipboardList, label: "Review" },
    { href: "/hr/payslips", icon: FileText, label: "Payslips" },
  ]},
  { label: "LEAVES & OT", items: [
    { href: "/hr/leaves", icon: CalendarCheck, label: "Leave Approval" },
  ]},
  { label: "ADMIN", items: [
    { href: "/hr/calendar", icon: Calendar, label: "Company Calendar" },
    { href: "/hr/settings", icon: Settings, label: "Company Settings" },
    { href: "/hr/audit", icon: BookOpen, label: "Audit Logs" },
  ]},
];

const employeeNav = [
  { label: "MAIN", items: [
    { href: "/employee/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/employee/payslips", icon: FileText, label: "My Payslips" },
    { href: "/employee/leaves", icon: CalendarCheck, label: "Leave Request" },
    { href: "/employee/profile", icon: User, label: "My Profile" },
  ]},
];

interface SidebarProps {
  role: "HR" | "EMPLOYEE";
  userName: string;
  userEmail: string;
  notifCount?: number;
}

export default function Sidebar({ role, userName, userEmail, notifCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const nav = role === "HR" ? hrNav : employeeNav;
  const [open, setOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-stone-700 flex items-center justify-between">
        <div className="flex-1">
          <Image
            src="/wecool-logo.png"
            alt="WeCool"
            width={160}
            height={52}
            loading="eager"
            style={{ height: "auto" }}
            className="object-contain w-full max-h-[52px]"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              img.src = '/wecool-logo.jpg';
              img.onerror = () => { img.style.display = 'none'; };
            }}
          />
          <div className="text-[8px] font-bold tracking-[0.18em] text-stone-400 mt-1 text-center">PAYROLL SYSTEM</div>
        </div>
        {/* Close button — mobile only */}
        <button onClick={() => setOpen(false)} className="lg:hidden ml-2 p-1.5 rounded-lg text-stone-400 hover:bg-stone-800">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {nav.map((section) => (
          <div key={section.label}>
            <p className="text-[9px] font-bold text-stone-500 tracking-widest px-2 mb-1.5">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.href} href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-[13px] font-medium transition-all group",
                      active
                        ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                        : "text-stone-400 hover:bg-stone-800 hover:text-stone-200"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-orange-400" : "text-stone-500 group-hover:text-stone-300")} />
                    <span className="truncate">{item.label}</span>
                    {active && <ChevronRight className="w-3 h-3 ml-auto text-orange-400" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-stone-700 p-3 space-y-2">
        <Link href={role === "HR" ? "/hr/notifications" : "/employee/notifications"}
          className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-stone-400 hover:bg-stone-800 hover:text-stone-200 text-[13px] font-medium transition-all">
          <Bell className="w-4 h-4 text-stone-500" />
          <span>Notifications</span>
          {notifCount > 0 && (
            <span className="ml-auto bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{notifCount}</span>
          )}
        </Link>
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-stone-800/60 border border-stone-700">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-stone-200 text-[12px] font-semibold truncate">{userName}</div>
            <div className="text-stone-500 text-[9px] truncate">{role}</div>
          </div>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button type="submit"
            className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-stone-400 hover:bg-red-900/30 hover:text-red-400 text-[13px] font-medium transition-all">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#1C1917] flex items-center px-4 gap-3 border-b border-stone-700">
        <button onClick={() => setOpen(true)} className="p-2 rounded-lg text-stone-400 hover:bg-stone-800 transition-all">
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-white font-bold text-base">Wecool Payroll</span>
        {notifCount > 0 && (
          <Link href={role === "HR" ? "/hr/notifications" : "/employee/notifications"} className="ml-auto">
            <div className="relative">
              <Bell className="w-5 h-5 text-stone-400" />
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{notifCount}</span>
            </div>
          </Link>
        )}
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative w-64 bg-[#1C1917] flex flex-col h-full z-10 overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 min-h-screen bg-[#1C1917] flex-col flex-shrink-0 fixed left-0 top-0 bottom-0 z-40">
        {sidebarContent}
      </aside>
    </>
  );
}
