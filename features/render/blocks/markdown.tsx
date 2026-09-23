"use client"

import ReactMarkdown from "react-markdown"

import type { MarkdownBlock } from "@/lib/ofc/types"
import type { SoundSlot } from "@/features/render/context"
import { Sourced } from "@/features/render/blocks/sourced"

export function Markdown({
  block,
  sound,
}: {
  block: MarkdownBlock
  sound: SoundSlot
}) {
  return (
    <Sourced block={block}>
      {(text) => (
        <div className="flex items-center gap-1">
          <div className="ofc-prose min-w-0">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
          {sound(plainText(text), block.speech)}
        </div>
      )}
    </Sourced>
  )
}

// Markdown source minus its syntax, for speaking.
function plainText(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/(\*\*|__|\*|_|~~|`)/g, "")
    .replace(/\s+/g, " ")
    .trim()
}
