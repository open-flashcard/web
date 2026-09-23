"use client"

import DOMPurify from "dompurify"

// Deck HTML is always sanitized before it reaches the page (§6.3).
export function Html({ text }: { text: string }) {
  return (
    <div
      className="ofc-prose"
      dangerouslySetInnerHTML={{ __html: sanitize(text) }}
    />
  )
}

function sanitize(html: string) {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "form", "iframe", "object", "embed", "link"],
  })
}
