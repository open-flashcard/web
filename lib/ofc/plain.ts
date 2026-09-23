import type { Block, Card } from "./types"

// A card as plain text, for a language model to read: every block that has a
// textual form, with each side labelled. Media contribute their alt text or
// caption; cloze blanks are filled in, since the card is shown revealed.
export function cardText(card: Card) {
  const sides: [string, Block[] | undefined][] = [
    ["Front", card.front],
    ["Back", card.back],
    ["Hint", card.hint],
    ["Notes", card.notes],
  ]
  return sides
    .filter(([, blocks]) => blocks?.length)
    .map(([label, blocks]) => `## ${label}\n${blocksText(blocks!)}`)
    .join("\n\n")
}

function blocksText(blocks: Block[]): string {
  return blocks
    .map(blockText)
    .filter((t) => t.trim())
    .join("\n")
}

function blockText(b: Block): string {
  const tag = b.lang ? ` [${b.lang}]` : ""
  switch (b.type) {
    case "text":
      return b.text + tag
    case "markdown":
    case "html":
    case "latex":
    case "code":
    case "mermaid":
      return b.text ?? ""
    case "cloze":
      return b.text.replace(/\{\{([^|}]*)(?:\|[^}]*)?\}\}/g, "$1") + tag
    case "image":
      return `(image: ${b.alt})`
    case "audio":
    case "video":
      return b.transcript ?? b.caption ?? ""
    case "embed":
      return b.fallback
    case "list":
      return b.items
        .map((item) => `- ${blocksText(Array.isArray(item) ? item : [item])}`)
        .join("\n")
    case "choice":
      return b.options
        .map(
          (o) => `- ${blocksText(o.content)}${o.correct ? " (correct)" : ""}`
        )
        .join("\n")
    case "link":
      return b.text ?? b.href
    default:
      return b.fallback ?? ""
  }
}
