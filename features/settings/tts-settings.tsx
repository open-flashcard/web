"use client"

import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import {
  AudioLinesIcon,
  GlobeIcon,
  PlayIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import {
  clearTtsCache,
  discover,
  listVoices,
  setTtsSettings,
  synthesize,
  useTtsSettings,
  type Discovery,
  type OptionValue,
  type SpeechField,
  type TtsSettings,
  type VoiceSetting,
} from "@/lib/tts"
import {
  field,
  ServiceCard,
  StatusLine,
  Step,
  useConnection,
} from "@/features/settings/service"
import { languageName } from "@/features/settings/llm-settings"
import { useSpeechLanguages } from "@/features/settings/use-speech-langs"

// A line to try each voice with; other languages read the English one.
const SAMPLES: Record<string, string> = {
  en: "Hello! How are you today?",
  fr: "Bonjour ! Comment allez-vous ?",
  es: "¡Hola! ¿Cómo estás?",
  it: "Ciao! Come stai?",
  pt: "Olá! Como você está?",
  de: "Hallo! Wie geht es dir?",
  fa: "سلام! حالت چطور است؟",
  ja: "こんにちは、お元気ですか？",
  zh: "你好，你今天好吗？",
}

const SPEEDS = [0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 1, 1.1, 1.2]

type Update = (next: Partial<TtsSettings>) => void

// Text-to-speech, built from what the server reports: connect, pick a model,
// give each language a voice from the server's list, and tune any option its
// schema accepts. Nothing about a particular server is assumed.
export function TtsSettings() {
  const settings = useTtsSettings()
  const update: Update = (next) => setTtsSettings({ ...settings, ...next })
  const server = useConnection<Discovery>(
    () => discover(settings.url),
    settings.enabled && Boolean(settings.url)
  )
  const found = server.state.status === "connected" ? server.state.data : null

  // Keep what connecting learned: the API prefix, and a model the server has.
  React.useEffect(() => {
    if (!found) return
    const model =
      found.models.length && !found.models.includes(settings.model)
        ? found.models[0]
        : settings.model
    if (model !== settings.model || found.prefix !== settings.prefix) {
      setTtsSettings({ ...settings, model, prefix: found.prefix })
    }
  }, [found, settings])

  return (
    <ServiceCard
      title="Text-to-speech"
      description="Reads lines marked with speech aloud through any server with the OpenAI speech API. Lines it can’t speak use the browser’s own voice."
      enabled={settings.enabled}
      onEnabledChange={(enabled) => update({ enabled })}
    >
      <Step icon={GlobeIcon} title="Server">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (settings.url) server.connect()
          }}
        >
          <input
            className={field}
            value={settings.url}
            onChange={(e) => {
              update({ url: e.target.value.trim() })
              server.reset()
            }}
            aria-label="Server address"
            placeholder="Server address, e.g. http://localhost:8000"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!settings.url}
          >
            {found ? "Reconnect" : "Connect"}
          </Button>
        </form>
        <StatusLine state={server.state} connected={() => "Connected"} />
        {found && (
          <ModelPicker settings={settings} found={found} update={update} />
        )}
      </Step>

      {found && settings.model && (
        <Connected settings={settings} found={found} update={update} />
      )}
    </ServiceCard>
  )
}

