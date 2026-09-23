"use client"

import * as React from "react"
import Markdown from "react-markdown"
import {
  LanguagesIcon,
  LightbulbIcon,
  QuoteIcon,
  SquareIcon,
  XIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { streamReply, useLlmSettings, type LlmSettings } from "@/lib/llm"
import { cardText } from "@/lib/ofc/plain"
import type { Card, Deck } from "@/lib/ofc/types"
import { languageName } from "@/features/settings/llm-settings"

type Action = "explain" | "example" | "translate"

const ACTIONS: { action: Action; label: string; icon: typeof LightbulbIcon }[] =
  [
    { action: "explain", label: "Explain", icon: LightbulbIcon },
    { action: "example", label: "Example", icon: QuoteIcon },
    { action: "translate", label: "Translate", icon: LanguagesIcon },
  ]

// What each button asks. Written for any deck — vocabulary, science, code —
// since the card's content decides what a good answer looks like.
const ASK: Record<Action, (language: string) => string> = {
  explain: () =>
    "Explain this flashcard: what it means, why the answer is what it is, and one thing that helps remember it. Keep it under 120 words.",
  example: () =>
    "Give 3 fresh examples of what this card teaches, at the same level. For a vocabulary card, write new sentences that use the word, each followed by its translation. Keep the list short.",
  // Small models answer "translate" with the original unless told the target.
  translate: (language) =>
    `Translate this text into ${language}. Give the ${language} translation first, then a short word-by-word gloss if it helps a learner.`,
}

function prompts(action: Action, deck: Deck, card: Card, reply: string) {
  const language = languageName(reply)
  const topic = [deck.name, deck.lang && `language: ${languageName(deck.lang)}`]
    .filter(Boolean)
    .join(", ")
  return {
    system: `You help someone study flashcards (deck: ${topic}). Reply in ${language}. Be brief and concrete; use Markdown only for short lists or emphasis.`,
    // Translate works on the front alone: a small model given the whole card
    // tends to echo it back rather than translate.
    prompt: `${ASK[action](language)}\n\n${
      action === "translate" ? cardText({ front: card.front }) : cardText(card)
    }`,
  }
}

// Answers already given this session, so reopening one costs no request.
const answers = new Map<string, string>()

// Explain / Example / Translate under a revealed card, answered by the
// configured language model. Hidden when no model is set up.
export function CardAssist({ deck, card }: { deck: Deck; card: Card }) {
  const settings = useLlmSettings()
  const [open, setOpen] = React.useState<Action>()
  if (!settings.enabled || !settings.model) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map(({ action, label, icon: Icon }) => (
          <Button
            key={action}
            variant={open === action ? "secondary" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setOpen(open === action ? undefined : action)}
          >
            <Icon data-icon="inline-start" />
            {label}
          </Button>
        ))}
      </div>
      {open && (
        <Answer
          key={open}
          action={open}
          deck={deck}
          card={card}
          settings={settings}
          onClose={() => setOpen(undefined)}
        />
      )}
    </div>
  )
}

function Answer({
  action,
  deck,
  card,
  settings,
  onClose,
}: {
  action: Action
  deck: Deck
  card: Card
  settings: LlmSettings
  onClose: () => void
}) {
  const key = [
    deck.id,
    card.id ?? JSON.stringify(card.front),
    action,
    settings.url,
    settings.model,
    settings.replyLang,
  ].join("\u0000")
  const [text, setText] = React.useState(() => answers.get(key) ?? "")
  const [state, setState] = React.useState<"streaming" | "done" | "error">(
    answers.has(key) ? "done" : "streaming"
  )
  const [error, setError] = React.useState<string>()
  const abort = React.useRef<AbortController>(null)

  React.useEffect(() => {
    if (answers.has(key)) return
    const controller = new AbortController()
    abort.current = controller
    // Started a tick later, so React's development double-mount cancels the
    // timer rather than an in-flight request.
    const start = setTimeout(() =>
      streamReply(
        settings,
        prompts(action, deck, card, settings.replyLang),
        setText,
        controller.signal
      ).then(
        (full) => {
          // A stopped or unmounted answer is partial; only whole ones are kept.
          if (controller.signal.aborted) return
          answers.set(key, full)
          setState("done")
        },
        (e: Error) => {
          if (controller.signal.aborted) return
          setError(e.message)
          setState("error")
        }
      )
    )
    return () => {
      clearTimeout(start)
      controller.abort()
    }
    // One request per mounted answer; `key` covers every input that matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return (
    <section
      aria-live="polite"
      className="relative flex animate-card-in flex-col gap-2 rounded-2xl border-2 border-primary/20 bg-secondary/40 p-4 pe-10 text-sm"
    >
      <div className="absolute end-2 top-2 flex">
        {state === "streaming" && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Stop"
            onClick={() => {
              abort.current?.abort()
              setState("done")
            }}
          >
            <SquareIcon className="size-3 fill-current" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close"
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </div>
      {state === "error" ? (
        <p className="text-destructive">
          The language model didn’t answer: {error}. Check it in Settings.
        </p>
      ) : (
        <div
          dir="auto"
          lang={settings.replyLang}
          className={cn(
            "ofc-prose",
            state === "streaming" && !text && "animate-pulse"
          )}
        >
          <Markdown>{text || "Thinking…"}</Markdown>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{settings.model}</p>
    </section>
  )
}
