import * as React from "react"

// A per-browser setting in localStorage that components can subscribe to.
// `read` turns the saved JSON (or undefined) into a full value; `server` is what
// the server renders, so hydration matches before the browser's value applies.
export function localStore<T>(
  key: string,
  read: (saved: unknown) => T,
  server: T
) {
  const listeners = new Set<() => void>()
  let cache: { raw: string | null; value: T } | undefined

  function get(): T {
    let raw: string | null = null
    try {
      raw = localStorage.getItem(key)
    } catch {}
    if (!cache || cache.raw !== raw) {
      let saved: unknown
      try {
        saved = raw ? JSON.parse(raw) : undefined
      } catch {}
      cache = { raw, value: read(saved) }
    }
    return cache.value
  }

  function set(value: T) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {}
    cache = undefined
    listeners.forEach((l) => l())
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  function use(): T {
    return React.useSyncExternalStore(subscribe, get, () => server)
  }

  return { get, set, subscribe, use }
}
