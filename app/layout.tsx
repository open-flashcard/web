import type { Metadata } from "next"
import { Geist_Mono, Inter, Nunito, Vazirmatn } from "next/font/google"

import "./globals.css"
import { AppHeader } from "@/components/app-header"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

// Inter has no Arabic-script glyphs; used for Persian and Arabic text.
const fontArabic = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-arabic",
})

// Rounded headings and numbers, for the game layer.
const fontDisplay = Nunito({
  subsets: ["latin"],
  variable: "--font-display",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Open Flashcard",
  description: "Study Open Flashcard decks with FSRS spaced repetition.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        fontArabic.variable,
        fontDisplay.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>
            <AppHeader />
            <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-4 pb-16 sm:px-6">
              {children}
            </main>
            <Toaster richColors position="bottom-center" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
