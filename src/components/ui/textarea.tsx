import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-accent-tertiary dark:border-accent-tertiary/60 bg-white dark:bg-card px-4 py-3 text-ink-dark dark:text-ink-dark font-serif shadow-inner dark:shadow-none transition-all duration-200 placeholder:text-ink-faded dark:placeholder:text-ink-faded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary/30 dark:focus-visible:ring-accent-primary/50 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
