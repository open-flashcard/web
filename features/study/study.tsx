"use client"

import * as React from "react"

import { useKeys } from "@/hooks/use-keys"
import { useDeck } from "@/features/deck/deck-shell"
import { SessionBar } from "@/features/study/session-bar"
import { StudyCard } from "@/features/study/study-card"
import { NothingDue, Summary } from "@/features/study/summary"
import { useSession } from "@/features/study/use-session"

export function Study() {
  const deck = useDeck()
  const session = useSession(deck)
  const { ready, current, stats } = session
  // The summary stays up once shown, even when learning cards come due
  // again; "Keep going" goes back to them.
  const [summary, setSummary] = React.useState(false)
  if (ready && !current && stats.done > 0 && !summary) setSummary(true)

  useKeys({ z: () => session.canUndo && session.undo() })

  if (!ready || !session.scheduler) return null

  if (summary) {
    return (
      <Summary
        deckId={deck.id}
        stats={stats}
        canContinue={Boolean(current)}
        onContinue={() => setSummary(false)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <SessionBar deckId={deck.id} session={session} />
      {current ? (
        <StudyCard
          key={`${current.key}:${session.step}`}
          deck={deck}
          row={current}
          now={session.now}
          scheduler={session.scheduler}
          settings={session.settings!}
          onRate={(grade, ms) => session.rate(current, grade, ms)}
        />
      ) : (
        <NothingDue
          deckId={deck.id}
          cards={session.cards!}
          newLeft={session.allowance!.newLeft}
        />
      )}
    </div>
  )
}
