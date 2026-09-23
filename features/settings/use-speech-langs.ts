"use client"

import { useLiveQuery } from "dexie-react-hooks"

import { db } from "@/lib/db"
import type { Block, Card } from "@/lib/ofc/types"

// The languages the imported decks ask to have spoken — every block with
// `speech`, in its own language (speech.lang, then block, card, deck) — with
// how many lines each has, most first.
export function useSpeechLanguages() {
  return useLiveQuery(async () => {
    const counts = new Map<string, number>()
    const add = (lang?: string) => {
      if (!lang) return
      const tag = lang.toLowerCase()
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }

    function walk(blocks: Block[] | undefined, lang?: string) {
      for (const b of blocks ?? []) {
        const own = b.lang ?? lang
        if ("speech" in b && b.speech) add(b.speech.lang ?? own)
        if (b.type === "list") {
          for (const item of b.items)
            walk(Array.isArray(item) ? item : [item], own)
        }
      }
    }

    for (const deck of await db.decks.toArray()) {
      for (const card of deck.doc.cards as Card[]) {
        const lang = card.lang ?? deck.doc.lang
        for (const side of [card.front, card.back, card.hint, card.notes]) {
          walk(side, lang)
        }
      }
    }
    return [...counts.entries()]
      .map(([tag, lines]) => ({ tag, lines }))
      .sort((a, b) => b.lines - a.lines)
  })
}
