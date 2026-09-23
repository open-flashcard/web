import { Rating } from "ts-fsrs"

import type { ReviewRow } from "@/lib/db"

// The game layer — XP, levels and streaks — is derived from review history, so
// it needs no storage of its own and can't drift from what was studied.

// Recalling earns more than failing, but failing still counts: showing up is the point.
export const XP_FOR_RATING: Record<number, number> = {
  [Rating.Again]: 2,
  [Rating.Hard]: 6,
  [Rating.Good]: 10,
  [Rating.Easy]: 12,
}

// The ring on the Today page fills at this much XP.
export const DAILY_XP_GOAL = 100

export function xpFor(review: Pick<ReviewRow, "rating">) {
  return XP_FOR_RATING[review.rating] ?? 0
}

// Level n starts at 50·n·(n−1) XP: 0, 100, 300, 600, 1000…
export function levelFor(xp: number) {
  const level = Math.floor((1 + Math.sqrt(1 + xp / 12.5)) / 2)
  const start = 50 * level * (level - 1)
  const next = 50 * (level + 1) * level
  return { level, into: xp - start, span: next - start }
}

// Local calendar day, "2026-09-23".
export function dayKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// Consecutive study days ending today, or ending yesterday if today hasn't
// been studied yet — a streak isn't lost until the day is over.
export function streakFrom(days: ReadonlySet<string>, today: Date) {
  let day = days.has(dayKey(today)) ? today : addDays(today, -1)
  let streak = 0
  while (days.has(dayKey(day))) {
    streak++
    day = addDays(day, -1)
  }
  return streak
}

export interface Progress {
  xp: number
  level: ReturnType<typeof levelFor>
  streak: number
  studiedToday: boolean
  today: { reviews: number; xp: number; correct: number }
  // The last 7 days, oldest first.
  week: { day: Date; reviews: number }[]
}

export function progressFrom(reviews: ReviewRow[], now: Date): Progress {
  const perDay = new Map<string, number>()
  const todayKey = dayKey(now)
  const today = { reviews: 0, xp: 0, correct: 0 }
  let xp = 0

  for (const r of reviews) {
    if (r.rating === Rating.Manual) continue
    const key = dayKey(r.review)
    perDay.set(key, (perDay.get(key) ?? 0) + 1)
    xp += xpFor(r)
    if (key === todayKey) {
      today.reviews++
      today.xp += xpFor(r)
      if (r.rating !== Rating.Again) today.correct++
    }
  }

  const days = new Set(perDay.keys())
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(now, i - 6)
    return { day, reviews: perDay.get(dayKey(day)) ?? 0 }
  })

  return {
    xp,
    level: levelFor(xp),
    streak: streakFrom(days, now),
    studiedToday: days.has(todayKey),
    today,
    week,
  }
}
