"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useSelectedLayoutSegment } from "next/navigation"
import { useLiveQuery } from "dexie-react-hooks"

import { cn } from "@/lib/utils"
import { db, type DeckRow } from "@/lib/db"
import { deckIdFromParam, deckPath, type DeckTab } from "@/lib/routes"
import { PageHeader } from "@/components/page-header"
import { MediaProvider } from "@/features/render/media-provider"

const TABS: { tab: DeckTab; label: string }[] = [
  { tab: "overview", label: "Overview" },
  { tab: "study", label: "Study" },
  { tab: "browse", label: "Browse" },
  { tab: "settings", label: "Settings" },
]

const DeckContext = React.createContext<DeckRow | null>(null)

// The deck of the current /decks/[deckId] route. Only valid under DeckShell.
export function useDeck() {
  const deck = React.useContext(DeckContext)
  if (!deck) throw new Error("useDeck() used outside <DeckShell>")
  return deck
}

// Loads the route's deck once for every tab, with the header and tab bar.
export function DeckShell({ children }: { children: React.ReactNode }) {
  const params = useParams<{ deckId: string }>()
  const deckId = deckIdFromParam(params.deckId)
  // The deck's own page has no segment below it: that's the overview.
  const active = useSelectedLayoutSegment() ?? "overview"
  // `null` once the lookup finishes without a deck; `undefined` while loading.
  const deck = useLiveQuery(
    async () => (await db.decks.get(deckId)) ?? null,
    [deckId]
  )

  if (deck === undefined) return null
  if (deck === null) {
    return (
      <>
        <PageHeader title="Deck not found" />
        <p className="text-muted-foreground">
          This deck isn’t in this browser. It may have been deleted.
        </p>
      </>
    )
  }

  return (
    <DeckContext.Provider value={deck}>
      <div className="flex flex-col gap-3">
        <PageHeader title={deck.name} />
        <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {TABS.map(({ tab, label }) => (
            <Link
              key={tab}
              href={deckPath(deck.id, tab)}
              aria-current={active === tab ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 font-heading text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                active === tab &&
                  "bg-secondary text-secondary-foreground hover:bg-secondary"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <MediaProvider deckId={deck.id}>{children}</MediaProvider>
    </DeckContext.Provider>
  )
}
