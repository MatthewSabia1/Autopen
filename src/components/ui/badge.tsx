import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-accent-primary/30 dark:focus:ring-accent-primary/50 focus:ring-offset-background dark:focus:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-accent-primary dark:bg-accent-primary text-white dark:text-white shadow-sm dark:shadow-none hover:bg-accent-primary/90 dark:hover:bg-accent-primary/90",
        secondary:
          "border-transparent bg-secondary dark:bg-secondary text-white dark:text-white hover:bg-secondary/90 dark:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive dark:bg-destructive text-white dark:text-white shadow-sm dark:shadow-none hover:bg-destructive/90 dark:hover:bg-destructive/90",
        outline: 
          "text-ink-dark dark:text-ink-light border-accent-tertiary dark:border-accent-tertiary/60",
        success: 
          "border-transparent bg-success dark:bg-success text-white dark:text-white shadow-sm dark:shadow-none hover:bg-success/90 dark:hover:bg-success/90",
        warning: 
          "border-transparent bg-warning dark:bg-warning text-white dark:text-white shadow-sm dark:shadow-none hover:bg-warning/90 dark:hover:bg-warning/90",
        info: 
          "border-transparent bg-info dark:bg-info text-white dark:text-white shadow-sm dark:shadow-none hover:bg-info/90 dark:hover:bg-info/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
