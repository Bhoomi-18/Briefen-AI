"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Sparkles, Mail, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/providers/toast-provider"

interface ComingSoonProps {
  title: string
  description: string
  versionBadge: string
  type: "workspace" | "billing" | "integrations" | "api-access" | "audit-logs" | "admin"
}

export function ComingSoon({ title, description, versionBadge, type }: ComingSoonProps) {
  const { toast } = useToast()
  const [subscribed, setSubscribed] = React.useState(false)

  const handleNotify = () => {
    setSubscribed(true)
    toast({
      title: "Notification Active",
      description: `We'll update your account (john@acme.com) as soon as this feature launches.`,
      variant: "success",
    })
  }

  // Elegant SVGs for each type of feature
  const renderIllustration = () => {
    const baseSvgClass = "w-48 h-48 text-primary/45"
    
    switch (type) {
      case "workspace":
        return (
          <svg viewBox="0 0 200 200" className={baseSvgClass} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="workspace-glow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <motion.circle
              cx="100" cy="100" r="50"
              fill="url(#workspace-glow)"
              stroke="currentColor" strokeWidth="2" strokeDasharray="4 4"
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            />
            {/* Center nodes */}
            <motion.circle cx="100" cy="50" r="12" fill="currentColor" className="text-primary" animate={{ scale: [0.9, 1.1, 0.9] }} transition={{ duration: 3, repeat: Infinity }} />
            <motion.circle cx="60" cy="120" r="10" fill="currentColor" className="text-indigo-500" animate={{ scale: [1.1, 0.9, 1.1] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} />
            <motion.circle cx="140" cy="120" r="10" fill="currentColor" className="text-violet-500" animate={{ scale: [0.9, 1.1, 0.9] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} />
            {/* Connection paths */}
            <line x1="100" y1="50" x2="60" y2="120" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
            <line x1="100" y1="50" x2="140" y2="120" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
            <line x1="60" y1="120" x2="140" y2="120" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
          </svg>
        )
      case "billing":
        return (
          <svg viewBox="0 0 200 200" className={baseSvgClass} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="billing-glow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            {/* Floating grid cards */}
            <motion.rect
              x="40" y="60" width="120" height="75" rx="10"
              fill="url(#billing-glow)" stroke="currentColor" strokeWidth="2"
              animate={{ y: [60, 52, 60] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.rect
              x="60" y="80" width="40" height="15" rx="3"
              fill="currentColor" fillOpacity="0.2"
              animate={{ y: [80, 72, 80] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.circle
              cx="130" cy="98" r="14"
              stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3"
              animate={{ rotate: -360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            {/* Dollar coin symbols */}
            <motion.path
              d="M130 92 v12 M126 95 h8 a3 3 0 0 1 0 6 h-8 a3 3 0 0 0 0 6 h8"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              animate={{ scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </svg>
        )
      case "integrations":
        return (
          <svg viewBox="0 0 200 200" className={baseSvgClass} fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Puzzle modules / connections */}
            <motion.rect
              x="35" y="70" width="45" height="45" rx="6"
              fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2"
              animate={{ x: [35, 45, 35] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.rect
              x="120" y="70" width="45" height="45" rx="6"
              fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2"
              animate={{ x: [120, 110, 120] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.circle
              cx="100" cy="92" r="8"
              fill="currentColor" className="text-primary"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {/* Bus lines */}
            <path d="M 80 92 L 120 92" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
          </svg>
        )
      case "api-access":
        return (
          <svg viewBox="0 0 200 200" className={baseSvgClass} fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="40" y="55" width="120" height="90" rx="8" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.05" />
            <line x1="40" y1="75" x2="160" y2="75" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
            <circle cx="52" cy="65" r="3" fill="currentColor" />
            <circle cx="62" cy="65" r="3" fill="currentColor" />
            <circle cx="72" cy="65" r="3" fill="currentColor" />
            {/* Code lines */}
            <motion.path
              d="M 55 95 L 85 95 M 55 110 L 115 110 M 55 125 L 95 125"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray="100"
              initial={{ strokeDashoffset: 100 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
            />
          </svg>
        )
      case "audit-logs":
        return (
          <svg viewBox="0 0 200 200" className={baseSvgClass} fill="none" xmlns="http://www.w3.org/2000/svg">
            <motion.path
              d="M100 45 L150 65 V110 C150 145 120 165 100 170 C80 165 50 145 50 110 V65 Z"
              stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.05"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Secure lines */}
            <motion.path
              d="M 80 90 L 120 90 M 75 110 L 125 110 M 90 130 L 110 130"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </svg>
        )
      case "admin":
        return (
          <svg viewBox="0 0 200 200" className={baseSvgClass} fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="40" y="50" width="120" height="100" rx="6" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.05" />
            {/* Dialers */}
            <circle cx="70" cy="80" r="15" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            <motion.line x1="70" y1="80" x2="70" y2="70" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "70px 80px" }} />
            
            <circle cx="130" cy="80" r="15" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            <motion.line x1="130" y1="80" x2="120" y2="80" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" animate={{ rotate: -360 }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "130px 80px" }} />
            
            {/* Sliders */}
            <line x1="55" y1="120" x2="145" y2="120" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
            <motion.circle cx="90" cy="120" r="5" fill="currentColor" className="text-primary" animate={{ cx: [70, 130, 70] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-12 text-center max-w-2xl mx-auto space-y-6 select-none min-h-[500px]">
      {/* Premium Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Badge variant="ai" className="px-3 py-1 font-semibold uppercase tracking-wider text-[10px] shadow-sm">
          <Sparkles className="w-3.5 h-3.5 mr-1 animate-ai-pulse" />
          {versionBadge}
        </Badge>
      </motion.div>

      {/* Dynamic Animated Vector Illustration */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative flex items-center justify-center p-4 rounded-full bg-primary/[0.02] border border-primary/5 shadow-[0_0_50px_rgba(139,92,246,0.03)]"
      >
        <div className="absolute inset-0 rounded-full bg-radial from-primary/[0.05] to-transparent blur-xl animate-ai-pulse" />
        {renderIllustration()}
      </motion.div>

      {/* Feature Metadata details */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="space-y-2.5"
      >
        <h2 className="text-2xl font-bold font-display tracking-tight text-foreground/90">
          {title}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
          {description}
        </p>
      </motion.div>

      {/* Waitlist Subscription CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="w-full max-w-sm pt-4"
      >
        {subscribed ? (
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Successfully subscribed for early access!</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="email"
                readOnly
                value="john@acme.com"
                className="w-full h-9 pl-3 pr-3 text-xs bg-muted border border-border rounded-lg text-muted-foreground font-medium select-all cursor-not-allowed"
                aria-label="Waitlist email"
              />
            </div>
            <Button variant="ai" size="sm" onClick={handleNotify} className="h-9 font-semibold">
              <Mail className="w-3.5 h-3.5 mr-1.5" />
              <span>Notify Me</span>
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
