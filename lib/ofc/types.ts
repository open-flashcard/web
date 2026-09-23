// Types for Open Flashcard Standard 1.x documents.
// Mirrors ../schema/versions/v1.0.0/schema.json; `x-` extensions are carried through untyped.

export type Dir = "ltr" | "rtl" | "auto"

export interface Speech {
  lang?: string
  voice?: string
  rate?: number
  pitch?: number
  autoplay?: boolean
  text?: string
}

interface BlockBase {
  id?: string
  lang?: string
  dir?: Dir
  fallback?: string
}

// Blocks that take their payload inline as `text` or by reference as `src`.
interface Sourced {
  text?: string
  src?: string
  integrity?: string
}

interface Media {
  src: string
  mediaType?: string
  integrity?: string
  caption?: string
  transcript?: string
  start?: number
  end?: number
  controls?: boolean
  autoplay?: boolean
  loop?: boolean
}

export type TextBlock = BlockBase & {
  type: "text"
  text: string
  style?: "normal" | "h1" | "h2" | "h3" | "strong" | "em" | "quote" | "small"
  speech?: Speech
}
export type MarkdownBlock = BlockBase &
  Sourced & { type: "markdown"; speech?: Speech }
export type HtmlBlock = BlockBase & Sourced & { type: "html" }
export type LatexBlock = BlockBase &
  Sourced & { type: "latex"; display?: "block" | "inline" }
export type CodeBlock = BlockBase &
  Sourced & { type: "code"; syntax?: string; filename?: string }
export type MermaidBlock = BlockBase &
  Sourced & { type: "mermaid"; theme?: string; alt?: string }
export type ImageBlock = BlockBase & {
  type: "image"
  src: string
  alt: string
  caption?: string
  mediaType?: string
  integrity?: string
  width?: number
  height?: number
}
export type AudioBlock = BlockBase & Media & { type: "audio" }
export type VideoBlock = BlockBase &
  Media & { type: "video"; poster?: string; width?: number; height?: number }
export type EmbedBlock = BlockBase & {
  type: "embed"
  src: string
  provider: string
  fallback: string
  thumbnail?: string
  title?: string
  author?: string
  start?: number
  end?: number
  width?: number
  height?: number
}
export type ListBlock = BlockBase & {
  type: "list"
  items: (Block | Block[])[]
  marker?: "bullet" | "number" | "none"
  start?: number
}
export interface ChoiceOption {
  id?: string
  content: Block[]
  correct?: boolean
  feedback?: Block[]
}
export type ChoiceBlock = BlockBase & {
  type: "choice"
  options: ChoiceOption[]
  shuffle?: boolean
  explanation?: Block[]
}
export type ClozeBlock = BlockBase & {
  type: "cloze"
  text: string
  speech?: Speech
}
export type LinkBlock = BlockBase & {
  type: "link"
  href: string
  text?: string
  title?: string
}
export type CustomBlock = BlockBase & {
  type: "custom"
  plugin: string
  fallback: string
  data?: Record<string, unknown>
}

export type Block =
  | TextBlock
  | MarkdownBlock
  | HtmlBlock
  | LatexBlock
  | CodeBlock
  | MermaidBlock
  | ImageBlock
  | AudioBlock
  | VideoBlock
  | EmbedBlock
  | ListBlock
  | ChoiceBlock
  | ClozeBlock
  | LinkBlock
  | CustomBlock

export type Side = Block[]

export interface Card {
  id?: string
  front: Side
  back?: Side
  hint?: Side
  notes?: Side
  tags?: string[]
  lang?: string
  dir?: Dir
  created?: string
  updated?: string
}

export interface Author {
  name: string
  email?: string
  url?: string
}

export interface Deck {
  openflashcard: string
  id: string
  name: string
  cards: Card[]
  description?: string
  version?: string
  lang?: string
  dir?: Dir
  authors?: Author[]
  license?: string
  homepage?: string
  source?: string
  cover?: { src: string; alt?: string; mediaType?: string; integrity?: string }
  tags?: string[]
  created?: string
  updated?: string
}
