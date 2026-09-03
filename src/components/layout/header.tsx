"use client"

import * as React from "react"
import { Search, Bell, Sun, Moon, Laptop, Menu, X, Sparkles, Check, CheckSquare } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useTheme } from "@/components/providers/theme-provider"
import { useToast } from "@/components/providers/toast-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"

import { useNotifications } from "@/lib/hooks"

interface HeaderProps {
  className?: string
  onMobileMenuToggle?: () => void
  isMobileMenuOpen?: boolean
  onSearchClick?: () => void
}

export function Header({ className, onMobileMenuToggle, isMobileMenuOpen, onSearchClick }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [scrolled, setScrolled] = React.useState(false)
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [isNotifOpen, setIsNotifOpen] = React.useState(false)
  const notifRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close notifications on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Keyboard shortcut Cmd/Ctrl + K for search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        handleSearchClick()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onSearchClick])

  const handleSearchClick = () => {
    if (onSearchClick) {
      onSearchClick()
    }
  }

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return
    try {
      await markAllRead()
      toast({
        title: "All cleared",
        description: "Successfully marked all alerts as read.",
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to clear notifications.",
        variant: "error",
      })
    }
  }

  const handleMarkOneRead = async (id: string) => {
    try {
      await markRead(id)
      toast({
        title: "Alert read",
        description: "Notification marked as read.",
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to mark notification.",
        variant: "error",
      })
    }
  }

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  // Derive dynamic page name for breadcrumbs
  const getPageName = () => {
    if (pathname.startsWith("/dashboard")) return "Dashboard"
    if (pathname.startsWith("/meetings")) return "Knowledge Library"
    if (pathname.startsWith("/chat")) return "Briefen AI"
    if (pathname.startsWith("/decisions")) return "Decision Ledger"
    if (pathname.startsWith("/timeline")) return "Project Timeline"
    if (pathname.startsWith("/tasks")) return "Tasks"
    if (pathname.startsWith("/analytics")) return "Project Intelligence"
    if (pathname.startsWith("/settings")) return "Settings"
    return "Briefen Core"
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-35 flex h-16 w-full items-center justify-between border-b border-border/40 px-4 bg-background/70 backdrop-blur-md transition-shadow duration-300",
        scrolled && "shadow-xs border-border/60",
        className
      )}
    >
      {/* Left side: Hamburger (mobile) / Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileMenuOpen}
          className="md:hidden p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground select-none">
          <span className="hover:text-foreground cursor-pointer transition-colors">Workspace</span>
          <span className="text-border">/</span>
          <span className="text-foreground/90 font-semibold truncate">{getPageName()}</span>
        </div>
      </div>

      {/* Center/Right: Search command launcher & Buttons */}
      <div className="flex items-center gap-3">
        {/* Cmd + K Search Trigger */}
        <button
          onClick={handleSearchClick}
          className="flex h-9 items-center gap-2 rounded-lg border border-border/80 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/65 hover:border-border transition-all w-40 sm:w-60 cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 text-left">Search index...</span>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border/60 bg-muted px-1.5 font-mono text-[9px] font-medium opacity-80">
            ⌘K
          </kbd>
        </button>

        {/* Theme switch button */}
        <Button variant="ghost" size="icon" onClick={cycleTheme} className="h-9 w-9 rounded-lg">
          {theme === "light" && <Sun className="h-4.5 w-4.5 text-muted-foreground hover:text-foreground" />}
          {theme === "dark" && <Moon className="h-4.5 w-4.5 text-muted-foreground hover:text-foreground" />}
          {theme === "system" && <Laptop className="h-4.5 w-4.5 text-muted-foreground hover:text-foreground" />}
        </Button>

        {/* Notifications Popover Dropdown */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="h-9 w-9 rounded-lg relative"
            aria-label="Toggle notifications menu"
          >
            <Bell className="h-4.5 w-4.5 text-muted-foreground hover:text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background animate-pulse" />
            )}
          </Button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="p-3 border-b border-border/40 flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
                  >
                    <CheckSquare className="w-3 h-3" />
                    <span>Clear all</span>
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-border/30">
                {notifications.length > 0 ? (
                  notifications.map((n: any) => (
                    <div
                      key={n.id}
                      className={cn(
                        "p-3 text-left space-y-1 hover:bg-muted/30 transition-colors relative group",
                        !n.is_read && "bg-primary/[0.01]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={cn("text-xs font-semibold block leading-tight", !n.is_read ? "text-foreground" : "text-muted-foreground")}>
                          {n.title}
                        </span>
                        {!n.is_read && (
                          <button
                            onClick={() => handleMarkOneRead(n.id)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-normal">{n.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground/80">No unread alerts</p>
                    <p className="text-[10px]">Your workspace is fully up to date.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Upload/New Meeting Quick Action (Desktop) */}
        <Button
          variant="ai"
          size="sm"
          onClick={() => {
            toast({
              title: "Opening Upload Portal",
              description: "Opening drag-and-drop wizard on your dashboard.",
              variant: "ai",
            })
            router.push("/dashboard")
          }}
          className="hidden sm:flex items-center gap-1.5 h-9"
        >
          <Sparkles className="w-3.5 h-3.5 animate-ai-pulse" />
          <span>New Upload</span>
        </Button>
      </div>
    </header>
  )
}
