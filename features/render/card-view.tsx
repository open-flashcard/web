"use client"

import { LightbulbIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Side } from "@/features/render/side"
import type { Card, Deck } from "@/lib/ofc/types"

export function CardView({
  deck,
  card,
  revealed,
  hintShown,
  onShowHint,
  showTags,
}: {
  deck: Deck
  card: Card
  revealed: boolean
  hintShown: boolean
  onShowHint: () => void
  showTags?: boolean
}) {
  const lang = card.lang ?? deck.lang
  const dir = card.dir ?? deck.dir
  const side = { revealed, lang, dir }

  return (
    <div className="flex flex-col gap-3">
      <article className="flex flex-col gap-6 rounded-3xl border-2 bg-card p-6 shadow-[0_4px_0_0_var(--color-border)] sm:p-8">
        <Side blocks={card.front} {...side} side="front" />

        {card.hint && hintShown && (
          <Side
            blocks={card.hint}
            side="hint"
            {...side}
            className="rounded-md bg-muted/50 p-3 text-sm"
          />
        )}
        {card.hint && !hintShown && !revealed && (
          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={onShowHint}
          >
            <LightbulbIcon data-icon="inline-start" />
            Hint
          </Button>
        )}

        {revealed && card.back && (
          <Side
            blocks={card.back}
            {...side}
            side="back"
            className="border-t pt-6"
          />
        )}
        {revealed && card.notes && (
          <Side
            blocks={card.notes}
            side="notes"
            {...side}
            className="rounded-md bg-muted/50 p-3 text-sm"
          />
        )}
      </article>

      {showTags && card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {card.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
