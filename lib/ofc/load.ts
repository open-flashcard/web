import type { Deck } from "./types"

// Structural checks only — enough to render safely and give a useful error.
// Full validation against schema.json can replace this later.
export function parseDeck(json: string): Deck {
  let doc: unknown
  try {
    doc = JSON.parse(json)
  } catch (e) {
    throw new Error(`Not valid JSON: ${(e as Error).message}`)
  }

  if (!isObject(doc)) throw new Error("A deck must be a JSON object.")

  const version = doc.openflashcard
  if (typeof version !== "string") {
    throw new Error("Missing `openflashcard` version — is this an OFC deck?")
  }
  if (version.split(".")[0] !== "1") {
    throw new Error(`Unsupported OFC version ${version}; this app reads 1.x.`)
  }
  if (typeof doc.name !== "string") throw new Error("Deck is missing `name`.")
  if (!Array.isArray(doc.cards)) throw new Error("Deck is missing `cards`.")

  doc.cards.forEach((card, i) => {
    if (!isObject(card) || !Array.isArray(card.front) || !card.front.length) {
      throw new Error(`Card ${i + 1} has no \`front\`.`)
    }
  })

  return doc as unknown as Deck
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}
