import { State } from "ts-fsrs"

import type { CardRow } from "@/lib/db"

// Learning steps are minutes apart; when nothing else is due, show those early
// rather than making the learner wait.
const LEARN_AHEAD_MS = 20 * 60 * 1000

// What today's per-day limits still allow, for one deck.
export interface Allowance {
  newLeft: number
  reviewsLeft: number
}

const NO_LIMIT: Allowance = { newLeft: Infinity, reviewsLeft: Infinity }

// Whether today's limits let this card be shown. Learning and relearning cards
// are never held back: stopping them mid-step would waste the work.
function allowed(c: CardRow, { newLeft, reviewsLeft }: Allowance) {
  if (c.state === State.New) return newLeft > 0
  if (c.state === State.Review) return reviewsLeft > 0
  return true
}

// New cards come in deck order, or shuffled by `shuffleSeed`: a per-session
// seed keeps the order stable while studying, and different next session.
// `preferKey` puts one card first, as when a rating is undone.
export function nextCard(
  cards: CardRow[],
  now: Date,
  {
    skipKey,
    preferKey,
    shuffleSeed,
    allowance = NO_LIMIT,
  }: {
    skipKey?: string
    preferKey?: string
    shuffleSeed?: string
    allowance?: Allowance
  } = {}
) {
  if (preferKey) {
    const preferred = cards.find((c) => c.key === preferKey)
    if (preferred) return preferred
  }
  const eligible = cards.filter((c) => allowed(c, allowance))
  const due = eligible.filter((c) => c.due <= now)
  const pool = due.length
    ? due
    : eligible.filter(
        (c) =>
          (c.state === State.Learning || c.state === State.Relearning) &&
          c.due.getTime() <= now.getTime() + LEARN_AHEAD_MS
      )
  const newRank = (c: CardRow) =>
    shuffleSeed === undefined ? c.index : fnv1a(shuffleSeed + c.key)
  // Reviews and learning cards by due date, then new cards.
  pool.sort((a, b) => {
    const aNew = a.state === State.New
    const bNew = b.state === State.New
    if (aNew !== bNew) return aNew ? 1 : -1
    return aNew ? newRank(a) - newRank(b) : a.due.getTime() - b.due.getTime()
  })
  return pool.find((c) => c.key !== skipKey) ?? pool[0]
}

// What's left to study today: new cards and due reviews within today's limits,
// and every card still in its learning steps (they come back this session).
export function countToday(
  cards: CardRow[],
  now: Date,
  allowance: Allowance = NO_LIMIT
) {
  let fresh = 0
  let review = 0
  let learning = 0
  for (const c of cards) {
    if (c.state === State.New) fresh++
    else if (c.state === State.Review) {
      if (c.due <= now) review++
    } else learning++
  }
  return {
    new: Math.min(fresh, allowance.newLeft),
    review: Math.min(review, allowance.reviewsLeft),
    learning,
  }
}

function fnv1a(str: string) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}