function ModelPicker({
  settings,
  found,
  update,
}: {
  settings: TtsSettings
  found: Discovery
  update: Update
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">Model</span>
      {found.models.length ? (
        <select
          className={field}
          value={settings.model}
          onChange={(e) => update({ model: e.target.value })}
        >
          {found.models.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      ) : (
        <input
          className={field}
          value={settings.model}
          onChange={(e) => update({ model: e.target.value.trim() })}
          placeholder="The server lists no models — type one"
        />
      )}
    </label>
  )
}

function Connected({
  settings,
  found,
  update,
}: {
  settings: TtsSettings
  found: Discovery
  update: Update
}) {
  const [voices, setVoices] = React.useState<string[] | "loading">("loading")
  const [error, setError] = React.useState<string>()

  React.useEffect(() => {
    let cancelled = false
    setVoices("loading")
    setError(undefined)
    listVoices(settings.url, found, settings.model).then(
      (v) => !cancelled && setVoices(v),
      (e: Error) => {
        if (cancelled) return
        setVoices([])
        setError(`Couldn’t list voices: ${e.message}`)
      }
    )
    return () => {
      cancelled = true
    }
  }, [settings.url, settings.model, found])

  const list = voices === "loading" ? [] : voices
  // Without a schema, assume the OpenAI API: voice and speed, nothing more.
  const hasSpeed = found.fields
    ? found.fields.some((f) => f.name === "speed")
    : true
  const fields = (found.fields ?? []).filter((f) => f.name !== "speed")

  const setVoice = (tag: string, v: VoiceSetting) =>
    update({ voices: { ...settings.voices, [tag]: v } })
  const removeLanguage = (tag: string) => {
    const rest = { ...settings.voices }
    delete rest[tag]
    update({ voices: rest })
  }

  return (
    <>
      <Summary found={found} voices={voices} />
      {error && <p className="text-xs text-destructive">{error}</p>}

      <Step icon={AudioLinesIcon} title="Voices" aside="one per language">
        {voices === "loading" ? (
          <p className="text-sm text-muted-foreground">
            Asking the server for its voices…
          </p>
        ) : (
          <>
            <LanguageList
              settings={settings}
              voices={list}
              fields={fields}
              hasSpeed={hasSpeed}
              onChange={setVoice}
              onRemove={removeLanguage}
            />
            <AddLanguage
              taken={Object.keys(settings.voices)}
              onAdd={(tag) => setVoice(tag, { voice: "" })}
            />
          </>
        )}
      </Step>

      {fields.length > 0 && (
        <details className="rounded-2xl border px-3 py-2.5">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold">
            <SlidersHorizontalIcon className="size-4 text-muted-foreground" />
            Options for every language
            <span className="ms-auto text-xs font-normal text-muted-foreground">
              {changedLabel(settings.options)}
            </span>
          </summary>
          <p className="mt-2 text-xs text-muted-foreground">
            Every field this server’s speech request accepts, from its
            openapi.json. They cover every model on the server, so some may not
            apply to yours. Empty fields keep the server’s default, shown
            faintly.
          </p>
          <OptionsForm
            fields={fields}
            value={settings.options}
            onChange={(options) => update({ options })}
          />
        </details>
      )}

      <Footer onRemoveAll={() => update({ voices: {} })} />
    </>
  )
}

function changedLabel(options?: Record<string, OptionValue>) {
  const n = Object.keys(options ?? {}).length
  return n ? `${n} set` : "server defaults"
}

// What connecting found, in a line of chips.
function Summary({
  found,
  voices,
}: {
  found: Discovery
  voices: string[] | "loading"
}) {
  const voiceSource = !found.voiceList
    ? "voices typed by name"
    : "endpoint" in found.voiceList
      ? `voices from ${found.voiceList.endpoint}`
      : "voices from the schema"
  const items = [
    found.models.length
      ? `${found.models.length} model${found.models.length === 1 ? "" : "s"}`
      : "no model list",
    voices === "loading"
      ? "voices…"
      : voices.length
        ? `${voices.length} voices`
        : null,
    voiceSource,
    found.fields
      ? `${found.fields.length} options from openapi.json`
      : "OpenAI fields only",
  ].filter((i): i is string => Boolean(i))
  return (
    <div className="-mt-2 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
        >
          {item}
        </span>
      ))}
    </div>
  )
}

interface Row {
  tag: string
  lines?: number // spoken lines in the decks, when the decks use it
  setting?: VoiceSetting
}

