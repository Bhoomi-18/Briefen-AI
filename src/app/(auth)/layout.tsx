"use client"

import * as React from "react"
import Link from "next/link"
import { Sparkles, MessageSquare, CheckCircle, Video } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Left Column: Form Panel */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 md:p-10 z-10 bg-background">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo header */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.25)]">
                <Sparkles className="w-4.5 h-4.5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-base text-foreground tracking-tight">
                Briefen
              </span>
            </Link>
          </div>
          {children}
        </div>
      </div>

      {/* Right Column: Premium Visual Graphic (Desktop only) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-linear-to-br from-indigo-950 via-zinc-950 to-purple-950 text-white relative border-l border-border/10 overflow-hidden select-none">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
        
        {/* Floating abstract glowing spheres */}
        <div className="absolute top-[20%] left-[30%] w-72 h-72 rounded-full bg-primary/10 blur-[80px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[20%] w-80 h-80 rounded-full bg-purple-500/10 blur-[100px] animate-pulse" />

        {/* Top visual quote */}
        <div className="z-10">
          <Badge variant="ai" className="backdrop-blur-md bg-white/5 border-white/10 text-white px-3 py-1">
            Briefen Platform
          </Badge>
        </div>

        {/* Center floating mockup cards illustration */}
        <div className="relative flex-1 flex items-center justify-center z-10">
          <div className="space-y-4 w-96 transform rotate-[-2deg]">
            {/* Simulation Card 1 */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-xl space-y-2 translate-x-[-15px]">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span className="flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" /> Product Design Sync
                </span>
                <span>42:15</span>
              </div>
              <p className="text-xs text-white/95 font-medium leading-relaxed">
                "We need to consolidate Tailwind configuration and build reusable components."
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                <span className="text-[10px] text-purple-300 font-semibold uppercase tracking-wider">AI Transcript segment</span>
              </div>
            </div>

            {/* Simulation Card 2 */}
            <div className="rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 backdrop-blur-md p-4 shadow-2xl space-y-2.5 translate-x-[15px] relative">
              <div className="absolute -top-2.5 -right-2 bg-primary px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-md animate-ai-pulse">
                AI Extracted
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-white/95">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Assign Action Items</span>
              </div>
              <div className="text-[11px] text-white/80 pl-6 leading-relaxed">
                Assignee: <span className="text-purple-300 font-semibold">Marcus Wright</span><br/>
                Task: Create tailwind CSS custom variable config files by Friday.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom footer guidelines reference */}
        <div className="z-10 space-y-1">
          <p className="text-xs text-white/80 leading-relaxed font-display font-medium">
            "Saves us hours of meeting notes alignment every single week."
          </p>
          <span className="text-[10px] text-white/50 block">
            — Senior Product Designer, Stripe
          </span>
        </div>
      </div>
    </div>
  )
}


