import Link from "next/link"
import { LanguagesIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { deckPath } from "@/lib/routes"
import type { DeckSummary } from "@/features/library/use-deck-summaries"

// Deck color comes from its id, so a deck keeps its color across sessions.
const HUES = [290, 350, 25, 60, 150, 200, 240]

export function deckHue(deckId: string) {
  let h = 0
  for (let i = 0; i < deckId.length; i++)
    h = (h * 31 + deckId.charCodeAt(i)) | 0
  return HUES[Math.abs(h) % HUES.length]
}

export function DeckCard({ deck, counts }: DeckSummary) {
  const hue = deckHue(deck.id)
  const seen = counts.total - counts.unseen
  const pct = counts.total ? Math.round((seen / counts.total) * 100) : 0
  const ready = counts.due + counts.new > 0

  return (
    <li
      className="group relative flex flex-col gap-4 overflow-hidden rounded-3xl border bg-card p-5 transition-shadow hover:shadow-lg hover:shadow-primary/5"
      style={{ "--deck": `oklch(0.65 0.17 ${hue})` } as React.CSSProperties}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1.5 bg-(--deck) opacity-80"
      />
      <Link
        href={deckPath(deck.id, "overview")}
        className="flex min-w-0 flex-col gap-1 after:absolute after:inset-0"
      >
        <span className="truncate font-heading text-lg leading-tight font-extrabold">
          {deck.name}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {deck.doc.lang && (
            <>
              <LanguagesIcon className="size-3.5" />
              <span className="uppercase">{deck.doc.lang}</span>
              <span>·</span>
            </>
          )}
          <span className="tabular-nums">{counts.total} cards</span>
        </span>
      </Link>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>{seen} seen</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-(--deck) transition-[width] duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Count value={counts.due} label="due" className="text-good" />
        <Count value={counts.new} label="new" className="text-state-new" />
        <Link
          href={deckPath(deck.id)}
          className={cn(
            buttonVariants({
              variant: ready ? "pop" : "outline",
              size: "sm",
            }),
            "relative z-10 ms-auto px-4"
          )}
        >
          {ready ? "Study" : "Done"}
        </Link>
      </div>
    </li>
  )
}

function Count({
  value,
  label,
  className,
}: {
  value: number
  label: string
  className?: string
}) {
  return (
    <span className="flex items-baseline gap-1 text-sm text-muted-foreground">
      <span
        className={cn(
          "font-heading text-base font-extrabold tabular-nums",
          value > 0 ? className : "text-muted-foreground"
        )}
      >
        {value}
      </span>
      {label}
    </span>
  )
}
