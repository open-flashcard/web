"use client"

import * as React from "react"
import { ImageOffIcon } from "lucide-react"

import { useResolve } from "@/features/render/media-provider"

// Blocks whose payload is inline `text` or fetched from `src`.
export function Sourced({
  block,
  children,
}: {
  block: { text?: string; src?: string }
  children: (text: string) => React.ReactNode
}) {
  const result = useSourceText(block)
  if ("text" in result) return children(result.text)
  if ("loading" in result) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }
  return <Unavailable src={block.src} detail={result.error} />
}

type SourceResult = { text: string } | { loading: true } | { error: string }

function useSourceText(block: { text?: string; src?: string }): SourceResult {
  const resolve = useResolve()
  const url = block.text === undefined ? resolve(block.src) : null
  const [fetched, setFetched] = React.useState<
    { url: string } & ({ text: string } | { error: string })
  >()

  React.useEffect(() => {
    if (!url) return
    let cancelled = false
    fetch(url)
      .then((r) =>
        r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))
      )
      .then(
        (text) => !cancelled && setFetched({ url, text }),
        (e: Error) => !cancelled && setFetched({ url, error: e.message })
      )
    return () => {
      cancelled = true
    }
  }, [url])

  if (block.text !== undefined) return { text: block.text }
  if (!url) return { error: `Not available: ${block.src}` }
  if (fetched?.url !== url) return { loading: true }
  return fetched
}

export function Unavailable({ src, detail }: { src?: string; detail: string }) {
  return (
    <div
      title={src ? `Not available: ${src}` : undefined}
      className="flex w-full items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground"
    >
      <ImageOffIcon className="size-4 shrink-0" />
      <span className="min-w-0">{detail}</span>
    </div>
  )
}
