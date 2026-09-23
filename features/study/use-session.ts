"use client"

import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { Rating, type Grade } from "ts-fsrs"

import { db, type CardRow, type DeckRow } from "@/lib/db"
import { allowanceFor, usedToday } from "@/lib/fsrs/limits"
import { countToday, nextCard } from "@/lib/fsrs/queue"
import {
  rateCard,
  schedulerFor,
  undoRating,
  type Rated,
} from "@/lib/fsrs/scheduler"
import { xpFor } from "@/lib/progress"
import { useDeckSettings } from "@/lib/settings"

export interface SessionStats {
  done: number
  correct: number // rated anything but Again
  xp: number
  combo: number // correct ratings in a row
  bestCombo: number
  ratings: Record<Grade, number>
  ms: number // time spent on cards, from appearing to rating
}

const EMPTY: SessionStats = {
  done: 0,
  correct: 0,
  xp: 0,
  combo: 0,
  bestCombo: 0,
  ratings: {
    [Rating.Again]: 0,
    [Rating.Hard]: 0,
    [Rating.Good]: 0,
    [Rating.Easy]: 0,
  },
  ms: 0,
}

// One study session in one deck: the queue within today's limits, what has
// been rated so far, and undo back through every rating of the session.
export function useSession(deck: DeckRow) {
  const cards = useLiveQuery(
    () => db.cards.where("deckId").equals(deck.id).toArray(),
    [deck.id]
  )
  const used = useLiveQuery(() => usedToday(deck.id, new Date()), [deck.id])
  const settings = useDeckSettings(deck)
  const [seed] = React.useState(() => Math.random().toString(36).slice(2))
  const [now, setNow] = React.useState(() => new Date())
  // The card just rated, and a counter so the same card coming straight back remounts.
  const [last, setLast] = React.useState({ key: "", step: 0 })
  // After an undo, the card whose rating was undone comes back first.
  const [preferKey, setPreferKey] = React.useState<string>()
  const [stats, setStats] = React.useState(EMPTY)
  const [history, setHistory] = React.useState<
    { rated: Rated; before: SessionStats }[]
  >([])
  // The latest XP gain, for the floating "+10" — `id` restarts its animation.
  const [gain, setGain] = React.useState<{ xp: number; id: number }>()

  const ready = cards !== undefined && used !== undefined && !!settings
  const allowance = ready ? allowanceFor(settings, used) : undefined
  const scheduler = settings && schedulerFor(settings)

  const current = ready
    ? nextCard(cards, now, {
        skipKey: last.key,
        preferKey,
        shuffleSeed: settings.newOrder === "shuffled" ? seed : undefined,
        allowance,
      })
    : undefined
  const finished = ready && !current
  const counts = ready ? countToday(cards, now, allowance) : undefined
  const remaining = counts ? counts.new + counts.review + counts.learning : 0

  // Once the queue is empty, look again periodically for learning cards coming due.
  React.useEffect(() => {
    if (!finished) return
    const timer = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [finished])

  async function rate(row: CardRow, grade: Grade, ms: number) {
    if (!scheduler) return
    const rated = await rateCard(row, grade, scheduler, ms)
    const xp = xpFor({ rating: grade })
    const correct = grade !== Rating.Again
    setHistory((h) => [...h, { rated, before: stats }])
    setStats((s) => {
      const combo = correct ? s.combo + 1 : 0
      return {
        done: s.done + 1,
        correct: s.correct + (correct ? 1 : 0),
        xp: s.xp + xp,
        combo,
        bestCombo: Math.max(s.bestCombo, combo),
        ratings: { ...s.ratings, [grade]: s.ratings[grade] + 1 },
        ms: s.ms + ms,
      }
    })
    setGain((g) => ({ xp, id: (g?.id ?? 0) + 1 }))
    setPreferKey(undefined)
    setLast((l) => ({ key: row.key, step: l.step + 1 }))
    setNow(new Date())
  }

  async function undo() {
    const entry = history.at(-1)
    if (!entry) return
    setHistory((h) => h.slice(0, -1))
    await undoRating(entry.rated)
    setStats(entry.before)
    setGain(undefined)
    setPreferKey(entry.rated.before.key)
    setLast((l) => ({ key: "", step: l.step + 1 }))
    setNow(new Date())
  }

  return {
    ready,
    cards,
    current,
    step: last.step,
    now,
    scheduler,
    settings,
    allowance,
    counts,
    // Progress through the session so far: done over done plus what's left.
    progress: stats.done / Math.max(stats.done + remaining, 1),
    stats,
    gain,
    rate,
    undo,
    canUndo: history.length > 0,
  }
}

export type Session = ReturnType<typeof useSession>
