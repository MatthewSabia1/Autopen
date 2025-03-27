import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground dark:[&>svg]:text-foreground [&>svg~*]:pl-7 shadow-sm dark:shadow-md transition-colors duration-200",
  {
    variants: {
      variant: {
        default: "bg-background dark:bg-card border-accent-tertiary/30 dark:border-accent-tertiary/60 text-foreground dark:text-foreground",
        destructive:
          "border-destructive/50 dark:border-destructive/60 bg-destructive/10 dark:bg-destructive/20 text-destructive dark:text-destructive/90 [&>svg]:text-destructive dark:[&>svg]:text-destructive/90",
        info: "border-info/50 dark:border-info/60 bg-info/10 dark:bg-info/20 text-info dark:text-info/90 [&>svg]:text-info dark:[&>svg]:text-info/90",
        success: "border-success/50 dark:border-success/60 bg-success/10 dark:bg-success/20 text-success dark:text-success/90 [&>svg]:text-success dark:[&>svg]:text-success/90",
        warning: "border-warning/50 dark:border-warning/60 bg-warning/10 dark:bg-warning/20 text-warning dark:text-warning/90 [&>svg]:text-warning dark:[&>svg]:text-warning/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight text-ink-dark dark:text-ink-dark", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-ink-light dark:text-ink-light [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
