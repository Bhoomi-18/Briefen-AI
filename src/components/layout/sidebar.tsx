"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Video,
  BarChart3,
  Settings2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Layers,
  HelpCircle,
  Activity,
  Compass,
  MessageSquare,
  CheckSquare,
  Users,
  Cpu,
  Shield,
  Sliders,
  CreditCard,
  Link2,
  Library,
  Scale,
  GitCommit,
  LogOut,
  ChevronUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/hooks"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false)
  const userMenuRef = React.useRef<HTMLDivElement>(null)

  // Close user menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Derive user display info
  const userName = user?.profile?.full_name || user?.email?.split("@")[0] || "User"
  const userEmail = user?.email || ""
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
  const userAvatar = user?.profile?.avatar_url

  const navItems: { label: string; icon: any; href: string; badge?: string }[] = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      label: "Knowledge Library",
      icon: Library,
      href: "/meetings",
    },
    {
      label: "Briefen AI",
      icon: MessageSquare,
      href: "/chat",
    },
    {
      label: "Decision Ledger",
      icon: Scale,
      href: "/decisions",
    },
    {
      label: "Project Timeline",
      icon: GitCommit,
      href: "/timeline",
    },
    {
      label: "Tasks",
      icon: CheckSquare,
      href: "/tasks",
    },
    {
      label: "Project Intelligence",
      icon: BarChart3,
      href: "/analytics",
    },
    {
      label: "Settings",
      icon: Settings2,
      href: "/settings",
    },
  ]

  const roadmapItems = [
    {
      label: "Workspace Sync",
      icon: Users,
      badge: "v2",
      href: "/workspace",
      tooltip: "Team workspaces collaboration, roles delegation, and invitations."
    },
    {
      label: "Billing & Plans",
      icon: CreditCard,
      badge: "v2",
      href: "/billing",
      tooltip: "Subscription plans, seat license billing, and history."
    },
    {
      label: "Slack & Calendar",
      icon: Link2,
      badge: "v2",
      href: "/integrations",
      tooltip: "Auto zoom integrations and slack notifications alerts."
    },
    {
      label: "Developer API",
      icon: Cpu,
      badge: "v3",
      href: "/api-access",
      tooltip: "Developer API key accesses, webhooks hooks, and queries."
    },
    {
      label: "Security Audit Logs",
      icon: Shield,
      badge: "Ent",
      href: "/audit-logs",
      tooltip: "Workspace audit checks, user logins, and SOC2 configs."
    },
    {
      label: "Admin Dashboard",
      icon: Sliders,
      badge: "Ent",
      href: "/admin",
      tooltip: "Global workspace policies and admin management dashboards."
    }
  ]

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen border-r border-border/40 bg-card/65 backdrop-blur-md transition-all duration-300 relative select-none shrink-0 z-40 will-change-[width]",
        isCollapsed ? "w-[72px]" : "w-64",
        className
      )}
    >
      {/* Collapse/Expand Floating Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden md:flex absolute -right-3 top-5 w-6 h-6 rounded-full border border-border bg-card items-center justify-center text-muted-foreground/60 hover:text-foreground shadow-xs hover:scale-105 transition-all cursor-pointer z-50 focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 justify-between border-b border-border/40 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.25)]">
            <Sparkles className="w-4.5 h-4.5 text-primary-foreground animate-ai-pulse" />
          </div>
          {!isCollapsed && (
            <span className="font-display font-bold text-base bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent tracking-tight whitespace-nowrap">
              Briefen
            </span>
          )}
        </Link>
      </div>

      {/* Workspace Switcher */}
      <div className="p-3 shrink-0">
        <div
          className={cn(
            "flex items-center gap-2.5 p-2 rounded-lg border border-border/30 bg-muted/20 text-xs font-medium cursor-pointer transition-colors hover:bg-muted/50",
            isCollapsed && "justify-center"
          )}
        >
          <Layers className="w-4 h-4 text-muted-foreground shrink-0" />
          {!isCollapsed && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="font-semibold text-foreground/80 truncate">Personal Space</span>
              <span className="text-[10px] text-muted-foreground truncate">AI Workspace</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
        <div className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                  isCollapsed && "justify-center"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon className="w-4.5 h-4.5 shrink-0" />
                {!isCollapsed && <span className="flex-1 truncate text-xs">{item.label}</span>}
                {!isCollapsed && item.badge && (
                  <Badge
                    variant={isActive ? "secondary" : "default"}
                    className={cn(
                      "px-1.5 py-0.2 text-[10px] scale-90 shrink-0",
                      !isActive && "bg-muted text-muted-foreground font-semibold"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
                {isCollapsed && (
                  <div className="absolute left-16 bg-popover border border-border text-popover-foreground text-xs rounded-md py-1.5 px-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            )
          })}
        </div>

        {/* Roadmap Navigation section */}
        <div className="space-y-2">
          {!isCollapsed && (
            <span className="px-3 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest block select-none">
              Roadmap (V2/V3)
            </span>
          )}
          <div className="space-y-1.5">
            {roadmapItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/15 cursor-help",
                  isCollapsed && "justify-center"
                )}
              >
                <item.icon className="w-4.5 h-4.5 shrink-0" />
                {!isCollapsed && <span className="flex-1 truncate text-xs">{item.label}</span>}
                {!isCollapsed && (
                  <Badge variant="outline" className="scale-75 text-[8px] px-1 py-0 border-muted-foreground/30 text-muted-foreground/70 shrink-0 font-bold uppercase">
                    {item.badge}
                  </Badge>
                )}
                
                {/* Opaque side tooltip flyout */}
                <div className={cn(
                  "absolute bg-popover border border-border text-popover-foreground text-xs rounded-lg py-2.5 px-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal w-56 shadow-premium pointer-events-none z-50 leading-normal font-normal normal-case",
                  isCollapsed ? "left-16 top-1/2 -translate-y-1/2" : "left-56 top-1/2 -translate-y-1/2"
                )}>
                  <div className="font-semibold text-foreground/90 mb-1 flex items-center gap-1.5">
                    <span>{item.label}</span>
                    <Badge variant="outline" className="scale-75 text-[8px] px-1 py-0 font-bold uppercase">{item.badge}</Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground block">{item.tooltip}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* AI Pulse Status Indicator */}
      <div className="p-3 shrink-0 border-t border-border/40">
        <div
          className={cn(
            "flex items-center gap-3 p-2.5 rounded-lg border border-purple-500/10 bg-purple-500/[0.02] text-xs transition-all",
            isCollapsed ? "justify-center border-0 bg-transparent p-1" : "hover:border-purple-500/20"
          )}
        >
          <div className="relative shrink-0 flex items-center justify-center w-2.5 h-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75 animate-ping"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-600"></span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="font-semibold text-purple-600 dark:text-purple-400">AI Intelligence</span>
              <span className="text-[10px] text-muted-foreground">Analysing conversations</span>
            </div>
          )}
        </div>
      </div>

      {/* User Footer with Dropdown */}
      <div className="relative shrink-0 border-t border-border/40" ref={userMenuRef}>
        {/* Dropdown Menu (opens upward) */}
        {isUserMenuOpen && (
          <div className={cn(
            "absolute bottom-full left-2 right-2 mb-1 rounded-xl border border-border bg-popover shadow-lg z-50 overflow-hidden animate-in slide-in-from-bottom-2 fade-in-0 duration-200",
            isCollapsed && "left-0 right-auto w-48"
          )}>
            <div className="p-1.5">
              <button
                onClick={() => {
                  setIsUserMenuOpen(false)
                  router.push("/settings")
                }}
                className="flex items-center gap-2.5 w-full p-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <Settings2 className="w-4 h-4" />
                <span>Settings</span>
              </button>
              <div className="h-px bg-border/40 my-1" />
              <button
                onClick={() => {
                  setIsUserMenuOpen(false)
                  logout()
                }}
                className="flex items-center gap-2.5 w-full p-2.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className={cn(
            "h-16 flex items-center px-4 w-full justify-between cursor-pointer hover:bg-muted/30 transition-colors",
            isCollapsed && "justify-center px-0"
          )}
          aria-label="User menu"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-8 h-8 rounded-full border border-border shrink-0 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 font-bold font-display text-xs text-foreground/80">
                {userInitials}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden text-left">
                <span className="text-xs font-semibold text-foreground/90 truncate">{userName}</span>
                <span className="text-[10px] text-muted-foreground truncate">{userEmail}</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <ChevronUp className={cn(
              "w-3.5 h-3.5 text-muted-foreground/60 transition-transform duration-200 shrink-0",
              !isUserMenuOpen && "rotate-180"
            )} />
          )}
        </button>
      </div>
    </aside>
  )
}
