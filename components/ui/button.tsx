import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:     "bg-blue-600 text-slate-900 shadow-sm hover:bg-blue-700 active:scale-95",
        destructive: "bg-red-600 text-slate-900 shadow-sm hover:bg-red-700 active:scale-95",
        outline:     "border-2 border-blue-600 bg-white text-blue-600 hover:bg-blue-50 active:scale-95",
        secondary:   "bg-slate-100 text-slate-800 font-medium hover:bg-slate-200 active:scale-95",
        ghost:       "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
        link:        "text-blue-600 underline-offset-4 hover:underline",
        lime:        "bg-violet-600 text-slate-900 shadow-sm hover:bg-violet-700 font-semibold active:scale-95",
        success:     "bg-emerald-600 text-slate-900 shadow-sm hover:bg-emerald-700 active:scale-95",
        warning:     "bg-amber-500 text-slate-900 shadow-sm hover:bg-amber-600 active:scale-95",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm:      "h-8 rounded-lg px-3 text-xs",
        lg:      "h-11 rounded-xl px-6 text-base",
        xl:      "h-13 rounded-xl px-8 text-lg",
        icon:    "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

