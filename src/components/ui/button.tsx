import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded text-button font-serif font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/20 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-accent-primary text-white hover:bg-accent-secondary hover:shadow-blue-sm active:bg-accent-primary/95 transition-all duration-200",
        destructive:
          "bg-danger text-white hover:bg-danger/90 active:bg-danger/95 transition-all duration-200",
        outline:
          "border border-accent-tertiary/30 text-ink-dark bg-transparent hover:border-accent-primary/30 hover:text-accent-primary hover:shadow-blue-sm hover:bg-accent-tertiary/10 active:bg-accent-primary/5 transition-all duration-200",
        secondary:
          "bg-accent-secondary text-white hover:bg-accent-primary hover:shadow-blue-sm active:bg-accent-secondary/95 transition-all duration-200",
        ghost: 
          "bg-transparent hover:bg-accent-tertiary/20 hover:text-ink-dark active:bg-accent-tertiary/30 text-ink-light transition-all duration-200",
        link: 
          "text-accent-primary underline-offset-4 hover:underline bg-transparent transition-all duration-200",
        paper:
          "bg-paper text-ink-dark border border-accent-tertiary/20 hover:bg-cream hover:border-accent-primary/30 active:bg-accent-tertiary/10 transition-all duration-200",
        yellow:
          "bg-accent-yellow text-white hover:bg-accent-yellow/90 shadow-yellow-sm hover:shadow-yellow transition-all duration-200",
        yellowOutline:
          "bg-transparent text-accent-yellow hover:bg-accent-yellow/10 hover:shadow-yellow-sm border border-accent-yellow/30 hover:border-accent-yellow/50 transition-all duration-200",
        cta:
          "bg-accent-yellow text-white hover:bg-accent-yellow/90 shadow-yellow-sm hover:shadow-yellow transition-all duration-200",
      },
      size: {
        default: "h-11 px-5 py-2.5 text-button",
        sm: "h-9 px-3.5 py-2 text-small",
        lg: "h-14 px-8 py-4 text-body",
        icon: "h-11 w-11 p-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
