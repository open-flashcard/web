"use client"

import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"

import { db } from "@/lib/db"
import { resolveMedia } from "@/lib/ofc/resolve"

const MediaContext = React.createContext<ReadonlyMap<string, string>>(new Map())

// Serves a deck's imported package files to its blocks as object URLs.
export function MediaProvider({
  deckId,
  children,
}: {
  deckId: string
  children: React.ReactNode
}) {
  const rows = useLiveQuery(
    () => db.media.where("deckId").equals(deckId).toArray(),
    [deckId]
  )
  const urls = React.useMemo(
    () => new Map(rows?.map((r) => [r.path, URL.createObjectURL(r.blob)])),
    [rows]
  )
  React.useEffect(
    () => () => urls.forEach((url) => URL.revokeObjectURL(url)),
    [urls]
  )

  if (!rows) return null
  return <MediaContext.Provider value={urls}>{children}</MediaContext.Provider>
}

export function useResolve() {
  const local = React.useContext(MediaContext)
  return React.useCallback(
    (src: string | undefined) => resolveMedia(src, local),
    [local]
  )
}