// One row per language: those the decks speak, then any added by hand.
function LanguageList({
  settings,
  voices,
  fields,
  hasSpeed,
  onChange,
  onRemove,
}: {
  settings: TtsSettings
  voices: string[]
  fields: SpeechField[]
  hasSpeed: boolean
  onChange: (tag: string, v: VoiceSetting) => void
  onRemove: (tag: string) => void
}) {
  const used = useSpeechLanguages()
  const rows: Row[] = []
  const seen = new Set<string>()
  for (const { tag, lines } of used ?? []) {
    // "fr-CA" lines are spoken by an "fr" row, as when playing.
    const row = settings.voices[tag] ? tag : tag.split("-")[0]
    if (seen.has(row)) continue
    seen.add(row)
    rows.push({ tag: row, lines, setting: settings.voices[row] })
  }
  for (const [tag, setting] of Object.entries(settings.voices)) {
    if (!seen.has(tag)) rows.push({ tag, setting })
  }

  if (!rows.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No language yet. Import a deck, or add one below.
      </p>
    )
  }

  return (
    <ul className="flex flex-col divide-y rounded-2xl border">
      {rows.map((row) => (
        <LanguageRow
          key={row.tag}
          row={row}
          voices={voices}
          fields={fields}
          globalOptions={settings.options}
          hasSpeed={hasSpeed}
          onChange={(v) => onChange(row.tag, v)}
          onRemove={() => onRemove(row.tag)}
        />
      ))}
    </ul>
  )
}

function LanguageRow({
  row,
  voices,
  fields,
  globalOptions,
  hasSpeed,
  onChange,
  onRemove,
}: {
  row: Row
  voices: string[]
  fields: SpeechField[]
  globalOptions: Record<string, OptionValue>
  hasSpeed: boolean
  onChange: (v: VoiceSetting) => void
  onRemove: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const [test, setTest] = React.useState<string>()
  const value = row.setting
  const overrides = Object.keys(value?.options ?? {}).length

  async function play() {
    setTest("…")
    const started = performance.now()
    try {
      const sample = SAMPLES[row.tag.split("-")[0]] ?? SAMPLES.en
      const blob = await synthesize(sample, row.tag)
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => URL.revokeObjectURL(url)
      await audio.play()
      setTest(`${Math.round(performance.now() - started)} ms`)
    } catch {
      setTest("failed")
    }
  }

  return (
    <li className="flex flex-col gap-2 px-3 py-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="min-w-0 sm:w-40 sm:shrink-0">
          <div className="text-sm font-medium">
            {languageName(row.tag)}{" "}
            <span className="font-mono text-xs font-normal text-muted-foreground">
              {row.tag}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {row.lines !== undefined
              ? `${row.lines.toLocaleString()} spoken lines`
              : "added by hand"}
          </div>
        </div>

        {value ? (
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <div className="min-w-0 flex-1">
              {voices.length ? (
                <select
                  className={field}
                  value={value.voice}
                  aria-label={`${row.tag} voice`}
                  onChange={(e) =>
                    onChange({ ...value, voice: e.target.value })
                  }
                >
                  <option value="" disabled>
                    Choose a voice…
                  </option>
                  {value.voice && !voices.includes(value.voice) && (
                    <option>{value.voice}</option>
                  )}
                  {voices.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              ) : (
                <input
                  className={field}
                  value={value.voice}
                  aria-label={`${row.tag} voice`}
                  placeholder="Voice name"
                  onChange={(e) =>
                    onChange({ ...value, voice: e.target.value })
                  }
                />
              )}
            </div>
            {hasSpeed && (
              <select
                className={cn(field, "w-18 shrink-0")}
                value={String(value.speed ?? 1)}
                aria-label={`${row.tag} speed`}
                onChange={(e) =>
                  onChange({ ...value, speed: Number(e.target.value) })
                }
              >
                {SPEEDS.map((sp) => (
                  <option key={sp} value={String(sp)}>
                    {sp}×
                  </option>
                ))}
              </select>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Test ${row.tag} voice`}
              title={test ? `Test · ${test}` : "Test"}
              disabled={!value.voice}
              onClick={play}
            >
              <PlayIcon />
            </Button>
            {fields.length > 0 && (
              <Button
                variant={open || overrides ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label={`${row.tag} options`}
                aria-expanded={open}
                title={overrides ? `${overrides} options set` : "Options"}
                onClick={() => setOpen(!open)}
              >
                <SlidersHorizontalIcon />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${row.tag}`}
              onClick={onRemove}
            >
              <XIcon />
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-between gap-2 sm:justify-end">
            <span className="text-xs text-muted-foreground">Browser voice</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange({ voice: "" })}
            >
              <PlusIcon data-icon="inline-start" />
              Choose a voice
            </Button>
          </div>
        )}
      </div>

      {value && open && (
        <div className="rounded-xl bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            Values for {languageName(row.tag)} only — for example a model’s
            language code. Empty fields use the options for every language.
          </p>
          <OptionsForm
            fields={fields}
            value={value.options ?? {}}
            fallback={globalOptions}
            onChange={(options) => onChange({ ...value, options })}
          />
        </div>
      )}
    </li>
  )
}

// A language typed in as a BCP-47 tag, for one the decks don't use yet.
function AddLanguage({
  taken,
  onAdd,
}: {
  taken: string[]
  onAdd: (tag: string) => void
}) {
  const [tag, setTag] = React.useState("")
  const clean = tag.trim().toLowerCase()
  const valid =
    /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/.test(clean) && !taken.includes(clean)
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        onAdd(clean)
        setTag("")
      }}
    >
      <input
        className={cn(field, "max-w-48")}
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        placeholder="Another language, e.g. de"
        aria-label="Language to add"
      />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className="h-8"
        disabled={!valid}
      >
        <PlusIcon data-icon="inline-start" />
        Add
      </Button>
    </form>
  )
}

