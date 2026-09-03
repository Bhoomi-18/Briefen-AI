import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/60 dark:bg-muted/40 shimmer",
        className
      )}
      {...props}
    />
  )
}

/** Pre-built skeleton composites for common loading patterns */

function SkeletonAvatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-8 w-8 rounded-full shrink-0", className)} {...props} />
}

function SkeletonText({ className, lines = 2, ...props }: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props} aria-hidden="true" role="presentation">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3 rounded", i === lines - 1 && lines > 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </div>
  )
}

function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={cn("rounded-xl border border-border/40 bg-card p-6 space-y-4", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

function SkeletonRow({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={cn("flex items-center gap-4 py-4 px-4 border-b border-border/30", className)}
      {...props}
    >
      <SkeletonAvatar />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-48" />
        <Skeleton className="h-2.5 w-24" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  )
}

function SkeletonTable({ rows = 4, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { rows?: number }) {
  return (
    <div aria-hidden="true" role="presentation" className={cn("rounded-xl border border-border/40 bg-card overflow-hidden", className)} {...props}>
      <div className="flex items-center gap-6 px-4 py-3 border-b border-border/40 bg-muted/20">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}

export { Skeleton, SkeletonAvatar, SkeletonText, SkeletonCard, SkeletonRow, SkeletonTable }
