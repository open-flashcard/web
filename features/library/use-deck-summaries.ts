"use client"

import { useLiveQuery } from "dexie-react-hooks"

import { db, type DeckRow } from "@/lib/db"
import { deckCounts } from "@/lib/db/decks"

export interface DeckSummary {
  deck: DeckRow
  counts: Awaited<ReturnType<typeof deckCounts>>
}

// Every deck with its card counts, by name.
export function useDeckSummaries(): DeckSummary[] | undefined {
  return useLiveQuery(async () => {
    const decks = await db.decks.toArray()
    const now = new Date()
    const summaries = await Promise.all(
      decks.map(async (deck) => ({
        deck,
        counts: await deckCounts(deck, now),
      }))
    )
    return summaries.sort((a, b) => a.deck.name.localeCompare(b.deck.name))
  })
}
