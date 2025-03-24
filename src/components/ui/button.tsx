import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-serif font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary/30 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-accent-primary text-white shadow-soft hover:bg-accent-primary/90 active:bg-accent-primary/95",
        destructive:
          "bg-danger text-white shadow-soft hover:bg-danger/90 active:bg-danger/95",
        outline:
          "border border-accent-primary/30 text-accent-primary bg-transparent hover:bg-accent-primary/5 active:bg-accent-primary/10",
        secondary:
          "bg-accent-secondary text-white shadow-soft hover:bg-accent-secondary/90 active:bg-accent-secondary/95",
        ghost: "bg-transparent hover:bg-accent-primary/5 hover:text-accent-primary active:bg-accent-primary/10 text-ink-light",
        link: "text-accent-primary underline-offset-4 hover:underline bg-transparent",
        paper:
          "bg-paper text-ink-dark border border-accent-tertiary/20 shadow-soft hover:bg-cream active:bg-accent-tertiary/5",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3 py-1 text-xs",
        lg: "h-12 rounded-md px-8 py-3 text-base",
        icon: "h-10 w-10 p-2",
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