// A form for the schema's fields. Only fields given a value are sent; the
// placeholders show what applies otherwise (`fallback`, then the server).
function OptionsForm({
  fields,
  value,
  fallback,
  onChange,
}: {
  fields: SpeechField[]
  value: Record<string, OptionValue>
  fallback?: Record<string, OptionValue>
  onChange: (next: Record<string, OptionValue>) => void
}) {
  const set = (name: string, v: OptionValue | undefined) => {
    const next = { ...value }
    if (v === undefined || v === "") delete next[name]
    else next[name] = v
    onChange(next)
  }
  return (
    <div className="mt-3 flex flex-col gap-3 text-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.name} className="flex flex-col gap-1">
            <span className="flex items-baseline justify-between gap-2">
              <span>{f.title}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {f.name}
              </span>
            </span>
            <OptionInput
              field={f}
              value={value[f.name]}
              placeholder={fallback?.[f.name] ?? f.default}
              onChange={(v) => set(f.name, v)}
            />
          </label>
        ))}
      </div>
      {Object.keys(value).length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => onChange({})}
        >
          Clear these options
        </Button>
      )}
    </div>
  )
}

function OptionInput({
  field: f,
  value,
  placeholder: fallback,
  onChange,
}: {
  field: SpeechField
  value: OptionValue | undefined
  placeholder?: OptionValue
  onChange: (v: OptionValue | undefined) => void
}) {
  const placeholder = fallback === undefined ? "" : String(fallback)
  const current = value === undefined ? "" : String(value)
  if (f.enum || f.type === "boolean") {
    const choices = f.enum ?? [true, false]
    return (
      <select
        className={field}
        value={current}
        onChange={(e) =>
          onChange(choices.find((o) => String(o) === e.target.value))
        }
      >
        <option value="">Default{placeholder && ` (${placeholder})`}</option>
        {choices.map((o) => (
          <option key={String(o)} value={String(o)}>
            {o === true ? "On" : o === false ? "Off" : String(o)}
          </option>
        ))}
      </select>
    )
  }
  if (f.type === "number" || f.type === "integer") {
    return (
      <input
        className={field}
        type="number"
        step={f.type === "integer" ? 1 : 0.05}
        value={current}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value === "" ? undefined : Number(e.target.value))
        }
      />
    )
  }
  return (
    <input
      className={field}
      value={current}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function Footer({ onRemoveAll }: { onRemoveAll: () => void }) {
  const cached = useLiveQuery(() => db.tts.count())
  return (
    <div className="flex items-center justify-between gap-4 border-t pt-3 text-xs text-muted-foreground">
      <span>{(cached ?? 0).toLocaleString()} clips cached in this browser</span>
      <div className="flex gap-1">
        <Button variant="ghost" size="xs" onClick={onRemoveAll}>
          Remove all voices
        </Button>
        <Button variant="ghost" size="xs" onClick={clearTtsCache}>
          Clear cache
        </Button>
      </div>
    </div>
  )
}
