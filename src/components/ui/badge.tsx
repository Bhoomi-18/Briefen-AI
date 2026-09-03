import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "info"
    | "ai"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseStyles =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 select-none cursor-default"

  const variants = {
    default:
      "border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary/80",
    secondary:
      "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive:
      "border-transparent bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/80",
    outline: "text-foreground border-border hover:bg-accent hover:text-accent-foreground",
    success:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20",
    warning:
      "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20",
    info:
      "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20",
    ai:
      "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.1)] hover:bg-purple-500/20 hover:shadow-[0_0_12px_rgba(168,85,247,0.2)]",
  }

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props} />
  )
}

export { Badge }
