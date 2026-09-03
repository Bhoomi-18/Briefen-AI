"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Scale,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  History,
  Users,
  Calendar,
  FileText,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  Plus
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/providers/toast-provider"
import { useMeetings } from "@/lib/hooks"
import { SkeletonCard } from "@/components/ui/skeleton"
import Link from "next/link"

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }
} as const

export default function DecisionsPage() {
  const { toast } = useToast()
  const { meetings, isLoading } = useMeetings()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [manualDecisions, setManualDecisions] = React.useState<any[]>([])

  const handleCreateDecision = () => {
    toast({
      title: "Integrate Conversation Node",
      description: "Briefen AI automatically monitors discussions and adds nodes here. Direct manual editing is a premium feature.",
      variant: "info"
    })
  }

  // Extract decisions from meetings
  const apiDecisions = (meetings || []).flatMap((m: any) => {
    return (m.decisions || []).map((dec: any) => ({
      id: dec.id,
      decision: dec.content,
      reason: "Automatically extracted from meeting discussion transcript.",
      sourceMeeting: m.title,
      sourceId: m.id,
      date: new Date(dec.created_at || m.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric"
      }),
      status: "Active",
      people: m.keywords?.slice(0, 2) || ["Team"],
      tasks: m.action_items?.slice(0, 3).map((a: any) => a.content) || [],
      history: []
    }))
  })

  const allDecisions = [...manualDecisions, ...apiDecisions]

  const filteredDecisions = allDecisions.filter(d => {
    const matchesSearch = d.decision.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.sourceMeeting.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
        <div className="border-b border-border/40 pb-6">
          <div className="h-7 w-48 rounded bg-muted/60 shimmer relative overflow-hidden" />
          <div className="h-3 w-72 rounded bg-muted/40 shimmer relative overflow-hidden mt-2" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  const isEmpty = allDecisions.length === 0

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 max-w-7xl mx-auto overflow-y-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-medium text-xs uppercase tracking-wider font-mono">
            <Scale className="w-4 h-4" />
            <span>AI Project Intelligence</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/75">
            Decision Ledger
          </h1>
          <p className="text-xs text-muted-foreground max-w-xl">
            Track, audit, and query key project architectural decisions extracted from across your entire conversation timeline.
          </p>
        </div>
        <Button onClick={handleCreateDecision} variant="ai" className="h-10 text-xs shrink-0 gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Record Manual Decision</span>
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search decisions, meetings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-card border border-border/50 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {isEmpty ? (
        <Card className="border-dashed border-2 border-border/60 bg-card/40">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground/90 mb-1">No decisions recorded</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Upload meeting recordings to your Knowledge Library. Briefen AI automatically extracts key decisions and lists them here in the Decision Ledger.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Grid of Decisions */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4"
        >
          {filteredDecisions.map((d) => (
            <motion.div key={d.id} variants={itemVariants}>
              <Card className="relative overflow-hidden group hover:border-border/80 transition-colors">
                <div className="absolute top-0 bottom-0 left-0 w-[4px] bg-emerald-500" />
                
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 text-[9px] font-semibold px-2 py-0.5">
                          Active
                        </Badge>
                        
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{d.date}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-bold text-foreground leading-snug">
                          {d.decision}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                          {d.reason}
                        </p>
                      </div>

                      {/* Related Tasks checklist items */}
                      {d.tasks.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Related Action Items:</span>
                          <div className="flex flex-wrap gap-3">
                            {d.tasks.map((task: string, i: number) => (
                              <div key={i} className="flex items-center gap-1.5 text-[10px] text-foreground/80">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/80" />
                                <span>{task}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata Sidebar Card */}
                    <div className="md:w-56 shrink-0 space-y-2.5 border-t md:border-t-0 md:border-l border-border/40 pt-4 md:pt-0 md:pl-6 text-[10px]">
                      <div className="space-y-1">
                        <span className="text-muted-foreground block">Source Discussion:</span>
                        <Link href={`/meetings/${d.sourceId}`} className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors font-medium">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{d.sourceMeeting}</span>
                        </Link>
                      </div>

                      <div className="space-y-1">
                        <span className="text-muted-foreground block">Key Keywords:</span>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                          <span className="text-foreground">{d.people.join(", ")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {filteredDecisions.length === 0 && (
            <Card className="p-8 text-center border-dashed">
              <HelpCircle className="w-8 h-8 mx-auto text-muted-foreground/80 mb-2" />
              <p className="text-xs text-muted-foreground">No decisions match the current selection.</p>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  )
}
