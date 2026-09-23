"use client"

import * as React from "react"
import "katex/dist/katex.min.css"

import { cn } from "@/lib/utils"
import { directionOf } from "@/lib/ofc/resolve"
import type { AudioBlock, Block, Dir, Speech } from "@/lib/ofc/types"
import { BlockContext } from "@/features/render/context"
import { useResolve } from "@/features/render/media-provider"
import { AudioButton, Speak } from "@/features/render/sound"
import { Choice } from "@/features/render/blocks/choice"
import { Cloze } from "@/features/render/blocks/cloze"
import { Code, Mermaid } from "@/features/render/blocks/code"
import { Embed } from "@/features/render/blocks/embed"
import { Fallback } from "@/features/render/blocks/fallback"
import { Html } from "@/features/render/blocks/html"
import { Latex } from "@/features/render/blocks/latex"
import { Link } from "@/features/render/blocks/link"
import { List } from "@/features/render/blocks/list"
import { Markdown } from "@/features/render/blocks/markdown"
import { Image, Video } from "@/features/render/blocks/media"
import { Sourced } from "@/features/render/blocks/sourced"
import { TextStyle } from "@/features/render/blocks/text"

// One side of a card (front, back, hint or notes): its blocks, in order.
export function Side({
  blocks,
  revealed,
  lang,
  dir,
  className,
  side,
}: {
  blocks: Block[]
  revealed: boolean
  lang?: string
  dir?: Dir
  className?: string
  side?: "front" | "back" | "hint" | "notes"
}) {
  return (
    <BlockContext.Provider
      value={{ revealed, lang, dir: directionOf(lang, dir) ?? "ltr" }}
    >
      <div
        lang={lang}
        dir={directionOf(lang, dir)}
        data-side={side}
        className={cn("flex flex-col gap-4", className)}
      >
        <BlockList blocks={blocks} />
      </div>
    </BlockContext.Provider>
  )
}

// Nested blocks: list items, choice options, feedback and explanations.
export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-col gap-3">
      <BlockList blocks={blocks} />
    </div>
  )
}

const TEXTUAL = new Set(["text", "markdown", "cloze"])

// An audio block straight after a textual one is that text's sound, so it renders
// as a button at the end of the line rather than as a block of its own.
function BlockList({ blocks }: { blocks: Block[] }) {
  const items: { block: Block; audio: AudioBlock[] }[] = []
  for (const block of blocks) {
    const prev = items.at(-1)
    if (block.type === "audio" && prev && TEXTUAL.has(prev.block.type)) {
      prev.audio.push(block)
    } else {
      items.push({ block, audio: [] })
    }
  }
  return items.map(({ block, audio }, i) => (
    <BlockView key={block.id ?? i} block={block} audio={audio} />
  ))
}

function BlockView({ block, audio }: { block: Block; audio: AudioBlock[] }) {
  const ctx = React.useContext(BlockContext)
  const inner = <BlockBody block={block} audio={audio} />
  if (!block.lang && !block.dir) return inner
  const dir = directionOf(block.lang, block.dir)
  return (
    <BlockContext.Provider
      value={{ ...ctx, lang: block.lang ?? ctx.lang, dir: dir ?? ctx.dir }}
    >
      <div lang={block.lang} dir={dir}>
        {inner}
      </div>
    </BlockContext.Provider>
  )
}

function BlockBody({ block: b, audio }: { block: Block; audio: AudioBlock[] }) {
  const { lang, sound: soundAllowed = true } = React.useContext(BlockContext)
  const resolve = useResolve()

  // Two separate sounds sit at the end of a textual line: the speaker reads the
  // text aloud (TTS), and the play button plays an audio block that follows it.
  // Only a block marked with `speech` is speakable (§6.16); the deck decides,
  // so headings, glosses and notation stay silent unless the author says otherwise.
  const sound = (text: string, speech?: Speech) => {
    if (!soundAllowed) return null
    if (!speech && !audio.length) return null
    return (
      <span className="ms-1 inline-flex align-middle">
        {speech && <Speak text={text} lang={lang} speech={speech} />}
        {audio.map((a, i) => (
          <AudioButton key={i} block={a} src={resolve(a.src)} />
        ))}
      </span>
    )
  }

  switch (b.type) {
    case "text":
      return (
        <TextStyle style={b.style}>
          {b.text}
          {sound(b.text, b.speech)}
        </TextStyle>
      )
    case "markdown":
      return <Markdown block={b} sound={sound} />
    case "html":
      return <Sourced block={b}>{(text) => <Html text={text} />}</Sourced>
    case "latex":
      return (
        <Sourced block={b}>
          {(text) => <Latex text={text} inline={b.display === "inline"} />}
        </Sourced>
      )
    case "code":
      return (
        <Sourced block={b}>
          {(text) => <Code text={text} label={b.filename ?? b.syntax} />}
        </Sourced>
      )
    case "mermaid":
      return <Mermaid block={b} />
    case "image":
      return <Image block={b} />
    case "audio":
      return <AudioButton block={b} src={resolve(b.src)} showTranscript />
    case "video":
      return <Video block={b} />
    case "embed":
      return <Embed block={b} />
    case "list":
      return <List block={b} />
    case "choice":
      return <Choice block={b} />
    case "cloze":
      return <Cloze block={b} sound={sound} />
    case "link":
      return <Link block={b} />
    default:
      return <Fallback block={b} />
  }
}
