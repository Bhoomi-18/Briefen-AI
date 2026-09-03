import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  helperText?: string
  label?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, helperText, label, leftIcon, rightIcon, id: providedId, required, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = providedId || generatedId
    const errorId = error ? `${inputId}-error` : undefined
    const helperId = helperText && !error ? `${inputId}-helper` : undefined
    const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-foreground/80 tracking-wide uppercase flex items-center"
          >
            <span>{label}</span>
            {required && <span className="text-destructive ml-0.5" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-muted-foreground pointer-events-none flex items-center" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            type={type}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              error && "border-destructive/80 focus-visible:border-destructive focus-visible:ring-destructive/20",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-muted-foreground pointer-events-none flex items-center" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </div>
        {error ? (
          <p id={errorId} className="text-xs text-destructive font-medium" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-muted-foreground">{helperText}</p>
        ) : null}
      </div>
    )
  }
)
Input.displayName = "Input"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  helperText?: string
  label?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, helperText, label, id: providedId, required, ...props }, ref) => {
    const generatedId = React.useId()
    const textareaId = providedId || generatedId
    const errorId = error ? `${textareaId}-error` : undefined
    const helperId = helperText && !error ? `${textareaId}-helper` : undefined
    const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-semibold text-foreground/80 tracking-wide uppercase flex items-center"
          >
            <span>{label}</span>
            {required && <span className="text-destructive ml-0.5" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none",
            error && "border-destructive/80 focus-visible:border-destructive focus-visible:ring-destructive/20",
            className
          )}
          ref={ref}
          {...props}
        />
        {error ? (
          <p id={errorId} className="text-xs text-destructive font-medium" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-muted-foreground">{helperText}</p>
        ) : null}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Input, Textarea }
