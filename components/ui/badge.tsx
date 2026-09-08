import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-blue-600 text-white",
        secondary: "border-transparent bg-zinc-700 text-zinc-200",
        destructive: "border-transparent bg-red-600/20 text-red-400 border-red-600/30",
        success: "border-transparent bg-emerald-600/20 text-emerald-400 border-emerald-600/30",
        warning: "border-transparent bg-amber-500/20 text-amber-400 border-amber-500/30",
        outline: "border-zinc-600 text-zinc-300",
        lime: "border-transparent bg-lime-500/20 text-lime-400 border-lime-500/30",
        blue: "border-transparent bg-blue-500/20 text-blue-400 border-blue-500/30",
        purple: "border-transparent bg-purple-500/20 text-purple-400 border-purple-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
