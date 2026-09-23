"use client"

import type { ImageBlock, VideoBlock } from "@/lib/ofc/types"
import { useResolve } from "@/features/render/media-provider"
import { Unavailable } from "@/features/render/blocks/sourced"

export function Image({ block: b }: { block: ImageBlock }) {
  const src = useResolve()(b.src)
  return (
    <figure className="flex flex-col items-center gap-1">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary deck URLs
        <img
          src={src}
          alt={b.alt}
          width={b.width}
          height={b.height}
          className="max-h-80 w-auto rounded-md object-contain"
        />
      ) : (
        <Unavailable src={b.src} detail={b.alt || "Image"} />
      )}
      {b.caption && (
        <figcaption className="text-xs text-muted-foreground">
          {b.caption}
        </figcaption>
      )}
    </figure>
  )
}

export function Video({ block: b }: { block: VideoBlock }) {
  const resolve = useResolve()
  const src = resolve(b.src)
  if (!src) {
    return (
      <Unavailable src={b.src} detail={b.caption ?? b.transcript ?? "Video"} />
    )
  }
  return (
    <figure className="flex flex-col gap-1">
      <video
        src={withTimeRange(src, b.start, b.end)}
        controls={b.controls ?? true}
        loop={b.loop}
        // §8: autoplay is a request; wait for a user gesture instead.
        preload="metadata"
        poster={resolve(b.poster) ?? undefined}
        width={b.width}
        height={b.height}
        className="max-h-80 w-full rounded-md"
      />
      {b.caption && (
        <figcaption className="text-xs text-muted-foreground">
          {b.caption}
        </figcaption>
      )}
    </figure>
  )
}

function withTimeRange(src: string, start?: number, end?: number) {
  if (start === undefined && end === undefined) return src
  return `${src}#t=${start ?? 0}${end !== undefined ? `,${end}` : ""}`
}
