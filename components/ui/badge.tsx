import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors",
  {
    variants: {
      variant: {
        default:     "border-blue-200    bg-blue-100    text-blue-800",
        secondary:   "border-slate-200   bg-slate-100   text-slate-700",
        destructive: "border-red-200     bg-red-100     text-red-800",
        success:     "border-emerald-200 bg-emerald-100 text-emerald-800",
        warning:     "border-amber-200   bg-amber-100   text-amber-800",
        outline:     "border-slate-300   bg-white       text-slate-700",
        lime:        "border-violet-200  bg-violet-100  text-violet-800",
        blue:        "border-blue-200    bg-blue-100    text-blue-800",
        purple:      "border-purple-200  bg-purple-100  text-purple-800",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

