"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useKeys } from "@/hooks/use-keys"
import { useDeck } from "@/features/deck/deck-shell"
import { CardAssist } from "@/features/assist/card-assist"
import { CardView } from "@/features/render/card-view"

// Flip through a deck in order without touching review history.
export function Browse() {
  const deck = useDeck().doc
  const [index, setIndex] = React.useState(0)
  const [revealed, setRevealed] = React.useState(false)
  const [hintShown, setHintShown] = React.useState(false)

  const total = deck.cards.length
  const card = deck.cards[index]

  function go(delta: number) {
    setIndex((i) => Math.min(Math.max(i + delta, 0), total - 1))
    setRevealed(false)
    setHintShown(false)
  }

  useKeys({
    ArrowRight: () => go(1),
    ArrowLeft: () => go(-1),
    Space: () => setRevealed(true),
    Enter: () => setRevealed(true),
    h: () => setHintShown(true),
  })

  if (!card) {
    return <p className="text-muted-foreground">This deck has no cards.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground tabular-nums">
        Card {index + 1} of {total}
      </p>
      <CardView
        key={index}
        deck={deck}
        card={card}
        revealed={revealed}
        hintShown={hintShown}
        onShowHint={() => setHintShown(true)}
        showTags
      />
      {revealed && (
        <CardAssist key={`assist-${index}`} deck={deck} card={card} />
      )}
      <nav className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous card"
          disabled={index === 0}
          onClick={() => go(-1)}
        >
          <ChevronLeftIcon />
        </Button>
        {!revealed ? (
          <Button onClick={() => setRevealed(true)}>
            {card.back ? "Show answer" : "Reveal"}
          </Button>
        ) : index < total - 1 ? (
          <Button onClick={() => go(1)}>Next card</Button>
        ) : (
          <span className="text-sm text-muted-foreground">End of deck</span>
        )}
        <Button
          variant="outline"
          size="icon"
          aria-label="Next card"
          disabled={index === total - 1}
          onClick={() => go(1)}
        >
          <ChevronRightIcon />
        </Button>
      </nav>
      <p className="text-center text-xs text-muted-foreground">
        Space to reveal · ← → to move · H for hint
      </p>
    </div>
  )
}
