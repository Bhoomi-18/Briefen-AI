"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  Send,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  FileText,
  Clock,
  ExternalLink,
  Bot,
  User,
  Plus,
  Link as LinkIcon
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/providers/toast-provider"
import { useGlobalChat } from "@/lib/hooks"

interface ChatMessage {
  id: string
  sender: "user" | "ai"
  text: string
  timestamp: string
  citations?: string[]
}

export default function AIChatPage() {
  const { toast } = useToast()
  const { chat, isChatting } = useGlobalChat()
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "1",
      sender: "ai",
      text: "Hello! I am Briefen AI, your Project Intelligence Copilot. I have access to your workspace's continuous memory—including all transcripts, action items, decision ledger logs, and project timelines. Ask me anything about your project history!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [inputValue, setInputValue] = React.useState("")
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new message
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isChatting])

  const suggestedPrompts = [
    "What changed since last sprint?",
    "When did we decide to use Neon PostgreSQL?",
    "Show every decision related to deployment.",
  ]

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputValue("")

    try {
      const response = await chat(textToSend)
      
      const aiResponse: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        sender: "ai",
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: response.citations || [],
      }

      setMessages((prev) => [...prev, aiResponse])
      
      if (response.citations && response.citations.length > 0) {
        toast({
          title: "AI Search complete",
          description: `Found ${response.citations.length} cited transcript segments.`,
          variant: "ai",
        })
      }
    } catch (err: any) {
      toast({
        title: "Chat query failed",
        description: err.message || "Failed to contact Gemini chat engine.",
        variant: "error",
      })
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] md:h-[calc(100vh-13rem)] justify-between select-none">
      {/* Header */}
      <div className="border-b border-border/40 pb-4 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display tracking-tight text-foreground/90 flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-purple-500 animate-ai-pulse" />
            <span>AI Copilot Workspace</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ask questions, retrieve meeting files details, and extract action notes.
          </p>
        </div>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4 pr-1 animate-in fade-in duration-200" aria-live="polite" aria-label="Chat messages">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className={`flex gap-3 max-w-[80%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Avatar circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border text-xs font-semibold ${
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-foreground border-border/80"
                }`}
              >
                {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message text card */}
              <div className="space-y-2 max-w-full">
                <div
                  className={`rounded-2xl p-4 shadow-xs text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-card text-foreground/90 border border-border/40 rounded-tl-none"
                  }`}
                >
                  <p>{msg.text}</p>
                </div>

                {/* Citations overlays if they exist */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest block pl-1">Sources Cited:</span>
                    <div className="space-y-2">
                      {msg.citations.map((cite, cIdx) => (
                        <motion.div
                          key={cIdx}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-3 rounded-xl border border-purple-500/15 bg-purple-500/[0.01] flex items-start justify-between gap-3 text-[10px] w-80 max-w-full shadow-xs"
                        >
                          <div className="overflow-hidden space-y-1">
                            <span className="font-semibold text-purple-600 dark:text-purple-400 block">
                              Retrieved Segment #{cIdx + 1}
                            </span>
                            <p className="text-muted-foreground line-clamp-3 italic">
                              "{cite}"
                            </p>
                          </div>
                          <LinkIcon className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Typing visual indicators */}
          {isChatting && (
            <div className="flex gap-3 items-center mr-auto">
              <div className="w-8 h-8 rounded-full bg-muted border border-border/80 flex items-center justify-center text-foreground">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex gap-1.5 p-3 rounded-xl bg-card border border-border/40">
                <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/45 animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/45 animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/45 animate-bounce"></span>
              </div>
            </div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts pills */}
      {messages.length === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="py-3 flex flex-wrap gap-2.5 select-none shrink-0"
        >
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-[10px] font-semibold text-muted-foreground border border-border hover:border-primary hover:text-primary rounded-lg px-3 py-1.5 bg-card cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {prompt}
            </button>
          ))}
        </motion.div>
      )}

      {/* Send Message Input form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend(inputValue)
        }}
        className="p-3 border border-border/60 bg-card rounded-xl flex gap-2 shrink-0 select-none shadow-xs"
      >
        <Input
          placeholder="Query anything from meetings (e.g. 'What were the action items?')..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="h-10 text-xs border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-1"
          disabled={isChatting}
        />
        <Button type="submit" variant="ai" size="icon" className="h-10 w-10 shrink-0" aria-label="Send message" isLoading={isChatting}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}
