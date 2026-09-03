"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Sparkles,
  Video,
  CheckCircle2,
  Lock,
  Search,
  Zap,
  Mic,
  ArrowRight,
  Play,
  Check,
  ChevronDown,
  Clock,
  Layers,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { useRouter } from "next/navigation"
import { useToast } from "@/components/providers/toast-provider"
import { useAuth } from "@/lib/hooks"

export default function LandingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, demoLogin, isDemoLoggingIn } = useAuth()
  const [billingPeriod, setBillingPeriod] = React.useState<"monthly" | "annually">("monthly")
  const [openFaq, setOpenFaq] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

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

  const features = [
    {
      title: "Decision Ledger",
      desc: "Automatically extract key architectural decisions, reasons, and historical changes from conversations.",
      icon: CheckCircle2,
    },
    {
      title: "Project Timeline",
      desc: "Chronologically map discussions and uploads directly to different project development stages.",
      icon: Layers,
    },
    {
      title: "AI Context Engine",
      desc: "Ask follow-up questions across your entire meeting history and decisions instead of single sessions.",
      icon: Search,
    },
    {
      title: "Local Speech-to-Text",
      desc: "Transcribe raw files locally on CPU using Faster-Whisper, securing on-premise privacy.",
      icon: Zap,
    },
    {
      title: "Briefen AI Summaries",
      desc: "Extract summaries, action checklists, and tags automatically using Gemini-1.5-Flash.",
      icon: Sparkles,
    },
    {
      title: "Workspace Collaboration",
      desc: "Organize project workspaces, assign tasks, and trigger notification alerts.",
      icon: MessageSquare,
    },
  ]

  const pricingTiers = [
    {
      name: "Starter",
      desc: "Perfect for individuals and small setups.",
      price: { monthly: 0, annually: 0 },
      features: [
        "3 meeting uploads per month",
        "Standard Whisper transcription",
        "AI Summaries (Basic)",
        "Search last 30 days",
      ],
      cta: "Sign Up Free",
      href: "/register",
      featured: false,
    },
    {
      name: "Pro",
      desc: "Ideal for high-growth product teams.",
      price: { monthly: 19, annually: 15 },
      features: [
        "Unlimited meeting uploads",
        "Whisper Large v3 (Max accuracy)",
        "AI Action Delegation & webhooks",
        "AI Chat Assistant integrations",
        "Full transcript searches",
        "Semantic topic tracking",
      ],
      cta: "Start 14-Day Free Trial",
      href: "/register",
      featured: true,
    },
    {
      name: "Enterprise",
      desc: "Built for secure organization-wide scale.",
      price: { monthly: 49, annually: 39 },
      features: [
        "Everything in Pro",
        "Dedicated custom AI prompt models",
        "Postgres isolated database option",
        "SAML SSO & Roles Audit logs",
        "24/7 SLA Technical support",
        "Custom billing & invoicing",
      ],
      cta: "Contact Enterprise Sales",
      href: "/register",
      featured: false,
    },
  ]

  const testimonials = [
    {
      quote: "Briefen transformed our weekly retro meetings. The automatic Slack notification triggers make sure no action items fall through the cracks.",
      author: "Sarah Jenkins",
      role: "Director of Product, Acme Corp",
      avatar: "SJ",
    },
    {
      quote: "As an engineering manager, the talking ratio charts helped us realize three developers were dominating syncs. We restructured syncs and saved 5 hours weekly.",
      author: "David Chen",
      role: "Engineering VP, TechFlow",
      avatar: "DC",
    },
    {
      quote: "The semantic keyword search works like magic. I can find comments about 'database indexes' made three months ago in under five seconds.",
      author: "Emily Watson",
      role: "Design Lead, CreativeStudio",
      avatar: "EW",
    },
  ]

  const faqs = [
    {
      q: "How does the AI recognize different speakers?",
      a: "Our core audio engine isolates different speakers by analyzing voice frequencies during meeting segments. You can easily name speakers or link profiles on the Meeting details workspace.",
    },
    {
      q: "Does Briefen support Zoom, Teams, and Google Meet?",
      a: "Yes. You can upload MP4/MP3 recordings directly, or sync calendars to have our Briefen assistant bot join scheduled video sessions automatically.",
    },
    {
      q: "Can I customize the summary prompts?",
      a: "Absolutely! Under AI settings configurations, workspace admins can write custom prompts to direct the summary model to outline specific frameworks like Agile retro cards.",
    },
    {
      q: "Is my meeting data private and secure?",
      a: "Yes, security is our primary focus. We encrypt all media files at rest and in transit, and do not use your transcripts to train public AI baseline models.",
    },
  ]

  return (
    <div className="space-y-24 py-16 sm:py-24">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8 select-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <Badge variant="ai" className="px-3.5 py-1 text-xs">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-ai-pulse" />
            <span>Briefen is now SOC-2 Certified</span>
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-bold font-display tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]"
        >
          Every conversation moves your{" "}
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-400">
            project forward
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Briefen captures discussions, understands decisions, preserves organizational knowledge and gives your team an AI that remembers everything.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 pt-4"
        >
          <Link href="/register">
            <Button variant="ai" size="lg" className="h-12 px-6">
              <span>Start Free</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="h-12 px-6 bg-card" onClick={handleDemoClick} isLoading={isDemoLoggingIn}>
            <Sparkles className="w-4 h-4 mr-1.5 text-purple-500 animate-ai-pulse" />
            <span>Try Demo</span>
          </Button>
        </motion.div>

        {/* Product Screen Mockup Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="pt-12 max-w-5xl mx-auto"
        >
          <div className="rounded-2xl border border-border/60 bg-card p-2 shadow-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/10 via-transparent to-indigo-500/10 opacity-60 pointer-events-none" />
            {/* Simulated UI layout */}
            <div className="rounded-xl border border-border/40 bg-background/50 backdrop-blur-md overflow-hidden aspect-video flex">
              {/* Fake Sidebar preview */}
              <div className="w-16 sm:w-48 border-r border-border/30 bg-muted/15 hidden sm:flex flex-col p-3 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-full bg-muted rounded-sm" />
                  <div className="h-3.5 w-4/5 bg-muted rounded-sm" />
                  <div className="h-3.5 w-3/4 bg-muted rounded-sm" />
                </div>
                <div className="h-4 w-1/2 bg-muted rounded-sm shrink-0" />
              </div>
              {/* Fake Main Content */}
              <div className="flex-1 p-6 space-y-6 flex flex-col text-left">
                <div className="flex justify-between items-center border-b border-border/30 pb-4">
                  <div className="space-y-1">
                    <div className="h-4 w-48 bg-muted rounded-md" />
                    <div className="h-3.5 w-24 bg-muted rounded-sm" />
                  </div>
                  <div className="h-8 w-20 bg-primary/10 rounded-md" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                  <div className="sm:col-span-2 rounded-lg border border-border/40 bg-card/60 p-4 space-y-3">
                    <div className="h-3.5 w-1/3 bg-muted rounded-sm" />
                    <div className="h-3.5 w-full bg-muted rounded-sm" />
                    <div className="h-3.5 w-5/6 bg-muted rounded-sm" />
                    <div className="h-3.5 w-4/5 bg-muted rounded-sm" />
                  </div>
                  <div className="rounded-lg border border-border/40 bg-card/60 p-4 space-y-3">
                    <div className="h-3.5 w-1/2 bg-muted rounded-sm" />
                    <div className="h-2 w-full bg-muted rounded-sm" />
                    <div className="h-2 w-3/4 bg-muted rounded-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground/90">
            Briefen Features
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Everything you need to transform meeting recordings into clean databases of transcripts, action items, and structural search fields.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <Card key={idx} hoverable className="border-border/40">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <feat.icon className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">{feat.title}</CardTitle>
                <CardDescription className="text-xs">{feat.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 bg-muted/15 py-12 rounded-3xl border border-border/30">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground/90">
            Trusted by Top Teams
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Read how product designers and developers save hours of meeting alignment overhead using Briefen.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((test, idx) => (
            <Card key={idx} className="bg-card border-border/40 hover:-translate-y-[2px] transition-all duration-300">
              <CardContent className="pt-6 space-y-4">
                <p className="text-xs text-foreground/80 leading-relaxed italic">
                  "{test.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                    {test.avatar}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground/90">{test.author}</div>
                    <div className="text-[10px] text-muted-foreground">{test.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Matrix */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 select-none">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground/90">
            Transparent Pricing Tiers
          </h2>
          <p className="text-xs text-muted-foreground">
            Start completely free or upgrade to premium AI features to scale transcription summaries.
          </p>
          {/* Toggle buttons */}
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 text-xs">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-3 py-1.5 rounded-full font-semibold cursor-pointer transition-colors ${
                billingPeriod === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setBillingPeriod("annually")}
              className={`px-3 py-1.5 rounded-full font-semibold cursor-pointer transition-colors ${
                billingPeriod === "annually" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annually billing (Save 20%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingTiers.map((tier, idx) => {
            const price = billingPeriod === "monthly" ? tier.price.monthly : tier.price.annually
            return (
              <Card
                key={idx}
                className={`relative flex flex-col justify-between border-border/40 ${
                  tier.featured ? "border-primary/80 ring-2 ring-primary/20 shadow-xl" : "shadow-xs"
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge variant="ai" className="px-3 py-0.5 text-[10px]">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg font-bold font-display">{tier.name}</CardTitle>
                  <CardDescription className="text-xs">{tier.desc}</CardDescription>
                  <div className="pt-4 flex items-baseline">
                    <span className="text-3xl font-bold font-display text-foreground/90">${price}</span>
                    <span className="text-xs text-muted-foreground ml-1">/ month</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2.5 text-xs text-muted-foreground pt-4 border-t border-border/40">
                    {tier.features.map((feat, fidx) => (
                      <li key={fidx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-6">
                  <Link href={tier.href} className="w-full">
                    <Button variant={tier.featured ? "ai" : "outline"} className="w-full">
                      {tier.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </section>

      {/* FAQ accordion */}
      <section id="faq" className="mx-auto max-w-3xl px-4 sm:px-6 space-y-10 select-none">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground/90">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="rounded-2xl border border-border/40 bg-card divide-y divide-border/40 overflow-hidden">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx
            return (
              <div key={idx} className="p-4 transition-colors">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between font-semibold text-xs text-foreground/90 text-left cursor-pointer py-1.5 focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 text-xs text-muted-foreground leading-relaxed mt-2 ${
                    isOpen ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="pb-2">{faq.a}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 select-none">
        <div className="relative rounded-3xl border border-purple-500/25 bg-gradient-to-r from-violet-600 to-indigo-700 text-white p-8 md:p-12 overflow-hidden shadow-2xl text-center space-y-6">
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/[0.03] to-transparent pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight max-w-2xl mx-auto leading-tight">
            Ready to make meetings structured and searchable?
          </h2>
          <p className="text-xs text-white/80 max-w-md mx-auto leading-normal">
            Join thousands of modern product teams using Briefen to automate transcripts analysis and task assignments.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/register">
              <Button variant="secondary" className="bg-white text-indigo-700 hover:bg-white/95">
                <span>Start Free Trial</span>
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <span>Contact sales</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
