import { useLiveQuery } from "dexie-react-hooks"

import { db, type DeckRow } from "@/lib/db"

// Study settings: app-wide defaults, which any deck may override field by field.
// They live in IndexedDB with the rest of the study data, never in deck files.

export interface StudySettings {
  autoplayFront: boolean // read the front aloud when a card appears
  autoplayAnswer: boolean // read the answer aloud on reveal
  retention: number // FSRS target retention, 0.7–0.99
  maxInterval: number // days
  newOrder: "deck" | "shuffled"
  newPerDay: number // new cards introduced per deck per day
  reviewsPerDay: number // review-state cards per deck per day; learning steps are never capped
}

// Stands for "no limit" in the per-day settings.
export const UNLIMITED = 99999

export const DEFAULT_STUDY: StudySettings = {
  autoplayFront: false,
  autoplayAnswer: false,
  retention: 0.9,
  maxInterval: 36500,
  newOrder: "deck",
  newPerDay: 20,
  reviewsPerDay: 200,
}

const STUDY_KEY = "study"

export async function loadStudyDefaults(): Promise<StudySettings> {
  const row = await db.settings.get(STUDY_KEY)
  return { ...DEFAULT_STUDY, ...(row?.value as Partial<StudySettings>) }
}

export function useStudyDefaults(): StudySettings | undefined {
  return useLiveQuery(loadStudyDefaults)
}

export async function saveStudyDefaults(value: StudySettings) {
  await db.settings.put({ key: STUDY_KEY, value })
}

// A deck's effective settings: its own overrides over the app-wide defaults.
export function effectiveSettings(
  defaults: StudySettings,
  deck: DeckRow
): StudySettings {
  return { ...defaults, ...definedOnly(deck.settings) }
}

export function useDeckSettings(deck: DeckRow): StudySettings | undefined {
  const defaults = useStudyDefaults()
  return defaults && effectiveSettings(defaults, deck)
}

export async function saveDeckSettings(
  deckId: string,
  settings: Partial<StudySettings>
) {
  // `modify` rather than `update`: Dexie's key-path typing for `update`
  // recurses into the deck document's block types and gives up.
  await db.decks
    .where("id")
    .equals(deckId)
    .modify((deck) => {
      deck.settings = definedOnly(settings)
    })
}

function definedOnly<T extends object>(value: T | undefined): Partial<T> {
  return Object.fromEntries(
    Object.entries(value ?? {}).filter(([, v]) => v !== undefined)
  ) as Partial<T>
}
