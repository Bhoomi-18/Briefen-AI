"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  Video,
  Play,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Share2,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/providers/toast-provider"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { useMeetings } from "@/lib/hooks"

export default function MeetingsListPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [activeStatus, setActiveStatus] = React.useState<"all" | "ready" | "processing" | "failed">("all")

  // Fetch using search term input queries
  const { meetings, deleteMeeting } = useMeetings({
    search: searchTerm,
  })

  const handleDelete = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      await deleteMeeting(id)
      toast({
        title: "Meeting Deleted",
        description: `Successfully removed "${title}" from workspace transcripts.`,
        variant: "error",
      })
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message,
        variant: "error",
      })
    }
  }

  const handleShare = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    const shareUrl = `${window.location.origin}/meetings/${id}`
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Shared Link",
      description: `Copied shareable transcript link for "${title}" to clipboard.`,
      variant: "success",
    })
  }

  // Filter local status categories
  const filteredMeetings = meetings.filter((m: any) => {
    if (activeStatus === "all") return true
    if (activeStatus === "ready") return m.status === "COMPLETED"
    if (activeStatus === "processing") return ["PENDING", "TRANSCRIBING", "SUMMARIZING"].includes(m.status)
    if (activeStatus === "failed") return m.status === "FAILED"
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6 select-none">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground/90">
            Meetings Database
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Search, filter, and review completed and processing meeting transcriptions.
          </p>
        </div>
      </div>

      {/* Filter panel */}
      <Card className="p-4 bg-card/60 backdrop-blur-xs select-none">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search meetings by keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-muted-foreground/60" />}
              className="h-9 text-xs"
            />
          </div>

          <div role="tablist" aria-label="Filter by status" className="flex items-center gap-1.5 flex-wrap">
            {(["all", "ready", "processing", "failed"] as const).map((status) => {
              const labels = { all: "All Syncs", ready: "Ready", processing: "Processing", failed: "Failed" }
              return (
                <button
                  key={status}
                  role="tab"
                  aria-selected={activeStatus === status}
                  onClick={() => setActiveStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    activeStatus === status ? "bg-primary text-primary-foreground" : "hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {labels[status]}
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Grid listing */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Meeting Details</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Keywords</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeetings.length > 0 ? (
                filteredMeetings.map((meet: any) => {
                  const durationMins = Math.round(meet.duration / 60)
                  const isReady = meet.status === "COMPLETED"
                  return (
                    <TableRow
                      key={meet.id}
                      className="cursor-pointer"
                      tabIndex={0}
                      onClick={() => {
                        router.push(`/meetings/${meet.id}`)
                      }}
                    >
                      <TableCell className="font-semibold pl-6">
                        <div className="flex items-center gap-2.5">
                          <Video className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div>
                            <div className="text-sm font-semibold text-foreground/90">{meet.title}</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                {new Date(meet.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "2-digit",
                                  year: "numeric"
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-foreground/80">
                        {durationMins > 0 ? `${durationMins} mins` : "< 1 min"}
                      </TableCell>
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
                      <TableCell>
                        {meet.status === "COMPLETED" && (
                          <Badge variant="success" className="flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Ready</span>
                          </Badge>
                        )}
                        {["PENDING", "TRANSCRIBING", "SUMMARIZING"].includes(meet.status) && (
                          <Badge variant="warning" className="flex items-center gap-1 w-fit animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Processing ({meet.progress}%)</span>
                          </Badge>
                        )}
                        {meet.status === "FAILED" && (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <AlertCircle className="w-3 h-3" />
                            <span>Failed</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="icon" onClick={(e) => handleShare(meet.id, meet.title, e)} className="h-8 w-8 text-muted-foreground">
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={(e) => handleDelete(meet.id, meet.title, e)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={FileText}
                      title="No meetings found"
                      description="Try adjusting your search keywords or status filters to find the meetings you're looking for."
                      actionLabel="Clear Filters"
                      onAction={() => { setSearchTerm(""); setActiveStatus("all") }}
                      className="border-0 rounded-none min-h-[260px]"
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
