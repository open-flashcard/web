"use client"

import Link from "next/link"
import { useLiveQuery } from "dexie-react-hooks"
import {
  ExternalLinkIcon,
  LanguagesIcon,
  LayersIcon,
  ScaleIcon,
  UserIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { deckCounts, deckStates } from "@/lib/db/decks"
import { safeHref } from "@/lib/ofc/resolve"
import { deckPath } from "@/lib/routes"
import { useDeck } from "@/features/deck/deck-shell"
import { useResolve } from "@/features/render/media-provider"

const STATES = [
  { key: "new", label: "New", tone: "bg-state-new" },
  { key: "learning", label: "Learning", tone: "bg-state-learning" },
  { key: "relearning", label: "Relearning", tone: "bg-state-relearning" },
  { key: "review", label: "Review", tone: "bg-state-review" },
] as const

export function Overview() {
  const deck = useDeck()
  const doc = deck.doc
  const counts = useLiveQuery(() => deckCounts(deck, new Date()), [deck])
  const states = useLiveQuery(() => deckStates(deck.id), [deck.id])
  const cover = useResolve()(doc.cover?.src)
  const homepage = doc.homepage ? safeHref(doc.homepage) : null
  if (!counts || !states) return null

  const ready = counts.due + counts.new > 0

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-5 rounded-3xl border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element -- deck media
          <img
            src={cover}
            alt={doc.cover?.alt ?? ""}
            className="size-24 shrink-0 rounded-2xl object-cover"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex gap-6">
            <Big value={counts.due} label="due" tone="text-good" />
            <Big value={counts.new} label="new" tone="text-state-new" />
            <Big value={counts.total} label="cards" />
          </div>
          {doc.description && (
            <p className="text-sm text-muted-foreground">{doc.description}</p>
          )}
        </div>
        <Link
          href={deckPath(deck.id)}
          className={cn(
            buttonVariants({ variant: ready ? "pop" : "outline", size: "xl" }),
            "sm:self-center"
          )}
        >
          {ready ? "Study now" : "Nothing due"}
        </Link>
      </section>

      <section className="flex flex-col gap-4 rounded-3xl border bg-card p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-heading text-lg font-extrabold">Progress</h2>
          <span className="text-sm text-muted-foreground tabular-nums">
            {states.mature} mature
          </span>
        </div>
        <div className="flex h-4 overflow-hidden rounded-full bg-muted">
          {STATES.map(({ key, tone }) =>
            states[key] ? (
              <div
                key={key}
                className={cn("h-full transition-[width] duration-700", tone)}
                style={{ width: `${(states[key] / counts.total) * 100}%` }}
              />
            ) : null
          )}
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STATES.map(({ key, label, tone }) => (
            <li key={key} className="flex items-center gap-2 text-sm">
              <span className={cn("size-3 rounded-full", tone)} />
              <span className="text-muted-foreground">{label}</span>
              <span className="ms-auto font-heading font-extrabold tabular-nums sm:ms-0">
                {states[key]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap gap-2 text-sm">
        {doc.lang && (
          <Meta icon={LanguagesIcon}>
            <span className="uppercase">{doc.lang}</span>
          </Meta>
        )}
        {doc.authors?.map((a) => (
          <Meta key={a.name} icon={UserIcon}>
            {a.name}
          </Meta>
        ))}
        {doc.license && <Meta icon={ScaleIcon}>{doc.license}</Meta>}
        {doc.version && <Meta icon={LayersIcon}>v{doc.version}</Meta>}
        {homepage && (
          <a
            href={homepage}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-muted-foreground hover:text-foreground"
          >
            <ExternalLinkIcon className="size-3.5" />
            Homepage
          </a>
        )}
        {doc.tags?.map((t) => (
          <span
            key={t}
            className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground"
          >
            #{t}
          </span>
        ))}
      </section>
    </div>
  )
}

function Big({
  value,
  label,
  tone,
}: {
  value: number
  label: string
  tone?: string
}) {
  return (
    <div className="flex flex-col">
      <span
        className={cn(
          "font-heading text-3xl leading-none font-extrabold tabular-nums",
          value > 0 && tone
        )}
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function Meta({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-muted-foreground">
      <Icon className="size-3.5" />
      {children}
    </span>
  )
}
