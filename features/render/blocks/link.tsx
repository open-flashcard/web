import { ExternalLinkIcon } from "lucide-react"

import { safeHref } from "@/lib/ofc/resolve"
import type { LinkBlock } from "@/lib/ofc/types"

export function Link({ block: b }: { block: LinkBlock }) {
  const href = safeHref(b.href)
  const label = b.text ?? b.href
  if (!href) return <span className="text-muted-foreground">{label}</span>
  return (
    <a
      href={href}
      title={b.title}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1 text-primary underline underline-offset-4"
    >
      {label}
      <ExternalLinkIcon className="size-3.5" />
    </a>
  )
}
