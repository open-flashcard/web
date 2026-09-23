"use client"

import { UNLIMITED, type StudySettings } from "@/lib/settings"

type Option<V> = { value: V; label: string }

interface Field<K extends keyof StudySettings> {
  key: K
  label: string
  help: string
  options: Option<StudySettings[K]>[]
}

const ON_OFF: Option<boolean>[] = [
  { value: true, label: "On" },
  { value: false, label: "Off" },
]

const FIELDS = [
  {
    key: "autoplayFront",
    label: "Read the front aloud",
    help: "Plays the front’s sound when a card appears, preferring the deck’s own language.",
    options: ON_OFF,
  } satisfies Field<"autoplayFront">,
  {
    key: "autoplayAnswer",
    label: "Read the answer aloud",
    help: "Plays the answer’s sound when you reveal the card.",
    options: ON_OFF,
  } satisfies Field<"autoplayAnswer">,
  {
    key: "newOrder",
    label: "New cards",
    help: "Order in which cards you haven’t studied yet are introduced.",
    options: [
      { value: "deck", label: "In deck order" },
      { value: "shuffled", label: "Shuffled" },
    ],
  } satisfies Field<"newOrder">,
  {
    key: "newPerDay",
    label: "New cards per day",
    help: "How many cards you haven’t seen before are introduced each day.",
    options: [0, 5, 10, 15, 20, 30, 50, 100, UNLIMITED].map((v) => ({
      value: v,
      label: v === UNLIMITED ? "No limit" : String(v),
    })),
  } satisfies Field<"newPerDay">,
  {
    key: "reviewsPerDay",
    label: "Reviews per day",
    help: "A cap on reviews each day. Cards still being learned are never held back.",
    options: [50, 100, 200, 300, 500, UNLIMITED].map((v) => ({
      value: v,
      label: v === UNLIMITED ? "No limit" : String(v),
    })),
  } satisfies Field<"reviewsPerDay">,
  {
    key: "retention",
    label: "Target retention",
    help: "How likely you should be to remember a card when it comes due. Higher means more reviews.",
    options: [0.8, 0.85, 0.9, 0.93, 0.95, 0.97].map((v) => ({
      value: v,
      label: `${Math.round(v * 100)}%`,
    })),
  } satisfies Field<"retention">,
  {
    key: "maxInterval",
    label: "Longest interval",
    help: "The furthest ahead a card can be scheduled.",
    options: [
      { value: 30, label: "1 month" },
      { value: 90, label: "3 months" },
      { value: 180, label: "6 months" },
      { value: 365, label: "1 year" },
      { value: 1095, label: "3 years" },
      { value: 3650, label: "10 years" },
      { value: 36500, label: "No limit" },
    ],
  } satisfies Field<"maxInterval">,
] as Field<keyof StudySettings>[]

const select =
  "h-8 min-w-36 rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&>option]:bg-background"

// With `defaults`, every field gets a "Default" choice that leaves it unset.
export function StudySettingsForm<
  T extends Partial<StudySettings> | StudySettings,
>({
  value,
  defaults,
  onChange,
}: {
  value: T
  defaults?: StudySettings
  onChange: (next: T) => void
}) {
  return (
    <div className="flex flex-col divide-y">
      {FIELDS.map((field) => {
        const current = value[field.key]
        const index = field.options.findIndex((o) => o.value === current)
        const label = (v: unknown) =>
          field.options.find((o) => o.value === v)?.label ?? String(v)
        return (
          <label
            key={field.key}
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium">{field.label}</span>
              <span className="block text-xs text-muted-foreground">
                {field.help}
              </span>
            </span>
            <select
              className={select}
              value={index < 0 ? "" : String(index)}
              onChange={(e) =>
                onChange({
                  ...value,
                  [field.key]:
                    e.target.value === ""
                      ? undefined
                      : field.options[Number(e.target.value)].value,
                })
              }
            >
              {defaults && (
                <option value="">Default ({label(defaults[field.key])})</option>
              )}
              {!defaults && index < 0 && (
                <option value="" disabled>
                  {String(current)}
                </option>
              )}
              {field.options.map((o, i) => (
                <option key={i} value={String(i)}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )
      })}
    </div>
  )
}
