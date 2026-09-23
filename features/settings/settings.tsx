"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { deleteDeck } from "@/lib/db/decks"
import {
  saveDeckSettings,
  saveStudyDefaults,
  useStudyDefaults,
} from "@/lib/settings"
import { useDeck } from "@/features/deck/deck-shell"
import { StudySettingsForm } from "@/features/settings/study-settings-form"
import { LlmSettingsCard } from "@/features/settings/llm-settings"
import { TtsSettings } from "@/features/settings/tts-settings"

export function SettingsSection({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-extrabold">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

// App-wide settings: study defaults every deck starts from, then the two
// external services, each configured on its own.
export function AppSettings() {
  const defaults = useStudyDefaults()
  if (!defaults) return null
  return (
    <div className="flex flex-col gap-4">
      <SettingsSection
        title="Study"
        description="Defaults for every deck. Each deck can override them in its own settings."
      >
        <StudySettingsForm value={defaults} onChange={saveStudyDefaults} />
      </SettingsSection>
      <h2 className="mt-2 font-heading text-xl font-extrabold">Services</h2>
      <TtsSettings />
      <LlmSettingsCard />
    </div>
  )
}

export function DeckSettings() {
  const deck = useDeck()
  const defaults = useStudyDefaults()
  if (!defaults) return null
  const overrides = Object.keys(deck.settings ?? {}).length
  return (
    <div className="flex flex-col gap-4">
      <SettingsSection
        title="Deck settings"
        description="Anything left on Default follows your app settings. Scheduling changes apply from the next review on."
        action={
          overrides > 0 && (
            <button
              type="button"
              className="shrink-0 text-sm text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => saveDeckSettings(deck.id, {})}
            >
              Reset all
            </button>
          )
        }
      >
        <StudySettingsForm
          value={deck.settings ?? {}}
          defaults={defaults}
          onChange={(next) => saveDeckSettings(deck.id, next)}
        />
      </SettingsSection>
      <DangerZone />
    </div>
  )
}

function DangerZone() {
  const deck = useDeck()
  const router = useRouter()
  // Two clicks instead of a confirm() dialog.
  const [armed, setArmed] = React.useState(false)

  async function remove() {
    router.push("/")
    await deleteDeck(deck.id)
    toast.success(`Deleted “${deck.name}”.`)
  }

  return (
    <SettingsSection
      title="Delete deck"
      description="Removes the deck, its media and your whole review history for it. Re-importing the file brings the cards back, but not the history."
    >
      <Button
        variant="destructive"
        className="self-start"
        onClick={() => (armed ? remove() : setArmed(true))}
        onBlur={() => setArmed(false)}
      >
        {armed ? "Click again to delete for good" : "Delete deck"}
      </Button>
    </SettingsSection>
  )
}
