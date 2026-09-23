import type { Card } from "./types"

// A card's identity across re-imports: its `id` when the author gave one, otherwise a hash
// of its front. Reordering keeps history; editing an id-less front starts that card fresh.
export function cardKeys(cards: Card[]): string[] {
  const seen = new Map<string, number>()
  return cards.map((card) => {
    const base = card.id
      ? `id:${card.id}`
      : `front:${hash(canonical(card.front))}`
    // Two id-less cards with the same front would otherwise share one history.
    const n = (seen.get(base) ?? 0) + 1
    seen.set(base, n)
    return n === 1 ? base : `${base}#${n}`
  })
}

// JSON with sorted keys, so reformatting a deck doesn't change its hashes.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`
  if (value && typeof value === "object") {
    const entries = Object.entries(value).sort(([a], [b]) => (a < b ? -1 : 1))
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`
  }
  return JSON.stringify(value)
}

// cyrb53: fast 53-bit string hash. Sync and available without a secure context.
function hash(str: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}
