"use client"

import * as React from "react"
import katex from "katex"

export function Latex({ text, inline }: { text: string; inline: boolean }) {
  const html = React.useMemo(
    () =>
      katex.renderToString(text, {
        displayMode: !inline,
        throwOnError: false,
        trust: false,
        maxExpand: 1000,
      }),
    [text, inline]
  )
  const Tag = inline ? "span" : "div"
  return <Tag dir="ltr" dangerouslySetInnerHTML={{ __html: html }} />
}
