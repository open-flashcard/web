import { State } from "ts-fsrs"

import { db } from "@/lib/db"
import type { Allowance } from "@/lib/fsrs/queue"
import type { StudySettings } from "@/lib/settings"

export function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// What a deck has used of today's limits, read from today's review log. A log's
// `state` is the card's state before that rating, so a New log is a card seen
// for the first time. Undoing a rating deletes its log, and gives it back.
export async function usedToday(deckId: string, now: Date) {
  const logs = await db.reviews
    .where("review")
    .aboveOrEqual(startOfDay(now))
    .filter((r) => r.deckId === deckId)
    .toArray()
  const introduced = new Set<string>()
  let reviews = 0
  for (const r of logs) {
    if (r.state === State.New) introduced.add(r.cardKey)
    else if (r.state === State.Review) reviews++
  }
  return { new: introduced.size, reviews }
}

export function allowanceFor(
  settings: Pick<StudySettings, "newPerDay" | "reviewsPerDay">,
  used: { new: number; reviews: number }
): Allowance {
  return {
    newLeft: Math.max(0, settings.newPerDay - used.new),
    reviewsLeft: Math.max(0, settings.reviewsPerDay - used.reviews),
  }
}
