import * as React from "react"
import { cn } from "@/lib/utils"

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "warning" | "info" | "success" | "ai"
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const baseStyles =
      "relative w-full rounded-xl border p-4 [&>svg~div]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground"

    const variants = {
      default: "bg-background text-foreground border-border",
      destructive:
        "border-destructive/30 bg-destructive/5 text-destructive [&>svg]:text-destructive",
      warning:
        "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400",
      info:
        "border-sky-500/30 bg-sky-500/5 text-sky-800 dark:text-sky-300 [&>svg]:text-sky-600 dark:[&>svg]:text-sky-400",
      success:
        "border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400",
      ai:
        "border-purple-500/30 bg-gradient-to-r from-purple-500/[0.03] to-indigo-500/[0.03] text-purple-900 dark:text-purple-300 [&>svg]:text-purple-600 dark:[&>svg]:text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.02)]",
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      />
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("font-display font-semibold leading-none tracking-tight text-sm mb-1", className)}
      {...props}
    />
  )
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-xs text-muted-foreground/90 [&_p]:leading-relaxed", className)}
      {...props}
    />
  )
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
