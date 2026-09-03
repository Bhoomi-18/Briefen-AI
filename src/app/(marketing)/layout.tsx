import * as React from "react"
import Link from "next/link"
import { Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Marketing Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.25)]">
              <Sparkles className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground tracking-tight">
              Briefen
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#features" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
              Features
            </Link>
            <Link href="/#pricing" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
              Pricing
            </Link>
            <Link href="/#faq" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
              FAQ
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/register">
              <Button variant="default" size="sm" className="hidden sm:inline-flex">
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/30 py-12 md:py-16 select-none">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-sm text-foreground tracking-tight">
                  Briefen
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                Next-generation AI meeting assistant that records, transcribes, summarizes, and assigns team workflows automatically.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground/80 tracking-widest uppercase">Product</h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/login" className="hover:text-foreground transition-colors">Integrations</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground/80 tracking-widest uppercase">Company</h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors cursor-pointer">About Us</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Careers</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Press Kit</span></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground/80 tracking-widest uppercase">Legal</h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Security Standards</span></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/30 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p className="text-[10px] text-muted-foreground">
              © {new Date().getFullYear()} Briefen Inc. All rights reserved.
            </p>
            <p className="text-[10px] text-muted-foreground">
              Designed according to Human Interface Guidelines.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
