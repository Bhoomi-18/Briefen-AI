"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  Video,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  Play,
  Calendar,
  AlertCircle,
  FileText,
  User,
  ArrowRight,
  ArrowUpRight,
  UploadCloud,
  File,
  Loader2,
  CheckSquare,
  Square,
  HelpCircle,
  LayoutGrid,
  Scale,
  GitCommit,
  Share2
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/providers/toast-provider"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { SkeletonCard, SkeletonTable } from "@/components/ui/skeleton"
import {
  useAuth,
  useMeetings,
  useTasks,
  useAnalytics,
  useNotifications
} from "@/lib/hooks"

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
} as const

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
} as const

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { meetings, uploadMeeting, isUploading } = useMeetings()
  const { tasks, updateTask } = useTasks()
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics()
  const { notifications, markRead } = useNotifications()

  const [dragActive, setDragActive] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  
  // Local state to track if onboarding chat tutorial was clicked
  const [chatTried, setChatTried] = React.useState(false)

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setChatTried(localStorage.getItem("briefen_chat_tried") === "true")
    }
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processUpload(e.target.files[0])
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const processUpload = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("title", file.name.split(".")[0])

    toast({
      title: "Uploading sync recording",
      description: `Uploading ${file.name}...`,
      variant: "info",
    })

    try {
      await uploadMeeting(formData)
      toast({
        title: "Successfully queued",
        description: `Successfully loaded ${file.name} for speech-to-text AI transcription.`,
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message || "Failed to process audio recording.",
        variant: "error",
      })
    }
  }

  const toggleTaskStatus = async (task: any) => {
    const newStatus = task.status === "completed" ? "todo" : "completed"
    try {
      await updateTask({ id: task.id, data: { status: newStatus } })
      toast({
        title: "Task status updated",
        description: `Marked "${task.title}" as ${newStatus}.`,
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Failed to update task",
        description: err.message,
        variant: "error",
      })
    }
  }

  // Onboarding progress calculations
  const hasUploaded = meetings.length > 0
  const hasCompleted = meetings.some((m: any) => m.status === "COMPLETED")
  const hasChatted = chatTried

  const onboardingSteps = [
    { id: 1, label: "Add conversation knowledge to your platform memory", completed: hasUploaded, desc: "Drag and drop or select an audio/video file to process with local Faster-Whisper." },
    { id: 2, label: "Explore parsed AI decision ledgers & project briefs", completed: hasCompleted, desc: "Inspect automatically extracted summaries, tasks, and architectural decisions." },
    { id: 3, label: "Ask Briefen AI across meetings and context timelines", completed: hasChatted, desc: "Try querying project timelines, knowledge graphs, or decision logs in the AI Context Engine." },
  ]
  const completedStepsCount = onboardingSteps.filter(s => s.completed).map(s => s.id).length
  const onboardingPercent = Math.round((completedStepsCount / onboardingSteps.length) * 100)

  // Derive stats from real API data
  const completedMeetings = meetings.filter((m: any) => m.status === "COMPLETED").length
  const totalDecisions = meetings.reduce((acc: number, m: any) => acc + (m.decisions?.length || 0), 0)
  const tasksCompletionRate = tasks.length > 0
    ? Math.round((tasks.filter((t: any) => t.status === "completed").length / tasks.length) * 100)
    : 0

  const stats = [
    {
      title: "Knowledge Base Size",
      val: `${completedMeetings} ${completedMeetings === 1 ? "Meeting" : "Meetings"}`,
      change: completedMeetings > 0 ? `${completedMeetings} processed transcripts` : "Upload meetings to grow",
      icon: Share2,
      color: "text-blue-500 bg-blue-500/10"
    },
    {
      title: "Tasks Generated",
      val: `${tasks.length} Tasks`,
      change: tasks.length > 0 ? `${tasks.filter((t: any) => t.status === "completed").length} completed` : "No tasks yet",
      icon: GitCommit,
      color: "text-purple-500 bg-purple-500/10"
    },
    {
      title: "Decisions Extracted",
      val: `${totalDecisions} ${totalDecisions === 1 ? "Decision" : "Decisions"}`,
      change: totalDecisions > 0 ? "Extracted from transcripts" : "Upload meetings to extract",
      icon: Scale,
      color: "text-emerald-500 bg-emerald-500/10"
    },
    {
      title: "Task Completion Rate",
      val: tasks.length > 0 ? `${tasksCompletionRate}%` : "—",
      change: tasks.length > 0 ? "Action item compliance index" : "Complete tasks to track",
      icon: TrendingUp,
      color: "text-amber-500 bg-amber-500/10"
    },
  ]

  // Filter lists
  const recentMeetings = meetings.slice(0, 4)
  const activeTasks = tasks.filter((t: any) => t.status !== "completed").slice(0, 3)

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonTable rows={4} />
          </div>
          <div className="space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6 select-none">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground/90">
            {user?.profile?.full_name ? `Welcome back, ${user.profile.full_name.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time meeting intelligence overview, integrations, and action item queues.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/meetings">
            <Button variant="outline" size="sm">
              <span>View All Meetings</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Onboarding Checklist for newly registered empty users */}
      {!hasUploaded && !(user?.email?.startsWith("demo")) && (
        <Card variant="ai" className="border-purple-500/25 bg-gradient-to-tr from-purple-500/[0.02] to-indigo-500/[0.02]">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start gap-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500 animate-ai-pulse" />
                  <span>Welcome to Briefen! Let's get you set up</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Complete the quick checklists below to explore meeting AI capabilities.
                </CardDescription>
              </div>
              <Badge variant="ai" className="px-2.5 py-0.5 text-xs shrink-0">
                {onboardingPercent}% Done
              </Badge>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 w-full bg-border/40 rounded-full mt-4 overflow-hidden relative">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${onboardingPercent}%` }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {onboardingSteps.map((step) => (
                <div
                  key={step.id}
                  className={`p-4 rounded-xl border flex flex-col gap-2.5 transition-colors relative ${
                    step.completed
                      ? "border-emerald-500/20 bg-emerald-500/[0.01]"
                      : "border-border/40 bg-card/40 hover:border-foreground/10"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded-full shrink-0 ${step.completed ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground bg-muted/60"}`}>
                      {step.completed ? <CheckCircle2 className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                    </div>
                    <span className={`text-xs font-bold ${step.completed ? "line-through text-muted-foreground/80" : "text-foreground/90"}`}>
                      Step {step.id}: {step.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed leading-normal flex-1">
                    {step.desc}
                  </p>
                  {step.id === 1 && !step.completed && (
                    <Button variant="ai" size="sm" className="h-8 text-[10px] mt-1" onClick={triggerFileSelect} isLoading={isUploading}>
                      <span>Upload Recording</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards Row */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat, idx) => (
          <motion.div key={idx} variants={staggerItem}>
            <Card hoverable>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  {stat.title}
                </CardDescription>
                <div className={`p-2 rounded-lg shrink-0 ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-display tracking-tight text-foreground/90 mt-1">
                  {stat.val}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1.5 font-medium leading-tight">
                  {stat.change}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns (Col-Span-2): Upload, Recent Meetings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Upload Panel */}
          <Card
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            role="region"
            aria-label="Upload meeting recording"
            className={`border-dashed border-2 transition-colors relative flex items-center justify-center p-8 text-center min-h-[160px] select-none ${
              dragActive ? "border-primary bg-primary/[0.02]" : "border-border/60 bg-card/40"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept="audio/*,video/*"
            />
            <div className="space-y-3">
              <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <UploadCloud className="w-5 h-5 animate-pulse" />
                )}
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground/90 block">
                  {isUploading ? "Uploading recording data..." : "Drag and drop meeting recording here"}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-1">
                  Supports MP4, MOV, MP3, WAV up to 50MB (transcribed via Whisper model)
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={triggerFileSelect} isLoading={isUploading}>
                Select File
              </Button>
            </div>
          </Card>

          {/* Recent Transcriptions Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Transcriptions</CardTitle>
                <CardDescription>Click a meeting row to open insights.</CardDescription>
              </div>
              <Badge variant="ai">AI Active</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Meeting Title</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Keywords</TableHead>
                    <TableHead className="text-right pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMeetings.length > 0 ? (
                    recentMeetings.map((meet: any) => {
                      const durationMins = Math.round(meet.duration / 60)
                      return (
                        <TableRow
                          key={meet.id}
                          className="cursor-pointer"
                          tabIndex={0}
                          onClick={() => {
                            router.push(`/meetings/${meet.id}`)
                          }}
                        >
                          <TableCell className="pl-6">
                            <div className="flex items-center gap-2">
                              <Play className="w-3 h-3 text-primary shrink-0" />
                              <div>
                                <div className="font-semibold text-sm">{meet.title}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  {new Date(meet.created_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "2-digit",
                                    year: "numeric"
                                  })}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{durationMins > 0 ? `${durationMins}m` : "< 1m"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 flex-wrap max-w-[200px]">
                              {meet.keywords.slice(0, 3).map((kw: string, i: number) => (
                                <Badge key={i} variant="outline" className="scale-90 text-[8px] px-1 py-0">
                                  {kw}
                                </Badge>
                              ))}
                              {meet.keywords.length > 3 && (
                                <span className="text-[8px] text-muted-foreground font-medium">+{meet.keywords.length - 3}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            {meet.status === "COMPLETED" && (
                              <Badge variant="success">Ready</Badge>
                            )}
                            {meet.status === "TRANSCRIBING" && (
                              <Badge variant="warning" className="animate-pulse">Transcribing ({meet.progress}%)</Badge>
                            )}
                            {meet.status === "SUMMARIZING" && (
                              <Badge variant="warning" className="animate-pulse">Summarizing ({meet.progress}%)</Badge>
                            )}
                            {meet.status === "PENDING" && (
                              <Badge variant="secondary" className="animate-pulse">Pending</Badge>
                            )}
                            {meet.status === "FAILED" && (
                              <Badge variant="destructive">Failed</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-xs text-muted-foreground">
                        No meeting recordings found. Upload your first file above to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Columns: Upcoming, Tasks, AI tips */}
        <div className="space-y-6">
          {/* AI Platform Insights Alert */}
          <Alert variant="ai" className="select-none">
            <Sparkles className="w-4 h-4 animate-ai-pulse" />
            <AlertTitle>Weekly Meeting Recommendations</AlertTitle>
            <AlertDescription>
              {meetings.length > 0 ? (
                "Your weekly standups sync runs on average 55 minutes with 8 attendees. We recommend shortening it to 30 minutes to reclaim approximately 10 hours this month."
              ) : (
                "Upload a meeting recording to let the AI analyze speech metrics, talking ratios, and highlight optimizations."
              )}
            </AlertDescription>
          </Alert>

          {/* Workspace Task Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">My Active Tasks</CardTitle>
              <CardDescription>Assigned from meeting action items.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 select-none">
              {activeTasks.length > 0 ? (
                activeTasks.map((task: any) => (
                  <div key={task.id} className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTaskStatus(task)}
                      role="checkbox"
                      aria-checked={task.status === "completed"}
                      aria-label={`Mark "${task.title}" as complete`}
                      className="w-4 h-4 rounded border shrink-0 mt-0.5 flex items-center justify-center transition-colors cursor-pointer border-border/80 bg-background hover:border-primary/50"
                    >
                      {task.status === "completed" && <span className="text-[9px] font-bold text-primary">✓</span>}
                    </button>
                    <div className="flex-1 space-y-0.5">
                      <span className="text-xs block leading-relaxed text-foreground/80">
                        {task.title}
                      </span>
                      {task.due_date && (
                        <span className="text-[9px] text-muted-foreground">
                          Due: {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-16 flex items-center justify-center text-xs text-muted-foreground">
                  No active tasks. Complete or add tasks in the Tasks tab.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
