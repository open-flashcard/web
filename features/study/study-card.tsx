"use client"

import * as React from "react"
import { Rating, type FSRS, type Grade } from "ts-fsrs"

import { Button } from "@/components/ui/button"
import { useKeys } from "@/hooks/use-keys"
import type { CardRow, DeckRow } from "@/lib/db"
import { formatInterval } from "@/lib/fsrs/scheduler"
import type { StudySettings } from "@/lib/settings"
import { CardAssist } from "@/features/assist/card-assist"
import { CardView } from "@/features/render/card-view"

export const GRADES: {
  grade: Grade
  label: string
  key: string
  tone: string
}[] = [
  { grade: Rating.Again, label: "Again", key: "1", tone: "var(--again)" },
  { grade: Rating.Hard, label: "Hard", key: "2", tone: "var(--hard)" },
  { grade: Rating.Good, label: "Good", key: "3", tone: "var(--good)" },
  { grade: Rating.Easy, label: "Easy", key: "4", tone: "var(--easy)" },
]

export function StudyCard({
  deck,
  row,
  now,
  scheduler,
  settings,
  onRate,
}: {
  deck: DeckRow
  row: CardRow
  now: Date
  scheduler: FSRS
  settings: StudySettings
  onRate: (grade: Grade, ms: number) => void
}) {
  const [revealed, setRevealed] = React.useState(false)
  const [hintShown, setHintShown] = React.useState(false)
  const [shownAt] = React.useState(() => performance.now())
  const card = deck.doc.cards[row.index]
  const root = React.useRef<HTMLDivElement>(null)
  const lang = card.lang ?? deck.doc.lang

  // Auto-play presses the card's own sound buttons, so it plays exactly what a
  // click would. The refs keep React's dev double-effects from playing twice.
  const playedFront = React.useRef(false)
  React.useEffect(() => {
    if (!settings.autoplayFront || playedFront.current) return
    playedFront.current = true
    pressSound(root.current, ['[data-side="front"] [data-sound]'], lang)
  }, [settings.autoplayFront, lang])

  const playedAnswer = React.useRef(false)
  React.useEffect(() => {
    if (!revealed || !settings.autoplayAnswer || playedAnswer.current) return
    playedAnswer.current = true
    pressSound(
      root.current,
      // A cloze card's answer is its own filled-in sentence.
      ['[data-side="back"] [data-sound]', "[data-cloze] [data-sound]"],
      lang
    )
  }, [revealed, settings.autoplayAnswer, lang])

  const intervals = React.useMemo(() => {
    const preview = scheduler.repeat(row, now)
    return Object.fromEntries(
      GRADES.map(({ grade }) => [
        grade,
        formatInterval(preview[grade].card.due.getTime() - now.getTime()),
      ])
    ) as Record<Grade, string>
  }, [row, now, scheduler])

  // Saving a rating is async; ignore further input so one card can't be rated twice.
  const rated = React.useRef(false)
  function rate(grade: Grade) {
    if (rated.current) return
    rated.current = true
    onRate(grade, performance.now() - shownAt)
  }

  const reveal = () => setRevealed(true)
  useKeys({
    Space: reveal,
    Enter: reveal,
    h: () => setHintShown(true),
    ...(revealed &&
      Object.fromEntries(GRADES.map((g) => [g.key, () => rate(g.grade)]))),
  })

  return (
    <div ref={root} className="flex flex-col gap-5">
      <div className="animate-card-in">
        <CardView
          deck={deck.doc}
          card={card}
          revealed={revealed}
          hintShown={hintShown}
          onShowHint={() => setHintShown(true)}
        />
      </div>
      {revealed && <CardAssist deck={deck.doc} card={card} />}
      {/* On phones the answer controls stay under the thumb. */}
      <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 bg-background/90 px-4 pt-2 pb-4 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        {revealed ? (
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {GRADES.map(({ grade, label, key, tone }) => (
              <button
                key={grade}
                type="button"
                onClick={() => rate(grade)}
                style={{ "--tone": tone } as React.CSSProperties}
                className="pop-tone flex flex-col items-center gap-0.5 rounded-2xl py-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="font-heading text-base font-extrabold">
                  {label}
                </span>
                <span className="text-xs font-semibold tabular-nums opacity-85">
                  {intervals[grade]}
                  <kbd className="ms-1.5 hidden font-mono opacity-70 sm:inline">
                    {key}
                  </kbd>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <Button variant="pop" size="xl" className="w-full" onClick={reveal}>
            {card.back ? "Show answer" : "Reveal"}
          </Button>
        )}
        <p className="text-center text-xs text-muted-foreground max-sm:hidden">
          Space to reveal · 1–4 to rate · H for hint · Z to undo
        </p>
      </div>
    </div>
  )
}

// Clicks the first sound button matching the selectors, in order, preferring one
// in the deck's language (a French deck reads the French line, not the gloss).
function pressSound(
  root: HTMLElement | null,
  selectors: string[],
  lang?: string
) {
  if (!root) return
  const primary = (l?: string | null) => l?.split("-")[0].toLowerCase()
  for (const selector of selectors) {
    const buttons = [...root.querySelectorAll<HTMLButtonElement>(selector)]
    const button =
      buttons.find(
        (b) =>
          primary(b.closest("[lang]")?.getAttribute("lang")) === primary(lang)
      ) ?? buttons[0]
    if (button) {
      button.click()
      return
    }
  }
}
