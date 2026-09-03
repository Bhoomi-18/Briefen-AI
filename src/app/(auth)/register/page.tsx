"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, User, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/providers/toast-provider"

import { useAuth } from "@/lib/hooks"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, signup, login } = useAuth()
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
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

    setIsLoading(true)
    try {
      await signup({ email, password, full_name: name })
      
      // Check if email verification is skipped (set in docker.env / NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION)
      const skipVerification = process.env.NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION === "true"
      
      if (skipVerification) {
        // Auto-login the user immediately
        try {
          await login({ email, password })
          toast({
            title: "Account Created",
            description: "Welcome to Briefen! Your workspace is ready.",
            variant: "success",
          })
          router.push("/dashboard")
        } catch {
          toast({
            title: "Account Created",
            description: "Account created successfully. Please log in.",
            variant: "success",
          })
          router.push("/login")
        }
      } else {
        toast({
          title: "Account Created",
          description: "Please check your inbox to verify your email address.",
          variant: "success",
        })
        router.push(`/verify-email?email=${encodeURIComponent(email)}`)
      }
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err.message || "Failed to create account. Please try again.",
        variant: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold font-display tracking-tight text-foreground/90">
          Create your free account
        </h2>
        <p className="text-xs text-muted-foreground">
          No credit card required. Start organizing your meetings today.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          type="text"
          label="Full Name"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<User className="w-4 h-4 text-muted-foreground/60" />}
          autoFocus
        />

        <Input
          type="email"
          label="Business Email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4 text-muted-foreground/60" />}
        />

        <Input
          type="password"
          label="Password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4 text-muted-foreground/60" />}
        />

        <p className="text-[10px] text-muted-foreground leading-normal">
          By signing up, you agree to our{" "}
          <span className="text-foreground hover:underline cursor-pointer">Terms of Service</span> and{" "}
          <span className="text-foreground hover:underline cursor-pointer">Privacy Policy</span>.
        </p>

        <Button type="submit" variant="ai" className="w-full h-10" isLoading={isLoading}>
          <span>Get Started Free</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </form>

      {/* Login prompt */}
      <p className="text-xs text-muted-foreground text-center pt-2">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
