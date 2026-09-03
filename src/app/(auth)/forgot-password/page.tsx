"use client"

import * as React from "react"
import Link from "next/link"
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/providers/toast-provider"

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSent, setIsSent] = React.useState(false)

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast({
        title: "Validation Error",
        description: "Please enter your email address.",
        variant: "error",
      })
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setIsSent(true)
      toast({
        title: "Reset Link Sent",
        description: "Please check your inbox for instructions.",
        variant: "success",
      })
    }, 1500)
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold font-display tracking-tight text-foreground/90">
          Reset your password
        </h2>
        <p className="text-xs text-muted-foreground">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      {!isSent ? (
        <form onSubmit={handleReset} className="space-y-4">
          <Input
            type="email"
            label="Email Address"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-muted-foreground/60" />}
            autoFocus
          />

          <Button type="submit" variant="ai" className="w-full h-10" isLoading={isLoading}>
            <span>Send Reset Link</span>
          </Button>
        </form>
      ) : (
        <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.01] p-4 text-center space-y-3 animate-in fade-in-0 duration-300">
          <div className="mx-auto w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-foreground">Check your email</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              We've emailed a password reset link to <span className="text-foreground font-medium">{email}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Back to Login link */}
      <div className="text-center pt-2">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to login</span>
        </Link>
      </div>
    </div>
  )
}
