"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Video, FileText, CheckCircle2, User, Sparkles, X, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useSearch, useMeetings } from "@/lib/hooks"
import { useToast } from "@/components/providers/toast-provider"
import { Badge } from "@/components/ui/badge"

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [query, setQuery] = React.useState("")
  
  // Fetch matching semantic segments
  const { data: searchResults, isLoading } = useSearch(query)
  // Fetch general list of meetings for suggestions
  const { meetings } = useMeetings()

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  // Clear query on close
  React.useEffect(() => {
    if (!isOpen) {
      setQuery("")
    }
  }, [isOpen])

  const navigateTo = (url: string) => {
    router.push(url)
    onClose()
  }

  const suggestions = meetings.slice(0, 3)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 select-none">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="relative w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[380px]"
          >
            {/* Input Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/40 shrink-0">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Type semantic keywords to scan meeting recordings..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent border-0 outline-hidden text-xs text-foreground placeholder-muted-foreground focus:ring-0 focus:outline-hidden"
                autoFocus
              />
              <button onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto p-2">
              {isLoading && (
                <div className="flex items-center justify-center py-12 gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Scanning vector database indexes...</span>
                </div>
              )}

              {!isLoading && query && searchResults && (
                <div className="space-y-1">
                  <span className="px-3 py-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
                    Semantic Search Matches
                  </span>
                  {searchResults.length > 0 ? (
                    searchResults.map((res: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => navigateTo(`/meetings/${res.meeting_id}`)}
                        className="w-full text-left p-3 hover:bg-muted/50 rounded-xl transition-colors flex items-start gap-3 border border-transparent hover:border-border/40 group"
                      >
                        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-ai-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-foreground/90 group-hover:text-primary transition-colors truncate">
                              {res.title}
                            </span>
                            <Badge variant="outline" className="text-[8px] scale-90 px-1 py-0 shrink-0">
                              Match: {Math.round(res.score * 100)}%
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed pt-1 line-clamp-2">
                            "{res.content}"
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-8">
                      No matching speech segments found.
                    </div>
                  )}
                </div>
              )}

              {!isLoading && !query && (
                <div className="space-y-3 p-1">
                  {/* Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="space-y-1">
                      <span className="px-2.5 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
                        Recent Meetings
                      </span>
                      {suggestions.map((meet: any) => (
                        <button
                          key={meet.id}
                          onClick={() => navigateTo(`/meetings/${meet.id}`)}
                          className="w-full text-left px-3 py-2 hover:bg-muted/50 rounded-lg transition-colors flex items-center justify-between text-xs text-foreground/80 hover:text-foreground"
                        >
                          <div className="flex items-center gap-2">
                            <Video className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-medium truncate max-w-xs">{meet.title}</span>
                          </div>
                          <span className="text-[9px] font-mono text-muted-foreground">
                            {new Date(meet.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quick Section Shortcuts */}
                  <div className="space-y-1">
                    <span className="px-2.5 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
                      Quick Shortcuts
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 p-1">
                      <button
                        onClick={() => navigateTo("/tasks")}
                        className="text-left px-3 py-2 border border-border/30 hover:border-border hover:bg-muted/40 rounded-lg text-xs text-foreground/80 flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                        <span>Kanban Tasks</span>
                      </button>
                      <button
                        onClick={() => navigateTo("/settings")}
                        className="text-left px-3 py-2 border border-border/30 hover:border-border hover:bg-muted/40 rounded-lg text-xs text-foreground/80 flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <User className="w-3.5 h-3.5 text-purple-500" />
                        <span>Settings</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
