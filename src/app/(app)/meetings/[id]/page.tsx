"use client"

import * as React from "react"
import {
  Sparkles,
  Video,
  Play,
  Pause,
  Maximize2,
  Volume2,
  Calendar,
  Clock,
  User,
  Users,
  Search,
  CheckCircle,
  FileText,
  Send,
  MessageSquare,
  Link as LinkIcon,
  TrendingUp,
  Share2,
  Download,
  File,
  AlertCircle,
  Activity,
  Plus,
  Loader2,
  HelpCircle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/providers/toast-provider"
import { motion, AnimatePresence } from "framer-motion"
import { useMeeting } from "@/lib/hooks"
import { SkeletonCard, SkeletonTable } from "@/components/ui/skeleton"

interface PageProps {
  params: Promise<{ id: string }>
}

function parseTranscript(transcript: string | null): { speaker: string; time: string; text: string }[] {
  if (!transcript) return []
  
  const lines = transcript.split("\n")
  return lines.map((line, idx) => {
    const colonIndex = line.indexOf(":")
    if (colonIndex === -1) {
      return {
        speaker: "Speaker",
        time: `00:${String(idx * 15).padStart(2, "0")}`,
        text: line.trim()
      }
    }
    const speaker = line.substring(0, colonIndex).trim()
    const text = line.substring(colonIndex + 1).trim()
    
    // Distribute time index dynamically across lines
    const min = Math.floor((idx * 45) / 60)
    const sec = (idx * 45) % 60
    const timeStr = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    
    return {
      speaker,
      time: timeStr,
      text
    }
  })
}

export default function MeetingDetailsPage({ params }: PageProps) {
  const { id } = React.use(params)
  const { toast } = useToast()
  
  const { meeting, isLoading, error, chat, isChatting } = useMeeting(id)

  const [isPlaying, setIsPlaying] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"ai" | "transcript" | "decisions" | "attachments">("ai")
  const [chatInput, setChatInput] = React.useState("")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [messages, setMessages] = React.useState<{ sender: string; text: string; time: string; isAI: boolean }[]>([])

  // Set default message when meeting loads
  React.useEffect(() => {
    if (meeting) {
      setMessages([
        {
          sender: "AI Assistant",
          text: `Hello! I have analyzed the meeting "${meeting.title}". Ask me any questions regarding the topics covered, assignees, or deadlines.`,
          time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          isAI: true
        }
      ])
    }
  }, [meeting])

  // Parse speaker stats and transcript segments dynamically
  const parsedTranscript = React.useMemo(() => parseTranscript(meeting?.transcript), [meeting?.transcript])

  const speakers = React.useMemo(() => {
    const counts: Record<string, number> = {}
    parsedTranscript.forEach(line => {
      counts[line.speaker] = (counts[line.speaker] || 0) + 1
    })

    const totalLines = parsedTranscript.length || 1
    const colors = ["bg-indigo-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500"]
    const roles = ["Product Manager", "Lead Engineer", "Frontend Architect", "UX Designer"]

    return Object.keys(counts).map((name, idx) => {
      const count = counts[name]
      const percent = Math.round((count / totalLines) * 100)
      const color = colors[idx % colors.length]
      const role = roles[idx % roles.length]

      // Map time based on talk duration proportion
      const talkSecs = Math.round((meeting?.duration || 0) * (percent / 100))
      const min = Math.floor(talkSecs / 60)
      const sec = talkSecs % 60
      const timeStr = `${min}m ${sec}s`

      return {
        name,
        role,
        time: timeStr,
        percent,
        color
      }
    })
  }, [parsedTranscript, meeting?.duration])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMsg = chatInput.trim()
    setChatInput("")

    // Append User message
    setMessages((prev) => [
      ...prev,
      {
        sender: "You",
        text: userMsg,
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        isAI: false
      }
    ])

    // Set onboarding checklist item 3 as active
    if (typeof window !== "undefined") {
      localStorage.setItem("briefen_chat_tried", "true")
    }

    try {
      const reply = await chat(userMsg)
      setMessages((prev) => [
        ...prev,
        {
          sender: "AI Assistant",
          text: reply.response,
          time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          isAI: true
        }
      ])
    } catch (err: any) {
      toast({
        title: "Chat Assistant Failed",
        description: err.message || "Failed to connect to assistant.",
        variant: "error",
      })
    }
  }

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Shared Link",
        description: "Meeting share URL copied to clipboard.",
        variant: "success",
      })
    }
  }

  const handleDownload = () => {
    if (!meeting) return
    const blob = new Blob([meeting.transcript || ""], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${meeting.title.toLowerCase().replace(/\s+/g, "_")}_transcript.txt`
    a.click()
    toast({
      title: "Download Initiated",
      description: "Speech text file downloaded successfully.",
      variant: "success",
    })
  }

  // Filter local transcript rows by search query
  const filteredTranscript = parsedTranscript.filter((line) => {
    if (!searchTerm.trim()) return true
    return (
      line.speaker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      line.text.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 border-b border-border/40 pb-6">
          <div className="h-6 w-72 rounded bg-muted/60 shimmer relative overflow-hidden" />
          <div className="h-3.5 w-96 rounded bg-muted/40 shimmer relative overflow-hidden" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div>
            <SkeletonCard />
          </div>
        </div>
      </div>
    )
  }

  if (error || !meeting) {
    return (
      <Card className="border-destructive/30 bg-destructive/[0.01] p-6 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto animate-pulse" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">Failed to resolve meeting details</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {error?.message || "Verify record uuid bounds and connection state parameters."}
          </p>
        </div>
      </Card>
    )
  }

  const durationMins = Math.round(meeting.duration / 60)

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6 select-none">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-display tracking-tight text-foreground/90">
              {meeting.title}
            </h1>
            <Badge variant={meeting.status === "COMPLETED" ? "success" : "warning"}>
              {meeting.status === "COMPLETED" ? "Ready" : "Processing"}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-0.5">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date(meeting.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric"
                })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{durationMins > 0 ? `${durationMins} minutes` : "< 1 minute"} duration</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-1.5" />
            <span>Share</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={!meeting.transcript}>
            <Download className="w-4 h-4 mr-1.5" />
            <span>Download</span>
          </Button>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Summary & Transcripts Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Audio Player Card */}
          <Card className="bg-gradient-to-r from-card to-card/90 border-border/60">
            <CardContent className="p-4 flex items-center justify-between gap-4 select-none">
              <div className="flex items-center gap-3">
                <Button
                  variant="default"
                  size="icon"
                  className="rounded-full w-9 h-9 shrink-0"
                  onClick={() => setIsPlaying(!isPlaying)}
                  aria-label={isPlaying ? "Pause audio play" : "Start audio play"}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </Button>
                <div>
                  <span className="text-xs font-semibold text-foreground/90 block">Speech Audio Player</span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    {meeting.audio_path ? "Active session audio file" : "Whisper synthesis sample dataset"}
                  </span>
                </div>
              </div>

              {/* Mock waveform representation */}
              <div className="flex-1 max-w-[200px] h-6 flex items-center gap-0.5 px-4 overflow-hidden hidden sm:flex">
                {Array.from({ length: 24 }).map((_, i) => {
                  const h = 4 + (Math.sin(i * 0.5) + 1) * 6
                  return (
                    <div
                      key={i}
                      className={`w-[3px] rounded-full transition-all duration-300 ${
                        isPlaying ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                      style={{ height: `${isPlaying ? h + Math.random() * 4 : h}px` }}
                    />
                  )
                })}
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-semibold text-foreground/80 block">
                  {isPlaying ? "0:12" : "0:00"}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground block mt-0.5">
                  {durationMins}:00
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Navigation tab bar */}
          <div className="border-b border-border/40 select-none flex items-center gap-1">
            {(["ai", "transcript", "decisions"] as const).map((tab) => {
              const labels = { ai: "AI Highlights", transcript: "Transcript", decisions: "Decisions & Actions" }
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    activeTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {labels[tab]}
                </button>
              )
            })}
          </div>

          <div className="mt-4">
            {activeTab === "ai" && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Executive Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground leading-relaxed">
                    {meeting.summary || "No executive summary parsed. Processing transcript highlights..."}
                  </CardContent>
                </Card>

                {/* Speaker segments talking ratio */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Speaker Talking Ratio</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {speakers.length > 0 ? (
                      speakers.map((s, idx) => (
                        <div key={idx} className="space-y-1.5 select-none">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                              <span className="text-foreground/90">{s.name}</span>
                              <span className="text-[10px] text-muted-foreground font-medium">({s.role})</span>
                            </div>
                            <span className="text-muted-foreground">{s.time} ({s.percent}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.percent}%` }} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground text-center py-4">
                        No speaker ratios resolved. Wait for meeting to finish transcribing.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "transcript" && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="w-full">
                  <Input
                    placeholder="Search speech contents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="w-4 h-4 text-muted-foreground/60" />}
                    className="h-9 text-xs select-none"
                  />
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {filteredTranscript.length > 0 ? (
                    filteredTranscript.map((line, i) => (
                      <div key={i} className="flex gap-4 items-start p-3 hover:bg-muted/10 rounded-xl transition-colors border border-border/10">
                        <div className="w-24 shrink-0 text-xs select-none">
                          <span className="font-semibold text-foreground/90 block truncate">{line.speaker}</span>
                          <span className="font-mono text-[9px] text-muted-foreground mt-0.5 block">{line.time}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                          {line.text}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-12">
                      No transcript segments matched search criteria.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "decisions" && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Actions Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Action Items</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {meeting.action_items && meeting.action_items.length > 0 ? (
                      meeting.action_items.map((item: any, i: number) => (
                        <div key={i} className="flex gap-2.5 items-start">
                          <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${item.completed ? "text-emerald-500" : "text-muted-foreground/45"}`} />
                          <div className="text-xs space-y-0.5">
                            <span className="text-foreground/90 block leading-normal leading-relaxed">{item.content}</span>
                            {item.assignee && (
                              <span className="text-[10px] text-muted-foreground font-semibold block pt-0.5">Assignee: {item.assignee}</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground text-center py-6">No action items assigned.</div>
                    )}
                  </CardContent>
                </Card>

                {/* Decisions Log */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Decisions Log</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {meeting.decisions && meeting.decisions.length > 0 ? (
                      meeting.decisions.map((dec: any, i: number) => (
                        <div key={i} className="flex gap-2.5 items-start">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <div className="text-xs space-y-0.5">
                            <span className="text-foreground/90 block leading-normal leading-relaxed">{dec.content}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground text-center py-6">No decisions logged.</div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Side: Copilot Panel */}
        <div className="lg:col-span-1">
          <Card className="h-[520px] flex flex-col border-border/60">
            <CardHeader className="pb-3 border-b border-border/40 shrink-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500 animate-ai-pulse" />
                <span>AI Copilot Chat</span>
              </CardTitle>
              <CardDescription className="text-[10px]">Converse with transcript semantic context.</CardDescription>
            </CardHeader>

            {/* Message Area */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col max-w-[85%] space-y-1 ${
                      msg.isAI ? "self-start items-start" : "self-end items-end ml-auto"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-xl text-xs leading-relaxed leading-normal ${
                        msg.isAI
                          ? "bg-muted text-foreground border border-border/20 rounded-tl-xs"
                          : "bg-primary text-primary-foreground rounded-tr-xs"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-muted-foreground font-mono">{msg.time}</span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isChatting && (
                <div className="flex gap-1.5 items-center p-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
            </CardContent>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border/40 flex items-center gap-2 shrink-0">
              <Input
                placeholder="Ask assistant questions..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isChatting}
                className="h-9 text-xs flex-1"
              />
              <Button type="submit" size="icon" disabled={isChatting || !chatInput.trim()} className="h-9 w-9 shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
