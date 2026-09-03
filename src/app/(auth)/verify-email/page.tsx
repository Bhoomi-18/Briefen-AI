"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Mail, ShieldCheck, AlertCircle, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/providers/toast-provider"
import { apiClient } from "@/lib/api-client"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")
  const { toast } = useToast()
  
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = React.useState("")

  React.useEffect(() => {
    if (token) {
      const verifyToken = async () => {
        setStatus("loading")
        try {
          await apiClient.post("/auth/verify-email", { token })
          setStatus("success")
          toast({
            title: "Email Verified",
            description: "Your email has been verified successfully. You can now log in.",
            variant: "success",
          })
        } catch (err: any) {
          setStatus("error")
          setErrorMessage(err.message || "Invalid or expired verification link.")
          toast({
            title: "Verification Failed",
            description: err.message || "Failed to verify email address.",
            variant: "error",
          })
        }
      }
      verifyToken()
    }
  }, [token, toast])

  const handleResend = () => {
    toast({
      title: "Email Resent",
      description: `A new verification link has been dispatched to ${email || "your email address"}.`,
      variant: "success",
    })
  }

  if (status === "loading") {
    return (
      <div className="text-center space-y-4 py-4 animate-in fade-in-0 duration-300">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-spin">
          <Loader2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Verifying email address</h3>
          <p className="text-[10px] text-muted-foreground">
            Contacting Briefen security nodes to activate your session...
          </p>
        </div>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.01] p-5 text-center space-y-4 animate-in fade-in-0 duration-300">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-foreground">Email verified successfully</h4>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Your workspace account is now active and secure. You can log in using your credentials.
          </p>
        </div>
        <Link href="/login" className="block pt-2">
          <Button variant="ai" className="w-full h-10">
            <span>Proceed to Sign In</span>
          </Button>
        </Link>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="rounded-xl border border-destructive/10 bg-destructive/[0.01] p-5 text-center space-y-4 animate-in fade-in-0 duration-300">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-foreground">Verification failed</h4>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {errorMessage || "The verification link is invalid, malformed, or has expired."}
          </p>
        </div>
        <Link href="/login" className="block pt-2">
          <Button variant="outline" className="w-full h-10">
            <span>Back to Sign In</span>
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold font-display tracking-tight text-foreground/90">
          Verify your email
        </h2>
        <p className="text-xs text-muted-foreground">
          We sent a verification link to your business inbox. Click the link to complete account setup.
        </p>
      </div>

      <div className="rounded-xl border border-primary/10 bg-primary/[0.01] p-5 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Mail className="w-6 h-6 animate-pulse" />
        </div>
        
        {email && (
          <div className="inline-block px-3 py-1 bg-muted rounded-full border border-border text-[10px] font-mono text-foreground/80">
            {email}
          </div>
        )}

        <div className="space-y-1 text-center">
          <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
            Can't find the email? Check your spam folder or click below to request a new link.
          </p>
        </div>

        <Button onClick={handleResend} variant="outline" className="w-full h-9 text-xs">
          <span>Resend verification email</span>
        </Button>
      </div>

      <div className="text-center pt-2">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to login</span>
        </Link>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-xs text-muted-foreground font-semibold">Loading verification module...</span>
      </div>
    }>
      <VerifyEmailContent />
    </React.Suspense>
  )
}
