"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/providers/toast-provider"

import { useAuth } from "@/lib/hooks"
import { apiClient } from "@/lib/api-client"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, login, demoLogin, isDemoLoggingIn } = useAuth()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const oauthCode = params.get("code")
      if (oauthCode) {
        let isCancelled = false
        const triggerGoogleLogin = async () => {
          setIsLoading(true)
          try {
            const response = await apiClient.post(
              "/auth/google", 
              { 
                code: oauthCode,
                redirect_uri: `${window.location.origin}/login`
              }, 
              { skipAuth: true }
            )
            
            if (!isCancelled) {
              apiClient.setTokens(response.access_token, response.refresh_token)
              toast({
                title: "Google SSO Login",
                description: "Successfully authenticated via Google OAuth.",
                variant: "success",
              })
              router.push("/dashboard")
            }
          } catch (err: any) {
            if (!isCancelled) {
              toast({
                title: "Google Login Failed",
                description: err.message || "Failed to complete Google OAuth.",
                variant: "error",
              })
            }
          } finally {
            if (!isCancelled) {
              setIsLoading(false)
            }
          }
        }
        triggerGoogleLogin()
        return () => {
          isCancelled = true
        }
      }
    }
  }, [router, toast])

  const handleDemoClick = async () => {
    try {
      await demoLogin()
      toast({
        title: "Demo Workspace Active",
        description: "Welcome to your temporary Briefen demo sandbox.",
        variant: "success",
      })
      router.push("/dashboard")
    } catch (err: any) {
      toast({
        title: "Demo Login Failed",
        description: err.message || "Failed to initialize demo sandbox.",
        variant: "error",
      })
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please enter your email and password.",
        variant: "error",
      })
      return
    }

    setIsLoading(true)
    try {
      await login({ email, password })
      toast({
        title: "Logged In",
        description: "Welcome back to your Briefen workspace.",
        variant: "success",
      })
      router.push("/dashboard")
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err.message || "Invalid credentials. Please verify and try again.",
        variant: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = (provider: string) => {
    if (provider === "Google") {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""
      if (!clientId) {
        toast({
          title: "Configuration Error",
          description: "Google OAuth is not configured. Please contact support.",
          variant: "error",
        })
        return
      }
      const redirectUri = encodeURIComponent(`${window.location.origin}/login`)
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=openid%20email%20profile`
    } else {
      toast({
        title: "OAuth Unavailable",
        description: `${provider} SSO authentication is prepared but currently disabled. Please use Google SSO.`,
        variant: "warning",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold font-display tracking-tight text-foreground/90">
          Log in to your account
        </h2>
        <p className="text-xs text-muted-foreground">
          Enter your details below to access your meeting database.
        </p>
      </div>

      {/* Login form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          type="email"
          label="Email Address"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4 text-muted-foreground/60" />}
          autoFocus
        />
        
        <div className="space-y-1">
          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-muted-foreground/60" />}
          />
          <div className="flex justify-end pt-0.5">
            <Link
              href="/forgot-password"
              className="text-[10px] font-semibold text-primary hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button type="submit" variant="ai" className="w-full h-10" isLoading={isLoading}>
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
          <Button type="button" variant="outline" className="w-full h-10 border-purple-500/25 hover:border-purple-500/40 text-purple-600 dark:text-purple-400 gap-1.5" onClick={handleDemoClick} isLoading={isDemoLoggingIn}>
            <Sparkles className="w-4 h-4 text-purple-500 animate-ai-pulse animate-duration-1000" />
            <span>Try Demo Sandbox</span>
          </Button>
        </div>
      </form>

      {/* Dividers */}
      <div className="relative flex items-center justify-center py-2 select-none">
        <div className="absolute inset-x-0 h-px bg-border/50" />
        <span className="relative px-3 bg-background text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Or continue with
        </span>
      </div>

      {/* Social options */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="sm" onClick={() => handleSocialLogin("Google")} aria-label="Log in with Google" className="h-9">
          <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span className="text-[11px]">Google</span>
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleSocialLogin("GitHub")} aria-label="Log in with GitHub" className="h-9">
          <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
          <span className="text-[11px]">GitHub</span>
        </Button>
      </div>

      {/* Sign Up prompt */}
      <p className="text-xs text-muted-foreground text-center pt-2">
        Don't have an account?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Sign up free
        </Link>
      </p>
    </div>
  )
}
