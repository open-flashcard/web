"use client"

import Link from "next/link"
import { FlameIcon, Undo2Icon, XIcon, ZapIcon } from "lucide-react"

import { buttonVariants, Button } from "@/components/ui/button"
import { deckPath } from "@/lib/routes"
import type { Session } from "@/features/study/use-session"

// Combos show from this many correct answers in a row.
const COMBO_FROM = 3

// Session progress, the running combo and XP, and undo.
export function SessionBar({
  deckId,
  session,
}: {
  deckId: string
  session: Session
}) {
  const { stats, gain, progress } = session
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link
        href={deckPath(deckId, "overview")}
        aria-label="End session"
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        <XIcon />
      </Link>

      <div
        role="progressbar"
        aria-label="Session progress"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative h-4 flex-1 overflow-hidden rounded-full bg-muted"
      >
        {stats.done > 0 && (
          <div
            className="h-full overflow-hidden rounded-full bg-good transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(progress * 100, 4)}%` }}
          >
            {/* The glossy highlight that makes it look like a toy. */}
            <div className="mx-2 mt-1 h-1 rounded-full bg-white/35" />
          </div>
        )}
      </div>

      {stats.combo >= COMBO_FROM && (
        <span
          key={stats.combo}
          className="flex animate-pop-in items-center gap-0.5 rounded-full bg-streak/15 px-2 py-1 font-heading text-sm font-extrabold text-streak tabular-nums"
          title={`${stats.combo} right in a row`}
        >
          <FlameIcon className="size-4 fill-current" />×{stats.combo}
        </span>
      )}

      <span className="relative flex items-center gap-1 font-heading text-sm font-extrabold text-amber-600 tabular-nums dark:text-xp">
        <ZapIcon className="size-4 fill-current" />
        {stats.xp}
        {gain && (
          <span
            key={gain.id}
            aria-hidden
            className="pointer-events-none absolute -top-4 right-0 animate-xp-float whitespace-nowrap"
          >
            +{gain.xp}
          </span>
        )}
      </span>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Undo last rating (Z)"
        title="Undo last rating (Z)"
        disabled={!session.canUndo}
        onClick={session.undo}
      >
        <Undo2Icon />
      </Button>
    </div>
  )
}
