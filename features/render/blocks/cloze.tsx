"use client"

import * as React from "react"

import type { ClozeBlock } from "@/lib/ofc/types"
import { BlockContext, type SoundSlot } from "@/features/render/context"

type ClozePart = string | { answer: string; hint?: string }

// `{{answer}}` or `{{answer|hint}}`; `\{\{` is a literal brace pair (§6.13).
function parseCloze(text: string): ClozePart[] {
  const parts: ClozePart[] = []
  const re = /\\\{\\\{|\{\{([^{}]+)\}\}/g
  let last = 0
  for (const m of text.matchAll(re)) {
    parts.push(text.slice(last, m.index))
    if (m[1] === undefined) {
      parts.push("{{")
    } else {
      const [answer, hint] = m[1].split("|")
      parts.push({ answer, hint })
    }
    last = m.index + m[0].length
  }
  parts.push(text.slice(last))
  return parts
}

export function Cloze({
  block: b,
  sound,
}: {
  block: ClozeBlock
  sound: SoundSlot
}) {
  const { revealed } = React.useContext(BlockContext)
  const parts = React.useMemo(() => parseCloze(b.text), [b.text])
  const spoken = parts
    .map((p) => (typeof p === "string" ? p : p.answer))
    .join("")

  return (
    <p className="text-xl whitespace-pre-wrap">
      {parts.map((p, i) =>
        typeof p === "string" ? (
          p
        ) : revealed ? (
          <mark key={i} className="ofc-key">
            {p.answer}
          </mark>
        ) : (
          <span
            key={i}
            className="rounded border-b-2 border-primary px-2 text-muted-foreground"
          >
            {p.hint ?? "   "}
          </span>
        )
      )}
      {/* Any sound would give the answer away, so it waits for the reveal. */}
      {revealed && <span data-cloze>{sound(spoken, b.speech)}</span>}
    </p>
  )
}
