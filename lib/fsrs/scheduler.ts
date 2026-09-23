import { fsrs, type FSRS, type Grade } from "ts-fsrs"

import { db, type CardRow } from "@/lib/db"
import type { StudySettings } from "@/lib/settings"

const schedulers = new Map<string, FSRS>()

// One FSRS instance per parameter set; decks may differ in retention and
// maximum interval.
export function schedulerFor({
  retention,
  maxInterval,
}: Pick<StudySettings, "retention" | "maxInterval">) {
  const key = `${retention}:${maxInterval}`
  let scheduler = schedulers.get(key)
  if (!scheduler) {
    scheduler = fsrs({
      request_retention: retention,
      maximum_interval: maxInterval,
    })
    schedulers.set(key, scheduler)
  }
  return scheduler
}

// Longer than this, the learner walked away; don't let it skew time stats.
const MAX_DURATION_MS = 5 * 60 * 1000

// Returns what `undoRating` needs to put things back.
export async function rateCard(
  row: CardRow,
  grade: Grade,
  scheduler: FSRS,
  durationMs?: number
) {
  const { card, log } = scheduler.next(row, new Date(), grade)
  const reviewId = await db.transaction(
    "rw",
    db.cards,
    db.reviews,
    async () => {
      await db.cards.put({ ...row, ...card })
      return db.reviews.add({
        ...log,
        deckId: row.deckId,
        cardKey: row.key,
        duration:
          durationMs === undefined
            ? undefined
            : Math.min(Math.round(durationMs), MAX_DURATION_MS),
      })
    }
  )
  return { before: row, reviewId }
}

export type Rated = Awaited<ReturnType<typeof rateCard>>

// Restores the card as it was before the rating and forgets the rating.
export async function undoRating({ before, reviewId }: Rated) {
  await db.transaction("rw", db.cards, db.reviews, async () => {
    await db.cards.put(before)
    await db.reviews.delete(reviewId)
  })
}

export function formatInterval(ms: number) {
  const min = Math.round(ms / 60000)
  if (min < 60) return `${Math.max(min, 1)}m`
  const h = Math.round(min / 60)
  if (h < 24) return `${h}h`
  const d = Math.round(h / 24)
  if (d < 30) return `${d}d`
  const mo = Math.round(d / 30)
  if (mo < 12) return `${mo}mo`
  return `${(d / 365).toFixed(1)}y`
}
