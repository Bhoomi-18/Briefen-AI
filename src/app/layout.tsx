import type { Metadata } from "next"
import { Inter, Outfit } from "next/font/google"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { ToastProvider } from "@/components/providers/toast-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import "./globals.css"

const sansFont = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
})

const displayFont = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Briefen - AI Project Intelligence Platform",
  description:
    "From Conversations to Clarity. Briefen captures discussions, understands decisions, preserves organizational knowledge, and builds a continuous project memory.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${sansFont.variable} ${displayFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans antialiased text-foreground bg-background">
        <ThemeProvider defaultTheme="system" storageKey="briefen-theme">
          <QueryProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
