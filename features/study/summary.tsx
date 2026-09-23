"use client"

import Link from "next/link"
import { State } from "ts-fsrs"
import {
  CheckCircle2Icon,
  ClockIcon,
  CoffeeIcon,
  FlameIcon,
  PartyPopperIcon,
  TargetIcon,
  ZapIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants, Button } from "@/components/ui/button"
import { useProgress } from "@/hooks/use-progress"
import type { CardRow } from "@/lib/db"
import { deckPath } from "@/lib/routes"
import { GRADES } from "@/features/study/study-card"
import type { SessionStats } from "@/features/study/use-session"

function formatDuration(ms: number) {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${String(s % 60).padStart(2, "0")}s`
}

// The end of a session with at least one rating.
export function Summary({
  deckId,
  stats,
  canContinue,
  onContinue,
}: {
  deckId: string
  stats: SessionStats
  canContinue: boolean
  onContinue: () => void
}) {
  const progress = useProgress()
  const accuracy = Math.round((stats.correct / stats.done) * 100)
  const tiles = [
    {
      icon: CheckCircle2Icon,
      label: "Cards",
      value: stats.done,
      tone: "bg-good/15 text-good",
    },
    {
      icon: TargetIcon,
      label: "Accuracy",
      value: `${accuracy}%`,
      tone: "bg-easy/15 text-easy",
    },
    {
      icon: ClockIcon,
      label: "Time",
      value: formatDuration(stats.ms),
      tone: "bg-secondary text-secondary-foreground",
    },
    {
      icon: FlameIcon,
      label: "Best combo",
      value: `×${stats.bestCombo}`,
      tone: "bg-streak/15 text-streak",
    },
  ]

  return (
    <section className="flex animate-card-in flex-col items-center gap-6 rounded-[2rem] border-2 bg-card p-6 text-center shadow-[0_4px_0_0_var(--color-border)] sm:p-8">
      <span className="flex size-20 animate-pop-in items-center justify-center rounded-full bg-xp/20 text-amber-600 dark:text-xp">
        <PartyPopperIcon className="size-10" />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-3xl font-extrabold tracking-tight">
          Session complete!
        </h2>
        <p className="flex items-center justify-center gap-1 font-heading text-lg font-extrabold text-amber-600 dark:text-xp">
          <ZapIcon className="size-5 fill-current" />+{stats.xp} XP
        </p>
        {progress && progress.streak > 0 && (
          <p className="text-sm text-muted-foreground">
            {progress.streak === 1
              ? "Day one of your streak."
              : `${progress.streak}-day streak — keep it going tomorrow.`}
          </p>
        )}
      </div>

      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map(({ icon: Icon, label, value, tone }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1.5 rounded-2xl border p-3"
          >
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-xl",
                tone
              )}
            >
              <Icon className="size-5" />
            </span>
            <span className="font-heading text-xl leading-none font-extrabold tabular-nums">
              {value}
            </span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <div className="flex w-full flex-col gap-2">
        <div className="flex h-3 overflow-hidden rounded-full bg-muted">
          {GRADES.map(({ grade, tone }) =>
            stats.ratings[grade] ? (
              <div
                key={grade}
                style={{
                  width: `${(stats.ratings[grade] / stats.done) * 100}%`,
                  background: tone,
                }}
              />
            ) : null
          )}
        </div>
        <div className="flex justify-center gap-4 text-xs text-muted-foreground">
          {GRADES.map(({ grade, label, tone }) => (
            <span key={grade} className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-full"
                style={{ background: tone }}
              />
              {label}
              <span className="font-bold text-foreground tabular-nums">
                {stats.ratings[grade]}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        {canContinue && (
          <Button variant="pop" size="xl" onClick={onContinue}>
            Keep going
          </Button>
        )}
        <Link
          href={deckPath(deckId, "overview")}
          className={buttonVariants({
            variant: canContinue ? "outline" : "pop",
            size: "xl",
          })}
        >
          Back to deck
        </Link>
      </div>
    </section>
  )
}

// Nothing to study, and nothing studied this session.
export function NothingDue({
  deckId,
  cards,
  newLeft,
}: {
  deckId: string
  cards: CardRow[]
  newLeft: number
}) {
  const unseen = cards.some((c) => c.state === State.New)
  const upcoming = cards
    .filter((c) => c.state !== State.New)
    .reduce<Date | null>((min, c) => (!min || c.due < min ? c.due : min), null)
  const limitReached = unseen && newLeft === 0

  return (
    <section className="flex flex-col items-center gap-3 rounded-[2rem] border-2 border-dashed px-6 py-14 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <CoffeeIcon className="size-8" />
      </span>
      <h2 className="font-heading text-2xl font-extrabold">All caught up</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {limitReached ? (
          <>
            You’ve met today’s new-card limit for this deck. Come back tomorrow,
            or raise it in{" "}
            <Link
              href={deckPath(deckId, "settings")}
              className="text-primary underline underline-offset-4"
            >
              deck settings
            </Link>
            .
          </>
        ) : upcoming ? (
          `Next review ${upcoming.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}.`
        ) : (
          "Nothing to review in this deck."
        )}
      </p>
    </section>
  )
}
