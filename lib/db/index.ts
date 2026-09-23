import Dexie, { type EntityTable, type Table } from "dexie"
import type { Card as FsrsCard, ReviewLog } from "ts-fsrs"

import type { Deck } from "@/lib/ofc/types"
import type { StudySettings } from "@/lib/settings"

// Everything lives in this browser's IndexedDB. Nothing is sent anywhere.

export interface DeckRow {
  id: string // the deck's own `id` URI
  name: string
  doc: Deck
  importedAt: Date
  updatedAt: Date
  settings?: Partial<StudySettings> // overrides of the app-wide study settings
}

// FSRS state for one card. `index` points into DeckRow.doc.cards.
export interface CardRow extends FsrsCard {
  deckId: string
  key: string
  index: number
}

// One row per rating, kept even when a card leaves the deck, so FSRS parameters
// can later be fitted to the full history.
export interface ReviewRow extends ReviewLog {
  id?: number
  deckId: string
  cardKey: string
  duration?: number // ms from the card appearing to its rating; absent on older reviews
}

// A media file from a deck package, keyed by its path relative to deck.json.
export interface MediaRow {
  deckId: string
  path: string
  blob: Blob
}

export interface SettingsRow {
  key: string
  value: unknown
}

// Generated speech, keyed by model, voice and text.
export interface TtsRow {
  key: string
  blob: Blob
  createdAt: Date
}

export const db = new Dexie("ofc") as Dexie & {
  decks: EntityTable<DeckRow, "id">
  cards: Table<CardRow, [string, string]>
  reviews: EntityTable<ReviewRow, "id">
  media: Table<MediaRow, [string, string]>
  tts: EntityTable<TtsRow, "key">
  settings: EntityTable<SettingsRow, "key">
}

db.version(1).stores({
  decks: "id",
  cards: "[deckId+key], deckId",
  reviews: "++id, deckId, [deckId+cardKey], review",
})
db.version(2).stores({
  media: "[deckId+path], deckId",
})
db.version(3).stores({
  tts: "key",
})
db.version(4).stores({
  settings: "key",
})
// Deck counts by index, without loading every card.
db.version(5).stores({
  cards: "[deckId+key], deckId, [deckId+state], [deckId+due]",
})
