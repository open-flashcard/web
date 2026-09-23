// Deck ids are URIs ("urn:ofc:deck:ryan/hello"), so they travel as one encoded
// path segment.

export type DeckTab = "overview" | "study" | "browse" | "settings"

export function deckPath(deckId: string, tab: DeckTab = "study") {
  const base = `/decks/${encodeURIComponent(deckId)}`
  return tab === "overview" ? base : `${base}/${tab}`
}

// Route params may arrive encoded or already decoded, depending on the caller.
export function deckIdFromParam(param: string) {
  try {
    return decodeURIComponent(param)
  } catch {
    return param
  }
}
