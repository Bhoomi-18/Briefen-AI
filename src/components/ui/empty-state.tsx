"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description: string
  icon?: LucideIcon
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  variant?: "default" | "ai"
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      title,
      description,
      icon: Icon,
      actionLabel,
      onAction,
      secondaryActionLabel,
      onSecondaryAction,
      variant = "default",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center p-8 border border-dashed border-border/60 rounded-2xl bg-card/30 backdrop-blur-xs min-h-[360px]",
          variant === "ai" && "border-purple-500/20 bg-linear-to-b from-card/30 to-purple-500/[0.01]",
          className
        )}
        {...props}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center"
          aria-label={`Empty state: ${title}`}
        >
          <div
            className={cn(
              "flex items-center justify-center w-14 h-14 rounded-xl bg-muted/60 dark:bg-muted/40 mb-5 text-muted-foreground",
              variant === "ai" && "bg-purple-500/10 text-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.1)] border border-purple-500/25 animate-ai-pulse"
            )}
          >
            {Icon ? <Icon className="w-6 h-6" /> : null}
          </div>
          <h4 className="font-display text-base font-semibold text-foreground/90 tracking-tight">
            {title}
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mt-1.5 mb-6 leading-relaxed">
            {description}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {secondaryActionLabel && onSecondaryAction && (
              <Button variant="outline" size="sm" onClick={onSecondaryAction}>
                {secondaryActionLabel}
              </Button>
            )}
            {actionLabel && onAction && (
              <Button
                variant={variant === "ai" ? "ai" : "default"}
                size="sm"
                onClick={onAction}
              >
                {actionLabel}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

export { EmptyState }
