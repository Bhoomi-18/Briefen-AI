"use client"

import * as React from "react"
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export type ToastVariant = "default" | "success" | "error" | "warning" | "info" | "ai"

export interface ToastMessage {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number // duration in ms
}

interface ToastContextType {
  toast: (message: Omit<ToastMessage, "id">) => void
  dismiss: (id: string) => void
  toasts: ToastMessage[]
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([])

  const toast = React.useCallback(
    ({ title, description, variant = "default", duration = 4000 }: Omit<ToastMessage, "id">) => {
      const id = Math.random().toString(36).substring(2, 9)
      setToasts((prev) => [...prev, { id, title, description, variant, duration }])
    },
    []
  )

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, dismiss }: { toasts: ToastMessage[]; dismiss: (id: string) => void }) {
  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((item) => (
          <ToastItem key={item.id} message={item} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ message, onDismiss }: { message: ToastMessage; onDismiss: (id: string) => void }) {
  const { id, title, description, variant = "default", duration = 4000 } = message

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id)
    }, duration)
    return () => clearTimeout(timer)
  }, [id, duration, onDismiss])

  // Keyboard dismiss with Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDismiss(id)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [id, onDismiss])

  const icons = {
    default: null,
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    error: <AlertCircle className="h-5 w-5 text-destructive" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    info: <Info className="h-5 w-5 text-sky-500" />,
    ai: <Sparkles className="h-5 w-5 text-purple-500 animate-ai-pulse" />,
  }

  const borderStyles = {
    default: "border-border bg-card text-foreground",
    success: "border-emerald-500/20 bg-emerald-500/[0.02] text-foreground dark:border-emerald-500/10",
    error: "border-destructive/20 bg-destructive/[0.02] text-foreground dark:border-destructive/10",
    warning: "border-amber-500/20 bg-amber-500/[0.02] text-foreground dark:border-amber-500/10",
    info: "border-sky-500/20 bg-sky-500/[0.02] text-foreground dark:border-sky-500/10",
    ai: "border-purple-500/25 bg-gradient-to-r from-card to-purple-500/[0.02] text-foreground dark:border-purple-500/15 shadow-[0_0_15px_rgba(139,92,246,0.05)]",
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      role="alert"
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md ${borderStyles[variant]}`}
    >
      {icons[variant] && <div className="shrink-0 mt-0.5">{icons[variant]}</div>}
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-display text-sm font-semibold leading-tight text-foreground/90">{title}</h5>}
        {description && <p className="text-xs text-muted-foreground leading-normal">{description}</p>}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="shrink-0 rounded-md p-1 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}
