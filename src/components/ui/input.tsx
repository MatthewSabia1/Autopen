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
          "flex h-10 w-full rounded-md border border-accent-tertiary/20 bg-cream px-3 py-2 text-ink-dark font-serif shadow-soft transition-colors duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-faded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
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
