"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import {
  FlameIcon,
  GalleryVerticalEndIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
  ZapIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants, Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useProgress } from "@/hooks/use-progress"

export function AppHeader() {
  const progress = useProgress()
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center gap-2 px-4 sm:px-6">
        <Link
          href="/"
          className="me-auto flex items-center gap-2 font-heading text-lg font-extrabold tracking-tight"
        >
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_3px_0_0_var(--color-primary-shadow)]">
            <GalleryVerticalEndIcon className="size-4" />
          </span>
          <span className="hidden sm:inline">Open Flashcard</span>
        </Link>

        {progress && (
          <>
            <Tooltip>
              <TooltipTrigger
                className={cn(
                  "flex h-8 items-center gap-1 rounded-full px-2.5 font-heading text-sm font-extrabold tabular-nums",
                  progress.studiedToday
                    ? "bg-streak/15 text-streak"
                    : "text-muted-foreground"
                )}
              >
                <FlameIcon
                  className={cn(
                    "size-4",
                    progress.studiedToday && "fill-current"
                  )}
                />
                {progress.streak}
              </TooltipTrigger>
              <TooltipContent>
                {progress.streak === 1
                  ? "1-day streak"
                  : `${progress.streak}-day streak`}
                {!progress.studiedToday &&
                  progress.streak > 0 &&
                  " — study today to keep it"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger className="flex h-8 items-center gap-1.5 rounded-full bg-xp/15 px-2.5 font-heading text-sm font-extrabold text-amber-700 tabular-nums dark:text-xp">
                <ZapIcon className="size-4 fill-current" />
                <span>Lv {progress.level.level}</span>
                <span
                  aria-hidden
                  className="hidden h-1.5 w-10 overflow-hidden rounded-full bg-xp/25 sm:block"
                >
                  <span
                    className="block h-full rounded-full bg-xp"
                    style={{
                      width: `${(progress.level.into / progress.level.span) * 100}%`,
                    }}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {progress.xp.toLocaleString()} XP ·{" "}
                {progress.level.span - progress.level.into} to level{" "}
                {progress.level.level + 1}
              </TooltipContent>
            </Tooltip>
          </>
        )}

        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle dark mode"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <SunIcon className="hidden dark:block" />
          <MoonIcon className="dark:hidden" />
        </Button>
        <Link
          href="/settings"
          aria-label="Settings"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <SettingsIcon />
        </Link>
      </div>
    </header>
  )
}
