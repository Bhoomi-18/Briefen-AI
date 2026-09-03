"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { CommandPalette } from "@/components/layout/command-palette"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles } from "lucide-react"
import Link from "next/link"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const pathname = usePathname()

  // Close mobile navigation drawer whenever pathname shifts
  React.useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Desktop Sidebar (visible on md+) */}
      <Sidebar />

      {/* Mobile Drawer (visible on <md) */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              aria-hidden="true"
              className="fixed inset-0 z-50 bg-background/60 backdrop-blur-xs md:hidden"
            />
            {/* Sidebar drawer content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border md:hidden flex flex-col h-full shadow-2xl"
            >
              {/* Header inside drawer to close */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-border/40 shrink-0">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.25)]">
                    <Sparkles className="w-4.5 h-4.5 text-primary-foreground animate-ai-pulse" />
                  </div>
                  <span className="font-display font-bold text-base text-foreground tracking-tight">
                    Briefen
                  </span>
                </Link>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Custom mobile sidebar render */}
              <Sidebar className="flex! border-r-0 h-full" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main app body */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <Header
          isMobileMenuOpen={isMobileOpen}
          onMobileMenuToggle={() => setIsMobileOpen(!isMobileOpen)}
          onSearchClick={() => setIsSearchOpen(true)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 bg-background/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto max-w-7xl space-y-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  )
}
