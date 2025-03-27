import * as React from "react";

import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "stat" | "action" | "template";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const baseStyles = "rounded-lg transition-all duration-300 backdrop-blur-sm";
    
    const variantStyles = {
      default: "border border-accent-tertiary/20 dark:border-accent-tertiary/50 bg-paper dark:bg-card text-ink-dark dark:text-ink-light shadow-sm dark:shadow-dark-sm hover:shadow-md dark:hover:shadow-dark hover:border-accent-primary/30 dark:hover:border-accent-primary/40",
      stat: "border border-accent-tertiary/30 dark:border-accent-tertiary/50 bg-gradient-to-br from-white to-cream dark:from-card dark:to-dark-bg shadow-blue-sm dark:shadow-dark-sm",
      action: "border border-accent-tertiary/20 dark:border-accent-tertiary/50 bg-white dark:bg-card hover:bg-accent-primary/5 dark:hover:bg-accent-primary/10 hover:border-accent-primary/20 dark:hover:border-accent-primary/40 shadow-none dark:shadow-none cursor-pointer",
      template: "border border-accent-yellow/30 dark:border-accent-yellow/40 bg-white dark:bg-card shadow-yellow-sm dark:shadow-dark-sm",
    };
    
    return (
      <div
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-3 pb-3 pt-5 px-6 border-b border-accent-tertiary/20 dark:border-accent-tertiary/50", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-display text-card-title font-medium text-ink-dark dark:text-ink-dark leading-tight tracking-tight",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-small text-ink-light dark:text-ink-light font-serif", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-6 py-5", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
