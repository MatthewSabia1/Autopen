import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-md border border-accent-tertiary dark:border-accent-tertiary/50 bg-white dark:bg-card px-4 py-2.5 text-ink-dark dark:text-ink-light font-serif shadow-inner dark:shadow-none transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-faded dark:placeholder:text-ink-faded focus-visible:outline-none focus-visible:border-accent-primary/50 dark:focus-visible:border-accent-primary/70 focus-visible:ring-1 focus-visible:ring-accent-primary/20 dark:focus-visible:ring-accent-primary/40 disabled:cursor-not-allowed disabled:opacity-50 hover:border-accent-primary/30 dark:hover:border-accent-primary/50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
