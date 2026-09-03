"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  LayoutGrid,
  List,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  User,
  Plus,
  ArrowRight,
  TrendingUp,
  Tag,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Loader2,
  Calendar,
  X
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/providers/toast-provider"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { useTasks } from "@/lib/hooks"
import { SkeletonCard } from "@/components/ui/skeleton"

export default function TasksPage() {
  const { toast } = useToast()
  const { tasks, createTask, updateTask, deleteTask, isLoading } = useTasks()
  
  const [activeTab, setActiveTab] = React.useState<"kanban" | "table">("kanban")
  
  // Creation States
  const [isCreating, setIsCreating] = React.useState(false)
  const [taskTitle, setTaskTitle] = React.useState("")
  const [taskPriority, setTaskPriority] = React.useState<"low" | "medium" | "high">("medium")

  // Derive Kanban Columns
  const kanbanColumns = React.useMemo(() => {
    return [
      {
        id: "todo",
        title: "To Do",
        color: "border-t-blue-500",
        items: tasks.filter((t: any) => t.status === "todo"),
      },
      {
        id: "in_progress",
        title: "In Progress",
        color: "border-t-purple-500",
        items: tasks.filter((t: any) => t.status === "in_progress"),
      },
      {
        id: "review",
        title: "Review",
        color: "border-t-amber-500",
        items: tasks.filter((t: any) => t.status === "review"),
      },
      {
        id: "completed",
        title: "Completed",
        color: "border-t-emerald-500",
        items: tasks.filter((t: any) => t.status === "completed"),
      },
    ]
  }, [tasks])

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return

    try {
      await createTask({
        title: taskTitle.trim(),
        priority: taskPriority,
        status: "todo"
      })
      setTaskTitle("")
      setIsCreating(false)
      toast({
        title: "Task Created",
        description: "New action item has been registered in the database.",
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Failed to create",
        description: err.message,
        variant: "error",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id)
      toast({
        title: "Task Deleted",
        description: "The task was successfully deleted from your database.",
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

  const moveTask = async (taskId: string, currentStatus: string, direction: "next" | "prev") => {
    const statusWorkflow = ["todo", "in_progress", "review", "completed"]
    const currentIndex = statusWorkflow.indexOf(currentStatus)
    let newIndex = currentIndex
    
    if (direction === "next") newIndex = Math.min(currentIndex + 1, statusWorkflow.length - 1)
    if (direction === "prev") newIndex = Math.max(currentIndex - 1, 0)
    
    if (newIndex === currentIndex) return
    const nextStatus = statusWorkflow[newIndex]

    try {
      await updateTask({ id: taskId, data: { status: nextStatus } })
      toast({
        title: "Task Status Updated",
        description: `Moved task to ${nextStatus.replace("_", " ")}.`,
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Move Failed",
        description: err.message,
        variant: "error",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-border/40 pb-6">
          <div className="h-7 w-32 rounded bg-muted/60 shimmer relative overflow-hidden" />
          <div className="h-3 w-64 rounded bg-muted/40 shimmer relative overflow-hidden mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6 select-none">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground/90">
            Workspace Kanban
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track meeting tasks, assignees, and project action checklist progress.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Tab Selectors */}
          <div className="flex bg-muted/60 p-0.5 rounded-lg border border-border/30">
            <Button
              variant={activeTab === "kanban" ? "default" : "ghost"}
              size="icon"
              className="h-7 w-8"
              onClick={() => setActiveTab("kanban")}
              aria-label="View Kanban columns grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={activeTab === "table" ? "default" : "ghost"}
              size="icon"
              className="h-7 w-8"
              onClick={() => setActiveTab("table")}
              aria-label="View list table"
            >
              <List className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Button variant="ai" size="sm" onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-1" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* Creation Modal form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-purple-500/20 bg-purple-500/[0.01]">
              <CardContent className="p-4 relative">
                <button
                  onClick={() => setIsCreating(false)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <h4 className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5 select-none">
                    <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                    <span>Create Custom Task Card</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2">
                      <Input
                        placeholder="What needs to be done?"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        required
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <select
                        value={taskPriority}
                        onChange={(e: any) => setTaskPriority(e.target.value)}
                        className="w-full h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 select-none">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="ai" size="sm">
                      <span>Create Task</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Kanban Columns Panel */}
      {activeTab === "kanban" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start select-none">
          {kanbanColumns.map((col) => (
            <div key={col.id} className="space-y-3 bg-muted/20 border border-border/20 rounded-xl p-3 flex flex-col min-h-[300px]">
              {/* Column Title */}
              <div className={`border-t-2 ${col.color} pt-2 flex items-center justify-between`}>
                <span className="text-xs font-bold text-foreground/80">{col.title}</span>
                <Badge variant="outline" className="scale-90 text-[10px] px-1.5">
                  {col.items.length}
                </Badge>
              </div>

              {/* Task list inside column */}
              <div className="space-y-2 flex-1">
                {col.items.length > 0 ? (
                  col.items.map((task: any) => {
                    const isCompleted = col.id === "completed"
                    return (
                      <Card key={task.id} className="p-3 bg-card hover:border-foreground/15 transition-colors relative group">
                        <div className="space-y-2">
                          <span className={`text-xs block leading-relaxed text-foreground/80 ${isCompleted ? "line-through text-muted-foreground/60" : ""}`}>
                            {task.title}
                          </span>
                          
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <Badge
                              variant={
                                task.priority === "high"
                                  ? "destructive"
                                  : task.priority === "medium"
                                  ? "warning"
                                  : "secondary"
                              }
                              className="scale-90 text-[8px] px-1 py-0"
                            >
                              {task.priority}
                            </Badge>

                            {/* Move controls buttons */}
                            <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveTask(task.id, task.status, "prev")}
                                disabled={task.status === "todo"}
                                className="h-5 w-5 rounded bg-muted/40 hover:bg-muted/80 text-muted-foreground"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveTask(task.id, task.status, "next")}
                                disabled={task.status === "completed"}
                                className="h-5 w-5 rounded bg-muted/40 hover:bg-muted/80 text-muted-foreground"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(task.id)}
                                className="h-5 w-5 rounded bg-destructive/10 hover:bg-destructive/20 text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })
                ) : (
                  <div className="h-20 flex items-center justify-center text-[10px] text-muted-foreground border border-dashed border-border/40 rounded-xl bg-card/[0.01]">
                    Empty Column
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Alternative List Table Panel */
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Task Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length > 0 ? (
                  tasks.map((task: any) => (
                    <TableRow key={task.id}>
                      <TableCell className="pl-6 font-medium text-xs text-foreground/80">{task.title}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            task.priority === "high"
                              ? "destructive"
                              : task.priority === "medium"
                              ? "warning"
                              : "secondary"
                          }
                          className="scale-90 text-[8px]"
                        >
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold capitalize text-muted-foreground">
                        {task.status.replace("_", " ")}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)} className="h-7 w-7 text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-xs text-muted-foreground">
                      No workspace tasks found. Create a custom task card above or upload syncs to extract items.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
