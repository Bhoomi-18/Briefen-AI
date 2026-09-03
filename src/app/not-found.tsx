"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles, AlertCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main role="main" className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 text-white relative select-none overflow-hidden">
      {/* Subtle grid pattern background */}
      <div className="absolute inset-0 bg-grid-white/[0.015] pointer-events-none" />
      
      {/* Abstract glow */}
      <div className="absolute w-[360px] h-[360px] rounded-full bg-primary/10 blur-[100px] animate-pulse pointer-events-none" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 max-w-sm text-center space-y-6 px-6"
      >
        <div className="mx-auto w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.15)]">
          <Sparkles className="w-5.5 h-5.5 animate-ai-pulse" />
        </div>
        
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white">404</h1>
          <h2 className="text-sm font-semibold text-foreground/90 uppercase tracking-wider">Page Not Found</h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
            The page you are looking for doesn't exist or has been moved to another path in this workspace.
          </p>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <Link href="/dashboard">
            <Button variant="ai" size="sm" aria-label="Go to Dashboard">
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm" aria-label="Back to landing page" className="bg-transparent border-white/10 hover:bg-white/5 hover:text-white">
              <span>Back Home</span>
            </Button>
          </Link>
        </div>
      </motion.div>
    </main>
  )
}
