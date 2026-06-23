"use client";

import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variants = {
  primary:   "bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200 border border-orange-500",
  secondary: "bg-green-500 hover:bg-green-600 text-white shadow-sm shadow-green-200 border border-green-500",
  outline:   "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300",
  ghost:     "bg-transparent text-stone-600 hover:bg-stone-100",
  danger:    "bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-200 border border-red-500",
  success:   "bg-green-500 hover:bg-green-600 text-white shadow-sm shadow-green-200 border border-green-500",
};

const sizes = {
  sm:  "px-3 py-1.5 text-[12px] rounded-lg gap-1.5",
  md:  "px-4 py-2 text-[13px] rounded-lg gap-2",
  lg:  "px-6 py-2.5 text-[14px] rounded-xl gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, children, className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-150 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
export default Button;
