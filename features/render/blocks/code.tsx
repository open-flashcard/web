import type { MermaidBlock } from "@/lib/ofc/types"
import { Sourced } from "@/features/render/blocks/sourced"

export function Code({ text, label }: { text: string; label?: string }) {
  return (
    <div dir="ltr" className="overflow-hidden rounded-md border bg-muted/50">
      {label && (
        <div className="border-b px-3 py-1 font-mono text-xs text-muted-foreground">
          {label}
        </div>
      )}
      <pre className="overflow-x-auto p-3 font-mono text-sm">
        <code>{text}</code>
      </pre>
    </div>
  )
}

// Rendered as source for now; a Mermaid renderer can slot in here.
export function Mermaid({ block }: { block: MermaidBlock }) {
  return (
    <Sourced block={block}>
      {(text) => (
        <figure className="flex flex-col gap-1">
          <Code text={text} label="mermaid" />
          {block.alt && (
            <figcaption className="text-xs text-muted-foreground">
              {block.alt}
            </figcaption>
          )}
        </figure>
      )}
    </Sourced>
  )
}
