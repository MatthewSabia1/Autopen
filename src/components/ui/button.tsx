import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded text-button font-serif font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/20 dark:focus-visible:ring-accent-primary/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-accent-primary text-white dark:bg-accent-primary dark:text-white hover:bg-accent-secondary dark:hover:bg-accent-secondary hover:shadow-blue-sm dark:hover:shadow-dark-sm active:bg-accent-primary/95 dark:active:bg-accent-primary/90 transition-all duration-200",
        destructive:
          "bg-danger text-white dark:bg-danger dark:text-white hover:bg-danger/90 dark:hover:bg-danger/90 active:bg-danger/95 dark:active:bg-danger/95 transition-all duration-200",
        outline:
          "border border-accent-tertiary/30 dark:border-accent-tertiary/50 text-ink-dark dark:text-ink-light bg-transparent dark:bg-transparent hover:border-accent-primary/30 dark:hover:border-accent-primary/60 hover:text-accent-primary dark:hover:text-accent-primary hover:shadow-blue-sm dark:hover:shadow-dark-sm hover:bg-accent-tertiary/10 dark:hover:bg-accent-tertiary/20 active:bg-accent-primary/5 dark:active:bg-accent-primary/15 transition-all duration-200",
        secondary:
          "bg-accent-secondary text-white dark:bg-accent-secondary dark:text-white hover:bg-accent-primary dark:hover:bg-accent-primary hover:shadow-blue-sm dark:hover:shadow-dark-sm active:bg-accent-secondary/95 dark:active:bg-accent-secondary/95 transition-all duration-200",
        ghost: 
          "bg-transparent dark:bg-transparent hover:bg-accent-tertiary/20 dark:hover:bg-accent-tertiary/20 hover:text-ink-dark dark:hover:text-ink-dark active:bg-accent-tertiary/30 dark:active:bg-accent-tertiary/30 text-ink-light dark:text-ink-light transition-all duration-200",
        link: 
          "text-accent-primary dark:text-accent-primary underline-offset-4 hover:underline dark:hover:underline bg-transparent dark:bg-transparent transition-all duration-200",
        paper:
          "bg-paper dark:bg-card text-ink-dark dark:text-ink-light border border-accent-tertiary/20 dark:border-accent-tertiary/40 hover:bg-cream dark:hover:bg-dark-bg hover:border-accent-primary/30 dark:hover:border-accent-primary/50 active:bg-accent-tertiary/10 dark:active:bg-accent-tertiary/20 transition-all duration-200",
        yellow:
          "bg-accent-yellow text-white dark:bg-accent-yellow dark:text-white hover:bg-accent-yellow/90 dark:hover:bg-accent-yellow/90 shadow-yellow-sm dark:shadow-dark-sm hover:shadow-yellow dark:hover:shadow-dark transition-all duration-200",
        yellowOutline:
          "bg-transparent dark:bg-transparent text-accent-yellow dark:text-accent-yellow hover:bg-accent-yellow/10 dark:hover:bg-accent-yellow/20 hover:shadow-yellow-sm dark:hover:shadow-dark-sm border border-accent-yellow/30 dark:border-accent-yellow/40 hover:border-accent-yellow/50 dark:hover:border-accent-yellow/60 transition-all duration-200",
        cta:
          "bg-accent-yellow text-white dark:bg-accent-yellow dark:text-white hover:bg-accent-yellow/90 dark:hover:bg-accent-yellow/90 shadow-yellow-sm dark:shadow-dark-sm hover:shadow-yellow dark:hover:shadow-dark transition-all duration-200",
        workflow:
          "bg-accent-primary text-white dark:bg-accent-primary dark:text-white hover:bg-accent-secondary dark:hover:bg-accent-secondary hover:shadow-blue-sm dark:hover:shadow-dark-sm active:bg-accent-primary/95 dark:active:bg-accent-primary/90 transition-all duration-200",
        workflowSecondary:
          "bg-accent-secondary text-white dark:bg-accent-secondary dark:text-white hover:bg-accent-primary dark:hover:bg-accent-primary hover:shadow-blue-sm dark:hover:shadow-dark-sm active:bg-accent-secondary/95 dark:active:bg-accent-secondary/95 transition-all duration-200",
        workflowOutline:
          "border border-accent-tertiary/30 dark:border-accent-tertiary/50 bg-white dark:bg-transparent text-accent-primary dark:text-accent-primary hover:border-accent-primary/40 dark:hover:border-accent-primary/60 hover:shadow-blue-sm dark:hover:shadow-dark-sm hover:bg-accent-tertiary/5 dark:hover:bg-accent-tertiary/20 active:bg-accent-primary/5 dark:active:bg-accent-primary/15 transition-all duration-200",
        workflowGold:
          "bg-accent-yellow text-white dark:bg-accent-yellow dark:text-white hover:bg-accent-yellow/90 dark:hover:bg-accent-yellow/90 shadow-yellow-sm dark:shadow-dark-sm hover:shadow-yellow dark:hover:shadow-dark transition-all duration-200",
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
