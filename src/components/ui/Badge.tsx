import { cn } from "@/lib/cn";

type BadgeVariant = "green" | "orange" | "red" | "amber" | "blue" | "purple" | "gray" | "default";

const variants: Record<BadgeVariant, string> = {
  green:   "bg-green-100 text-green-700 border border-green-200",
  orange:  "bg-orange-100 text-orange-700 border border-orange-200",
  red:     "bg-red-100 text-red-700 border border-red-200",
  amber:   "bg-amber-100 text-amber-700 border border-amber-200",
  blue:    "bg-blue-100 text-blue-700 border border-blue-200",
  purple:  "bg-purple-100 text-purple-700 border border-purple-200",
  gray:    "bg-stone-100 text-stone-600 border border-stone-200",
  default: "bg-stone-100 text-stone-600 border border-stone-200",
};

export default function Badge({ variant = "gray", size = "md", children, className }: {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 rounded-full font-semibold",
      size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
