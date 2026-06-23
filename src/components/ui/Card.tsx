import { cn } from "@/lib/cn";
import { ReactNode } from "react";

interface CardProps { children: ReactNode; className?: string; }
interface CardHeaderProps { title: string; subtitle?: string; actions?: ReactNode; icon?: ReactNode; className?: string; }

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn("bg-white rounded-2xl border border-stone-100 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, actions, icon, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between px-6 py-4 border-b border-stone-100", className)}>
      <div className="flex items-center gap-2">
        {icon && <div className="text-stone-400">{icon}</div>}
        <div>
          <h3 className="text-[15px] font-bold text-stone-900">{title}</h3>
          {subtitle && <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ children, className }: CardProps) {
  return <div className={cn("p-6", className)}>{children}</div>;
}
