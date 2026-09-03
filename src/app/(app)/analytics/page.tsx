"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  Sparkles,
  TrendingUp,
  Clock,
  DollarSign,
  TrendingDown,
  Calendar,
  Layers,
  Award,
  Filter,
  BarChart,
  User,
  ArrowUpRight,
  HelpCircle,
  Network,
  Share2,
  FileText,
  CheckSquare
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SkeletonCard } from "@/components/ui/skeleton"
import { useToast } from "@/components/providers/toast-provider"
import { useAnalytics, useMeetings } from "@/lib/hooks"

export default function AnalyticsPage() {
  const { toast } = useToast()
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics()
  const { meetings } = useMeetings()

  // Derive data from real API
  const dashStats = analytics?.dashboard_stats || {}
  const meetingsProcessed = dashStats.meetings_processed || 0
  const hoursAnalysed = dashStats.hours_analysed || 0
  const tasksGenerated = dashStats.tasks_generated || 0
  const tasksCompleted = dashStats.tasks_completed || 0
  const weeklyProd = dashStats.weekly_productivity_index || 0

  // Derive top keywords from meetings
  const keywordCounts: Record<string, number> = {}
  ;(meetings || []).forEach((m: any) => {
    (m.keywords || []).forEach((kw: string) => {
      keywordCounts[kw] = (keywordCounts[kw] || 0) + 1
    })
  })
  const topTopics = Object.entries(keywordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  // Derive meetings per weekday
  const dayCounts: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 }
  ;(meetings || []).forEach((m: any) => {
    const d = new Date(m.created_at)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const dayName = dayNames[d.getDay()]
    if (dayName in dayCounts) {
      dayCounts[dayName]++
    }
  })
  const maxDayCount = Math.max(...Object.values(dayCounts), 1)
  const dayFrequencies = Object.entries(dayCounts).map(([day, count]) => ({
    day,
    count,
    percent: `${Math.round((count / maxDayCount) * 100)}%`,
  }))

  const summaryCards = [
    {
      title: "Meetings Processed",
      val: meetingsProcessed.toString(),
      change: meetingsProcessed > 0 ? `${hoursAnalysed}h analysed` : "No meetings yet",
      icon: Clock,
      desc: meetingsProcessed > 0 ? "Total uploaded transcripts" : "Upload recordings to begin",
    },
    {
      title: "Tasks Generated",
      val: tasksGenerated.toString(),
      change: tasksGenerated > 0 ? `${tasksCompleted} completed` : "No tasks yet",
      icon: CheckSquare,
      desc: tasksGenerated > 0 ? "AI-extracted action items" : "Tasks are generated from meetings",
    },
    {
      title: "Task Completion Rate",
      val: tasksGenerated > 0 ? `${weeklyProd}%` : "—",
      change: tasksGenerated > 0 ? "Productivity index" : "No data yet",
      icon: Award,
      desc: tasksGenerated > 0 ? "Action item compliance" : "Complete tasks to track",
    },
    {
      title: "Knowledge Hours",
      val: hoursAnalysed > 0 ? `${hoursAnalysed}h` : "—",
      change: hoursAnalysed > 0 ? "Total analysed audio" : "No data yet",
      icon: TrendingUp,
      desc: hoursAnalysed > 0 ? "Meeting intelligence captured" : "Upload meetings to start",
    },
  ]

  const isEmpty = meetingsProcessed === 0 && meetings.length === 0

  if (analyticsLoading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-border/40 pb-6">
          <div className="h-7 w-48 rounded bg-muted/60 shimmer relative overflow-hidden" />
          <div className="h-3 w-72 rounded bg-muted/40 shimmer relative overflow-hidden mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6 select-none">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground/90 flex items-center gap-1.5">
            <Sparkles className="w-5.5 h-5.5 text-purple-500 animate-ai-pulse" />
            <span>Project Intelligence</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {isEmpty
              ? "Upload meeting recordings to generate intelligence metrics and insights."
              : "Observe the growth of your company knowledge memory and automated productivity assessments."
            }
          </p>
        </div>
      </div>

      {/* KPI Cards Row — staggered entrance */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none"
      >
        {summaryCards.map((card, idx) => (
          <motion.div key={idx} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}>
          <Card key={idx} hoverable>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                {card.title}
              </CardDescription>
              <div className="p-2 rounded-lg bg-muted text-foreground/80 shrink-0">
                <card.icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display tracking-tight text-foreground/90 mt-1">
                {card.val}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1 font-medium">
                <span className="text-emerald-500">{card.change}</span>
                <span>• {card.desc}</span>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      {isEmpty && (
        <Card className="border-dashed border-2 border-border/60 bg-card/40">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <BarChart className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground/90 mb-1">No intelligence data yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Upload meeting recordings to your Knowledge Library. Briefen AI will automatically generate analytics, topic extraction, and productivity metrics.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Charts Grid — only shown when data exists */}
      {!isEmpty && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Meeting volume SVG bar chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Meeting Density & Frequency</CardTitle>
                  <CardDescription>Distribution of meetings across weekdays.</CardDescription>
                </div>
                <BarChart className="w-5 h-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-64 flex flex-col justify-end">
                <div className="flex items-end justify-between h-48 px-4 border-b border-border/40 select-none" role="img" aria-label="Meeting frequency bar chart showing weekly distribution">
                  {dayFrequencies.map((day, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 w-12 group">
                      <span className="text-[10px] font-semibold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.count} syncs
                      </span>
                      <div
                        style={{ height: day.count > 0 ? day.percent : "4px" }}
                        className="w-8 rounded-t-lg bg-primary/20 group-hover:bg-primary transition-all duration-300 relative min-h-[4px]"
                      >
                        <div className="absolute inset-0 bg-linear-to-t from-primary/10 to-transparent" />
                      </div>
                      <span className="text-xs font-semibold text-foreground/80 mt-1">{day.day}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-4 px-2 select-none">
                  <span>Total: {meetings.length} meetings</span>
                  <span>Most active: {dayFrequencies.sort((a, b) => b.count - a.count)[0]?.day || "N/A"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Top trending keywords & topics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trending Conversation Topics</CardTitle>
                <CardDescription>AI-extracted keywords from your meetings.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {topTopics.length > 0 ? (
                    topTopics.map((topic, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-foreground block">
                            {topic.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            Found in {topic.count} {topic.count === 1 ? "transcript" : "transcripts"}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-[9px]">
                          {topic.count}x
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      No topics extracted yet. Upload meetings to see trends.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Knowledge Graph Module */}
          <Card className="w-full select-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Network className="w-4 h-4 text-purple-500 animate-pulse" />
                  <span>AI Knowledge Graph</span>
                </CardTitle>
                <CardDescription>
                  A visual projection of relationships mapping meetings, technologies, tasks, people, and architectural decisions.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-purple-500/20 text-purple-500 font-mono text-[9px] uppercase tracking-widest px-2 py-0.5">
                {meetingsProcessed} nodes indexed
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-[320px] rounded-xl bg-card border border-border/30 overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-radial-to-c from-primary/[0.02] to-transparent pointer-events-none" />
                
                <svg className="absolute inset-0 w-full h-full text-border/20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="50%" y1="50%" x2="30%" y2="30%" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="50%" y1="50%" x2="70%" y2="30%" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="50%" y1="50%" x2="30%" y2="70%" stroke="currentColor" strokeWidth="1" />
                  <line x1="50%" y1="50%" x2="70%" y2="70%" stroke="currentColor" strokeWidth="1" />
                </svg>

                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute z-10 p-3.5 rounded-2xl bg-primary/10 border border-primary/30 text-primary flex flex-col items-center justify-center text-center shadow-lg shadow-primary/5"
                >
                  <Share2 className="w-5 h-5 mb-1.5" />
                  <span className="text-[10px] font-bold tracking-wider uppercase font-mono">Briefen Memory</span>
                </motion.div>

                {/* Dynamic nodes from top topics */}
                {topTopics.slice(0, 4).map((topic, idx) => {
                  const positions = [
                    { top: "20%", left: "20%" },
                    { top: "20%", right: "15%" },
                    { bottom: "20%", left: "20%" },
                    { bottom: "20%", right: "18%" },
                  ]
                  const colors = ["blue", "amber", "purple", "emerald"]
                  const pos = positions[idx]
                  const color = colors[idx]
                  return (
                    <motion.div
                      key={topic.name}
                      animate={{ y: [0, idx % 2 === 0 ? -6 : 6, 0] }}
                      transition={{ repeat: Infinity, duration: 4 + idx * 0.5, ease: "easeInOut", delay: idx * 0.3 }}
                      className={`absolute p-2 rounded-xl bg-card border border-border/60 flex items-center gap-1.5 shadow-sm text-[9px] hover:border-${color}-500/50 cursor-pointer`}
                      style={pos}
                    >
                      <div className={`w-2 h-2 rounded-full bg-${color}-500 animate-pulse`} />
                      <span className="font-semibold text-foreground/80">{topic.name}</span>
                    </motion.div>
                  )
                })}

                <div className="absolute bottom-3 right-3 text-[8px] font-mono text-muted-foreground uppercase tracking-widest bg-muted/65 px-2 py-0.5 rounded border">
                  Hover nodes to inspect relations
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Usage Statistics</CardTitle>
                <CardDescription>Your workspace resource consumption.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 select-none">
                  <div className="p-4 rounded-xl border border-border/40 bg-muted/20 text-center">
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">
                      Meetings
                    </span>
                    <span className="text-2xl font-bold font-display text-foreground/90 block mt-1">
                      {meetingsProcessed}
                    </span>
                    <span className="text-[9px] text-muted-foreground mt-0.5 block">
                      Total processed
                    </span>
                  </div>
                  <div className="p-4 rounded-xl border border-border/40 bg-muted/20 text-center">
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">
                      Task completion
                    </span>
                    <span className="text-2xl font-bold font-display text-emerald-500 block mt-1">
                      {tasksGenerated > 0 ? `${weeklyProd}%` : "—"}
                    </span>
                    <span className="text-[9px] text-muted-foreground mt-0.5 block">
                      {tasksCompleted} of {tasksGenerated} completed
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Weekly Productivity</CardTitle>
                <CardDescription>Action item tracking and compliance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 pt-2 select-none">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-muted-foreground">Tasks Completed</span>
                      <span className="text-foreground/90 font-bold">{tasksCompleted}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: tasksGenerated > 0 ? `${weeklyProd}%` : "0%" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-full bg-emerald-500"
                        role="progressbar"
                        aria-valuenow={weeklyProd}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Task completion: ${weeklyProd}%`}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-muted-foreground">Hours Analysed</span>
                      <span className="text-foreground/90 font-bold">{hoursAnalysed}h</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: hoursAnalysed > 0 ? `${Math.min((hoursAnalysed / 100) * 100, 100)}%` : "0%" }}
                        transition={{ duration: 0.8, delay: 0.35 }}
                        className="h-full bg-indigo-500"
                        role="progressbar"
                        aria-valuenow={hoursAnalysed}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Hours analysed: ${hoursAnalysed}h`}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pt-2">
                  {tasksGenerated > 0
                    ? `Your workspace has processed ${meetingsProcessed} meetings and generated ${tasksGenerated} action items with a ${weeklyProd}% completion rate.`
                    : "Upload meetings to generate productivity insights and weekly tracking reports."
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
