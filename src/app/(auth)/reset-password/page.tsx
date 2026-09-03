"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/providers/toast-provider"
import { useAuth } from "@/lib/hooks"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const { toast } = useToast()
  const { resetPassword, isResetPasswordPending } = useAuth()
  
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [isSuccess, setIsSuccess] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast({
        title: "Missing Token",
        description: "Password reset link is invalid or has expired.",
        variant: "error",
      })
      return
    }

    if (!password || !confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill out all fields.",
        variant: "error",
      })
      return
    }

    if (password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters.",
        variant: "warning",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Mismatch",
        description: "Passwords do not match.",
        variant: "error",
      })
      return
    }

    try {
      await resetPassword({ token, new_password: password })
      setIsSuccess(true)
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Reset Failed",
        description: err.message || "Failed to reset password. The link may have expired.",
        variant: "error",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold font-display tracking-tight text-foreground/90">
          Set new password
        </h2>
        <p className="text-xs text-muted-foreground">
          Please enter your new password below to secure your workspace.
        </p>
      </div>

      {!isSuccess ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            label="New Password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-muted-foreground/60" />}
            autoFocus
          />

          <Input
            type="password"
            label="Confirm New Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-muted-foreground/60" />}
          />

          <Button type="submit" variant="ai" className="w-full h-10" isLoading={isResetPasswordPending}>
            <span>Reset Password</span>
          </Button>
        </form>
      ) : (
        <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.01] p-4 text-center space-y-3 animate-in fade-in-0 duration-300">
          <div className="mx-auto w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-foreground">Password reset complete</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Your password has been updated. You can now log in using your new password.
            </p>
          </div>
          <Link href="/login" className="block pt-2">
            <Button variant="default" className="w-full h-9">
              <span>Go to Sign In</span>
            </Button>
          </Link>
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

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-xs text-muted-foreground font-semibold">Loading password wizard...</span>
      </div>
    }>
      <ResetPasswordForm />
    </React.Suspense>
  )
}
