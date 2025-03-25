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
          "flex h-12 w-full rounded-md border border-accent-tertiary bg-white px-4 py-2.5 text-ink-dark font-serif shadow-inner transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-faded focus-visible:outline-none focus-visible:border-accent-primary/50 focus-visible:ring-1 focus-visible:ring-accent-primary/20 disabled:cursor-not-allowed disabled:opacity-50 hover:border-accent-primary/30",
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
