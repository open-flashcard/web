"use client"

import Link from "next/link"
import {
  CheckCircle2Icon,
  FlameIcon,
  PartyPopperIcon,
  TargetIcon,
  ZapIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { ProgressRing } from "@/components/progress-ring"
import { useProgress } from "@/hooks/use-progress"
import { DAILY_XP_GOAL, dayKey, type Progress } from "@/lib/progress"
import { deckPath } from "@/lib/routes"
import { DeckCard } from "@/features/library/deck-card"
import { DropZone, ImportArea } from "@/features/library/import"
import {
  useDeckSummaries,
  type DeckSummary,
} from "@/features/library/use-deck-summaries"

export function Today() {
  const summaries = useDeckSummaries()
  const progress = useProgress()
  if (!summaries || !progress) return null

  return (
    <ImportArea>
      {summaries.length === 0 ? (
        <Welcome />
      ) : (
        <>
          <Hero summaries={summaries} progress={progress} />
          <StatTiles progress={progress} />
          <Week progress={progress} />
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-extrabold">Decks</h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {summaries.map((s) => (
                <DeckCard key={s.deck.id} {...s} />
              ))}
              <li className="flex">
                <DropZone compact className="flex-1" />
              </li>
            </ul>
          </section>
        </>
      )}
    </ImportArea>
  )
}

function Welcome() {
  return (
    <section className="flex flex-col items-center gap-6 py-10 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">
          Let’s learn something
        </h1>
        <p className="text-muted-foreground">
          Import an Open Flashcard deck to start studying with FSRS.
        </p>
      </div>
      <DropZone className="w-full" />
    </section>
  )
}

function greeting(now: Date) {
  const h = now.getHours()
  if (h < 5) return "Up late"
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

function Hero({
  summaries,
  progress,
}: {
  summaries: DeckSummary[]
  progress: Progress
}) {
  const due = summaries.reduce((n, s) => n + s.counts.due, 0)
  const fresh = summaries.reduce((n, s) => n + s.counts.new, 0)
  // Reviews first: the deck with the most due, else the most new cards.
  const next = [...summaries].sort(
    (a, b) => b.counts.due - a.counts.due || b.counts.new - a.counts.new
  )[0]
  const ready = due + fresh > 0
  const goal = progress.today.xp / DAILY_XP_GOAL

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-primary p-6 text-primary-foreground shadow-[0_6px_0_0_var(--color-primary-shadow)] sm:p-8">
      <div
        aria-hidden
        className="absolute -top-16 -right-10 size-56 rounded-full bg-white/10"
      />
      <div
        aria-hidden
        className="absolute -bottom-20 left-1/3 size-44 rounded-full bg-white/5"
      />
      <div className="relative flex items-center gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium opacity-80">
              {greeting(new Date())}
            </p>
            <h1 className="font-heading text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
              {due > 0
                ? `${due} ${due === 1 ? "card" : "cards"} to review`
                : fresh > 0
                  ? "Ready for new cards"
                  : "All caught up!"}
            </h1>
            <p className="text-sm opacity-80">
              {due > 0 && fresh > 0 && `Plus ${fresh} new waiting. `}
              {progress.studiedToday
                ? "Streak secured for today — nice."
                : progress.streak > 0
                  ? `Study today to keep your ${progress.streak}-day streak.`
                  : "Start a streak today."}
            </p>
          </div>
          {ready ? (
            <Link
              href={deckPath(next.deck.id)}
              className="inline-flex h-12 items-center gap-2 self-start rounded-2xl bg-white px-6 font-heading text-base font-extrabold text-primary shadow-[0_4px_0_0_oklch(0_0_0/0.2)] transition-transform hover:brightness-105 active:translate-y-[3px] active:shadow-[0_1px_0_0_oklch(0_0_0/0.2)]"
            >
              Start studying
            </Link>
          ) : (
            <p className="flex items-center gap-2 font-heading font-extrabold">
              <PartyPopperIcon className="size-5" />
              Come back later for more reviews.
            </p>
          )}
        </div>
        <ProgressRing
          value={goal}
          size={104}
          stroke={10}
          className="max-sm:hidden"
        >
          <span className="font-heading text-2xl font-extrabold tabular-nums">
            {progress.today.xp}
          </span>
          <span className="text-[0.65rem] font-semibold tracking-wide uppercase opacity-80">
            / {DAILY_XP_GOAL} XP
          </span>
        </ProgressRing>
      </div>
    </section>
  )
}

function StatTiles({ progress }: { progress: Progress }) {
  const { today } = progress
  const accuracy = today.reviews
    ? `${Math.round((today.correct / today.reviews) * 100)}%`
    : "—"
  const tiles = [
    {
      icon: FlameIcon,
      label: "Day streak",
      value: progress.streak,
      tone: "bg-streak/15 text-streak",
    },
    {
      icon: ZapIcon,
      label: "XP today",
      value: today.xp,
      tone: "bg-xp/20 text-amber-600 dark:text-xp",
    },
    {
      icon: CheckCircle2Icon,
      label: "Reviews today",
      value: today.reviews,
      tone: "bg-good/15 text-good",
    },
    {
      icon: TargetIcon,
      label: "Accuracy today",
      value: accuracy,
      tone: "bg-easy/15 text-easy",
    },
  ]
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map(({ icon: Icon, label, value, tone }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-2xl border bg-card p-3"
        >
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              tone
            )}
          >
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="font-heading text-xl leading-none font-extrabold tabular-nums">
              {value}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {label}
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}

function Week({ progress }: { progress: Progress }) {
  const today = dayKey(new Date())
  return (
    <section className="flex items-center justify-between gap-1 rounded-2xl border bg-card px-3 py-3 sm:px-5">
      {progress.week.map(({ day, reviews }) => {
        const isToday = dayKey(day) === today
        return (
          <div
            key={day.toISOString()}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              className={cn(
                "text-xs font-semibold text-muted-foreground",
                isToday && "text-foreground"
              )}
            >
              {day.toLocaleDateString(undefined, { weekday: "narrow" })}
            </span>
            <span
              title={`${reviews} reviews`}
              className={cn(
                "flex size-9 items-center justify-center rounded-full font-heading text-xs font-extrabold tabular-nums",
                reviews > 0
                  ? "bg-streak text-white"
                  : "bg-muted text-muted-foreground",
                isToday && "ring-2 ring-streak ring-offset-2 ring-offset-card"
              )}
            >
              {reviews > 0 ? (
                reviews > 99 ? (
                  "99+"
                ) : (
                  reviews
                )
              ) : (
                <FlameIcon className="size-4 opacity-40" />
              )}
            </span>
          </div>
        )
      })}
    </section>
  )
}
