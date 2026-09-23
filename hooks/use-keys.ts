"use client"

import * as React from "react"

// Global single-key shortcuts. Space and Enter are left to whatever control has
// focus, so they still activate buttons, links and media.
export function useKeys(handlers: Record<string, () => void>) {
  const ref = React.useRef(handlers)
  React.useEffect(() => {
    ref.current = handlers
  })

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      const key = e.key === " " ? "Space" : e.key
      const handler = ref.current[key]
      if (!handler) return
      const target = e.target as HTMLElement
      if (target.closest("input, textarea, select")) return
      if (
        (key === "Space" || key === "Enter") &&
        target.closest("button, a, audio, video")
      ) {
        return
      }
      e.preventDefault()
      handler()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])
}
