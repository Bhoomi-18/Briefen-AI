"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  GitCommit,
  Calendar,
  CheckCircle2,
  Scale,
  Video,
  HelpCircle,
  Clock,
  Briefcase
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useMeetings } from "@/lib/hooks"
import { SkeletonCard } from "@/components/ui/skeleton"

export default function TimelinePage() {
  const { meetings, isLoading } = useMeetings()

  // Filter completed meetings and sort chronologically
  const activeMilestones = (meetings || [])
    .filter((m: any) => m.status === "COMPLETED")
    .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
        <div className="border-b border-border/40 pb-6">
          <div className="h-7 w-48 rounded bg-muted/60 shimmer relative overflow-hidden" />
          <div className="h-3 w-72 rounded bg-muted/40 shimmer relative overflow-hidden mt-2" />
        </div>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  const isEmpty = activeMilestones.length === 0

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 max-w-7xl mx-auto overflow-y-auto">
      {/* Header section */}
      <div className="space-y-1.5 border-b border-border/40 pb-6 select-none">
        <div className="flex items-center gap-2 text-primary font-medium text-xs uppercase tracking-wider font-mono">
          <GitCommit className="w-4 h-4" />
          <span>Chronological Knowledge Mapping</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/75">
          Project Timeline
        </h1>
        <p className="text-xs text-muted-foreground max-w-xl">
          Observe how conversations automatically map topics, discussions, and decisions into a structured project development history.
        </p>
      </div>

      {isEmpty ? (
        <Card className="border-dashed border-2 border-border/60 bg-card/40">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <GitCommit className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground/90 mb-1">No project timeline yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Upload meeting recordings to your Knowledge Library. Briefen AI will parse transcripts and align them dynamically into this sprint roadmap timeline.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Main Timeline Board */
        <div className="relative border-l border-border/60 pl-8 ml-4 md:ml-6 py-4 space-y-12">
          {activeMilestones.map((m: any, idx: number) => {
            const meetingDate = new Date(m.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric"
            })

            const durationMins = Math.round(m.duration / 60)

            return (
              <div key={m.id} className="relative">
                {/* Timeline dot icon node */}
                <div className="absolute -left-[48px] top-1.5 p-2 rounded-xl border border-border shadow-sm bg-card text-primary ring-4 ring-primary/5">
                  <Video className="w-4 h-4" />
                </div>

                {/* Milestone details wrapper */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-sm font-bold text-foreground leading-none">
                        Milestone {idx + 1}: {m.title}
                      </h3>
                      <Badge variant="secondary" className="text-[8px] font-mono uppercase tracking-widest px-2 py-0.5">
                        {meetingDate}
                      </Badge>
                      <Badge variant="outline" className="text-[8px] font-mono px-2 py-0.5 text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1 inline" />
                        {durationMins > 0 ? `${durationMins} min` : "< 1 min"}
                      </Badge>
                    </div>
                    {m.summary && (
                      <p className="text-[11px] text-muted-foreground leading-relaxed max-w-2xl pt-1">
                        {m.summary}
                      </p>
                    )}
                  </div>

                  {/* Sub-events inside this phase */}
                  {(m.decisions?.length > 0 || m.action_items?.length > 0) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Decisions list card */}
                      {m.decisions?.map((dec: any, decIdx: number) => (
                        <Card key={`dec-${dec.id || decIdx}`} className="bg-card/40 border border-border/30 hover:border-border/60 transition-colors">
                          <CardContent className="p-4 space-y-2 text-[10px]">
                            <div className="flex items-center justify-between gap-2 border-b border-border/20 pb-2">
                              <span className="font-mono text-muted-foreground/60">AI Extracted</span>
                              <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 text-[8px] uppercase font-mono">
                                <Scale className="w-3 h-3 mr-1 inline" />
                                Decision
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-foreground">Architectural Checkpoint</h4>
                              <p className="text-muted-foreground leading-relaxed text-[9px]">{dec.content}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {/* Action Items list card */}
                      {m.action_items?.map((act: any, actIdx: number) => (
                        <Card key={`act-${act.id || actIdx}`} className="bg-card/40 border border-border/30 hover:border-border/60 transition-colors">
                          <CardContent className="p-4 space-y-2 text-[10px]">
                            <div className="flex items-center justify-between gap-2 border-b border-border/20 pb-2">
                              <span className="font-mono text-muted-foreground/60">
                                {act.assignee ? `Assignee: ${act.assignee}` : "Unassigned"}
                              </span>
                              <Badge className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-1.5 py-0.5 text-[8px] uppercase font-mono">
                                <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                                Task
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-foreground">Action Item</h4>
                              <p className="text-muted-foreground leading-relaxed text-[9px]">{act.content}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border/30 border-dashed bg-card/20 p-4 text-center max-w-2xl">
                      <span className="text-[10px] text-muted-foreground/80 font-mono">No action items or decisions were extracted from this meeting.</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
