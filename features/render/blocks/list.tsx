"use client"

import { cn } from "@/lib/utils"
import type { ListBlock } from "@/lib/ofc/types"
import { Blocks } from "@/features/render/side"

export function List({ block: b }: { block: ListBlock }) {
  const marker = b.marker ?? "bullet"
  const Tag = marker === "number" ? "ol" : "ul"
  return (
    <Tag
      start={marker === "number" ? b.start : undefined}
      className={cn(
        "flex flex-col gap-1 ps-6",
        marker === "bullet" && "list-disc",
        marker === "number" && "list-decimal",
        marker === "none" && "list-none ps-0"
      )}
    >
      {b.items.map((item, i) => (
        <li key={i}>
          <Blocks blocks={Array.isArray(item) ? item : [item]} />
        </li>
      ))}
    </Tag>
  )
}
