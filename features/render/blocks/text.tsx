import * as React from "react"

import { cn } from "@/lib/utils"
import type { TextBlock } from "@/lib/ofc/types"

type TextStyleName = NonNullable<TextBlock["style"]>

const TEXT_STYLES: Record<TextStyleName, string> = {
  normal: "text-base",
  h1: "text-3xl font-semibold tracking-tight",
  h2: "text-2xl font-semibold tracking-tight",
  h3: "text-xl font-semibold",
  strong: "text-base font-semibold",
  em: "text-base italic",
  quote: "border-s-2 ps-4 text-base italic text-muted-foreground",
  small: "text-sm text-muted-foreground",
}

export function TextStyle({
  style = "normal",
  children,
}: {
  style?: TextStyleName
  children: React.ReactNode
}) {
  const Tag = style === "quote" ? "blockquote" : "p"
  return (
    <Tag
      className={cn(
        "whitespace-pre-wrap",
        TEXT_STYLES[style] ?? TEXT_STYLES.normal
      )}
    >
      {children}
    </Tag>
  )
}
