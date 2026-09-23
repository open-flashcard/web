import Dexie from "dexie"
import { createEmptyCard, State } from "ts-fsrs"

import { db, type DeckRow } from "@/lib/db"
import { allowanceFor, usedToday } from "@/lib/fsrs/limits"
import { effectiveSettings, loadStudyDefaults } from "@/lib/settings"
import { cardKeys } from "@/lib/ofc/card-key"
import type { Deck } from "@/lib/ofc/types"

// `media` replaces the deck's stored files when given (a package import); a bare
// JSON re-import leaves previously imported media in place.
export async function importDeck(
  deck: Deck,
  media?: { path: string; blob: Blob }[]
) {
  const keys = cardKeys(deck.cards)
  const wanted = new Set(keys)
  const now = new Date()

  return db.transaction("rw", db.decks, db.cards, db.media, async () => {
    if (media) {
      await db.media.where("deckId").equals(deck.id).delete()
      await db.media.bulkPut(media.map((m) => ({ ...m, deckId: deck.id })))
    }

    const existing = await db.decks.get(deck.id)
    await db.decks.put({
      id: deck.id,
      name: deck.name,
      doc: deck,
      importedAt: existing?.importedAt ?? now,
      updatedAt: now,
      settings: existing?.settings,
    })

    const previous = new Map(
      (await db.cards.where("deckId").equals(deck.id).toArray()).map((c) => [
        c.key,
        c,
      ])
    )
    const removed = [...previous.keys()].filter((k) => !wanted.has(k))
    await db.cards.bulkDelete(removed.map((k) => [deck.id, k]))
    await db.cards.bulkPut(
      keys.map((key, index) => ({
        ...(previous.get(key) ?? createEmptyCard(now)),
        deckId: deck.id,
        key,
        index,
      }))
    )

    return {
      replaced: Boolean(existing),
      added: keys.filter((k) => !previous.has(k)).length,
      kept: keys.filter((k) => previous.has(k)).length,
      removed: removed.length,
      media: media?.length ?? 0,
    }
  })
}

export async function deleteDeck(deckId: string) {
  await db.transaction(
    "rw",
    [db.decks, db.cards, db.reviews, db.media],
    async () => {
      await db.decks.delete(deckId)
      await db.media.where("deckId").equals(deckId).delete()
      await db.cards.where("deckId").equals(deckId).delete()
      await db.reviews.where("deckId").equals(deckId).delete()
    }
  )
}

// A deck's counts for today, read from indexes. `new` and `due` are what's
// left to study today within its per-day limits; `unseen` is every new card.
export async function deckCounts(deck: DeckRow, now: Date) {
  const deckId = deck.id
  const [settings, used, total, unseen, reviewDue, learning] =
    await Promise.all([
      loadStudyDefaults().then((d) => effectiveSettings(d, deck)),
      usedToday(deckId, now),
      db.cards.where("deckId").equals(deckId).count(),
      db.cards.where("[deckId+state]").equals([deckId, State.New]).count(),
      db.cards
        .where("[deckId+due]")
        .between([deckId, Dexie.minKey], [deckId, now], true, true)
        .filter((c) => c.state === State.Review)
        .count(),
      db.cards
        .where("deckId")
        .equals(deckId)
        .filter(
          (c) => c.state === State.Learning || c.state === State.Relearning
        )
        .count(),
    ])
  const { newLeft, reviewsLeft } = allowanceFor(settings, used)
  return {
    total,
    unseen,
    new: Math.min(unseen, newLeft),
    due: learning + Math.min(reviewDue, reviewsLeft),
  }
}

// How many of a deck's cards are in each FSRS state, and how many are mature
// (scheduled three weeks or more ahead).
export async function deckStates(deckId: string) {
  const byState = (state: State) =>
    db.cards.where("[deckId+state]").equals([deckId, state]).count()
  const [fresh, learning, review, relearning, mature] = await Promise.all([
    byState(State.New),
    byState(State.Learning),
    byState(State.Review),
    byState(State.Relearning),
    db.cards
      .where("[deckId+state]")
      .equals([deckId, State.Review])
      .filter((c) => c.scheduled_days >= 21)
      .count(),
  ])
  return { new: fresh, learning, review, relearning, mature }
}
