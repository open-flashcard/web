"use client"

import * as React from "react"
import { BotIcon, GlobeIcon, SendIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  discoverLlm,
  setLlmSettings,
  streamReply,
  useLlmSettings,
  type LlmSettings,
} from "@/lib/llm"
import {
  field,
  ServiceCard,
  StatusLine,
  Step,
  useConnection,
} from "@/features/settings/service"

// Languages an explanation can come back in; any BCP-47 tag works.
const REPLY_LANGS = [
  "en",
  "fa",
  "fr",
  "es",
  "de",
  "it",
  "pt",
  "ar",
  "tr",
  "ru",
  "zh",
  "ja",
]

export function languageName(tag: string) {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(tag) ?? tag
  } catch {
    return tag
  }
}

type Update = (next: Partial<LlmSettings>) => void

// A language model on any server with the OpenAI chat API: connect, then pick
// a model from the server's own list.
export function LlmSettingsCard() {
  const settings = useLlmSettings()
  const update: Update = (next) => setLlmSettings({ ...settings, ...next })
  const server = useConnection(
    () => discoverLlm(settings),
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
      setLlmSettings({ ...settings, model, prefix: found.prefix })
    }
  }, [found, settings])

  return (
    <ServiceCard
      title="Language model"
      description="Powers Explain, Example and Translate on cards, through any server with the OpenAI chat API."
      enabled={settings.enabled}
      onEnabledChange={(enabled) => update({ enabled })}
    >
      <Step icon={GlobeIcon} title="Server">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (settings.url) server.connect()
          }}
        >
          <div className="flex gap-2">
            <input
              className={field}
              value={settings.url}
              onChange={(e) => {
                update({ url: e.target.value.trim() })
                server.reset()
              }}
              aria-label="Server address"
              placeholder="Server address, e.g. http://localhost:8080"
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
          </div>
          <input
            className={field}
            type="password"
            autoComplete="off"
            value={settings.apiKey}
            onChange={(e) => update({ apiKey: e.target.value })}
            aria-label="API key"
            placeholder="API key, only if the server asks for one — it stays in this browser"
          />
        </form>
        <StatusLine state={server.state} connected={() => "Connected"} />
        {found && (
          <>
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
            <div className="-mt-1 flex flex-wrap gap-1.5">
              {[
                `${found.models.length} model${found.models.length === 1 ? "" : "s"}`,
                `API at ${found.prefix}`,
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          </>
        )}
      </Step>

      {found && settings.model && (
        <Step icon={BotIcon} title="Replies">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Reply in</span>
            <select
              className={field}
              value={settings.replyLang}
              onChange={(e) => update({ replyLang: e.target.value })}
            >
              {[...new Set([settings.replyLang, ...REPLY_LANGS])].map((tag) => (
                <option key={tag} value={tag}>
                  {languageName(tag)}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">
              The language explanations and translations use.
            </span>
          </label>
          <TestReply settings={settings} />
        </Step>
      )}
    </ServiceCard>
  )
}

function TestReply({ settings }: { settings: LlmSettings }) {
  const [reply, setReply] = React.useState<string>()
  const [status, setStatus] = React.useState<string>()

  async function run() {
    setReply("")
    setStatus("…")
    const started = performance.now()
    try {
      await streamReply(
        settings,
        {
          system: "Reply in one short sentence.",
          prompt: `Say hello in ${languageName(settings.replyLang)}.`,
        },
        setReply
      )
      setStatus(`${Math.round(performance.now() - started)} ms`)
    } catch (e) {
      setStatus(undefined)
      setReply(`Failed: ${(e as Error).message}`)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline" size="sm" className="self-start" onClick={run}>
        <SendIcon data-icon="inline-start" />
        Send a test message
      </Button>
      {reply !== undefined && (
        <p className="rounded-xl bg-muted/60 px-3 py-2 text-sm">
          {reply || "…"}
          {status && (
            <span className="ms-2 text-xs text-muted-foreground">{status}</span>
          )}
        </p>
      )}
    </div>
  )
}
