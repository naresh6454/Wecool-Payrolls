import { cn } from "@/lib/cn";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  color: "orange" | "green" | "amber" | "red" | "blue";
  trend?: { value: string; up?: boolean };
}

const colorMap = {
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-100",
    icon: "bg-orange-500 text-white",
    value: "text-orange-600",
    label: "text-orange-500",
  },
  green: {
    bg: "bg-green-50",
    border: "border-green-100",
    icon: "bg-green-500 text-white",
    value: "text-green-600",
    label: "text-green-500",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-100",
    icon: "bg-amber-500 text-white",
    value: "text-amber-600",
    label: "text-amber-500",
  },
  red: {
    bg: "bg-red-50",
    border: "border-red-100",
    icon: "bg-red-500 text-white",
    value: "text-red-600",
    label: "text-red-500",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-100",
    icon: "bg-blue-500 text-white",
    value: "text-blue-600",
    label: "text-blue-500",
  },
};

export default function StatCard({ label, value, sub, icon: Icon, color, trend }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn("rounded-2xl border p-5 flex items-center gap-4 bg-white shadow-sm", c.border)}>
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm", c.icon)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-stone-500 tracking-wide uppercase">{label}</p>
        <p className={cn(
          "font-bold mt-0.5 leading-tight truncate",
          typeof value === "string" && value.length > 8 ? "text-base" : "text-2xl",
          c.value
        )}>{value}</p>
        {sub && <p className="text-xs text-stone-400 mt-1 truncate">{sub}</p>}
        {trend && (
          <p className={cn("text-xs mt-1 font-medium", trend.up ? "text-green-500" : "text-red-500")}>
            {trend.up ? "↑" : "↓"} {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}
