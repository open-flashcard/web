"use client"

import { ExternalLinkIcon } from "lucide-react"

import { safeHref } from "@/lib/ofc/resolve"
import type { EmbedBlock } from "@/lib/ofc/types"
import { useResolve } from "@/features/render/media-provider"

export function Embed({ block: b }: { block: EmbedBlock }) {
  const thumb = useResolve()(b.thumbnail)
  const href = safeHref(b.src)
  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      {thumb && (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary deck URLs
        <img src={thumb} alt="" className="max-h-60 rounded object-contain" />
      )}
      {b.title && (
        <div className="font-medium">
          {b.title}
          {b.author && (
            <span className="font-normal text-muted-foreground">
              {" "}
              · {b.author}
            </span>
          )}
        </div>
      )}
      <p className="text-sm">{b.fallback}</p>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 self-start text-sm text-primary underline underline-offset-4"
        >
          Open on {b.provider}
          <ExternalLinkIcon className="size-3.5" />
        </a>
      )}
    </div>
  )
}
