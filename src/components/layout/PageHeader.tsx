import { cn } from "@/lib/cn";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export default function PageHeader({ title, subtitle, actions, icon, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 mb-6", className)}>
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-stone-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
