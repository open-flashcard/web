import { createOpenAI } from "@ai-sdk/openai"
import { generateSpeech } from "ai"

import { db } from "@/lib/db"
import { localStore } from "@/lib/local-store"
import {
  apiPrefix,
  joinUrl as join,
  openApi,
  resolve,
  type JsonSchema,
  type OpenApi,
} from "@/lib/openapi"

// Speech from any server with the OpenAI speech API, through the AI SDK's
// generateSpeech, cached in IndexedDB so each phrase is generated once.
//
// Nothing about a particular server is built in. Connecting asks the server
// what it offers — models from /models, and from its OpenAPI document the
// speech request's fields and, if it has one, a voice list — and the settings
// form is built from that. Settings are per browser, in localStorage.

export type OptionValue = string | number | boolean

export interface VoiceSetting {
  voice: string // empty: the server's own default voice (some models have no named voices)
  speed?: number // 1 is the voice's natural pace
  // This language's own values for extra request fields (e.g. a model's
  // language code), over the server-wide `options`.
  options?: Record<string, OptionValue>
}

export interface TtsSettings {
  enabled: boolean
  url: string // the server's address, e.g. http://localhost:8000
  prefix: string // where its OpenAI API lives, as its OpenAPI document says
  model: string
  voices: Record<string, VoiceSetting> // keyed by BCP-47 tag, lowercase
  // Extra request fields from the server's schema (pitch, temperature…), sent
  // with every request; a field left unset keeps the server's default.
  options: Record<string, OptionValue>
}

export const EMPTY_TTS: TtsSettings = {
  enabled: false,
  url: "",
  prefix: "/v1",
  model: "",
  voices: {},
  options: {},
}

const store = localStore<TtsSettings>(
  "ofc.tts",
  (saved) => {
    const s = { ...EMPTY_TTS, ...(saved as Partial<TtsSettings>) }
    // Settings saved before per-language options kept a language code apart.
    const voices: Record<string, VoiceSetting> = {}
    for (const [tag, v] of Object.entries(s.voices)) {
      const { langCode, ...rest } = v as VoiceSetting & { langCode?: string }
      voices[tag] = langCode
        ? { ...rest, options: { lang_code: langCode, ...rest.options } }
        : rest
    }
    return { ...s, voices }
  },
  EMPTY_TTS
)

export const getTtsSettings = store.get
export const setTtsSettings = store.set
export const subscribeTts = store.subscribe
export const useTtsSettings = store.use

// "fr-CA" uses a "fr-ca" voice if configured, otherwise "fr".
function voiceFor(settings: TtsSettings, lang?: string) {
  if (!lang) return undefined
  const tag = lang.toLowerCase()
  return settings.voices[tag] ?? settings.voices[tag.split("-")[0]]
}

// The configured pace for a language, applied to server and browser voices alike.
export function voiceSpeed(lang?: string) {
  return voiceFor(getTtsSettings(), lang)?.speed ?? 1
}

// Whether the server is set up to speak this language at all: a language row
// exists, even with no voice named — then the server picks its default.
export function serverSpeaks(lang?: string) {
  const s = getTtsSettings()
  return s.enabled && Boolean(s.url && s.model && voiceFor(s, lang))
}

// Returns audio for `text`, from the cache or the server. Throws when the server
// can't produce it, so the caller can fall back to the browser's own voice.
export async function synthesize(
  text: string,
  lang: string | undefined,
  { rate = 1, signal }: { rate?: number; signal?: AbortSignal } = {}
): Promise<Blob> {
  const settings = getTtsSettings()
  const voice = voiceFor(settings, lang)
  if (!serverSpeaks(lang) || !voice) throw new Error("No server voice")
  // A deck's own `speech.rate` scales the language's configured pace.
  const speed = Math.round((voice.speed ?? 1) * rate * 100) / 100
  const extra = { ...settings.options, ...voice.options }

  const key = [
    settings.url,
    settings.model,
    voice.voice,
    JSON.stringify(extra),
    speed,
    text,
  ].join("\u0000")
  const cached = await db.tts.get(key)
  if (cached) return cached.blob

  const { audio: file } = await generateSpeech({
    model: speechProvider(settings, extra, !voice.voice).speech(settings.model),
    text,
    voice: voice.voice || undefined,
    speed,
    // WAV needs no encoder on the server; mp3 often needs ffmpeg there.
    outputFormat: "wav",
    abortSignal: signal,
    maxRetries: 0,
  })
  // Some servers answer 200 with next to no audio when generation fails.
  if (file.uint8Array.byteLength < 1000) {
    throw new Error(`TTS server returned ${file.uint8Array.byteLength} bytes`)
  }
  const audio = new Blob([file.uint8Array as Uint8Array<ArrayBuffer>], {
    type: file.mediaType || "audio/wav",
  })
  await db.tts.put({ key, blob: audio, createdAt: new Date() })
  return audio
}

// The AI SDK's OpenAI speech model pointed at the server. On the way out,
// fields beyond the OpenAI API (from the options form) join the request body,
// and with no voice named the SDK's own default ("alloy", an OpenAI voice) is
// taken out, so the server uses its default instead.
function speechProvider(
  settings: TtsSettings,
  extra: Record<string, OptionValue>,
  serverVoice: boolean
) {
  return createOpenAI({
    baseURL: join(settings.url, settings.prefix),
    apiKey: "none", // the SDK requires one; local servers don't check it
    fetch: (input, init) => {
      if (typeof init?.body === "string") {
        const body = { ...JSON.parse(init.body), ...extra }
        if (serverVoice) delete body.voice
        init = { ...init, body: JSON.stringify(body) }
      }
      return fetch(input, init)
    },
  })
}

// --- discovery ---------------------------------------------------------------

export interface SpeechField {
  name: string
  title: string
  type: "number" | "integer" | "string" | "boolean"
  default?: OptionValue
  enum?: (string | number)[]
  description?: string
}

export interface Discovery {
  prefix: string // e.g. "/v1"
  models: string[] // empty: the server loads one on first use, or doesn't say
  fields: SpeechField[] | null // null: no OpenAPI document; OpenAI fields only
  voiceList: VoiceList | null // how to ask for voices, if the server can say
  // How to load a model the server doesn't have loaded yet, if its OpenAPI
  // document offers a way: a POST on its models route taking the model's name.
  loader: { endpoint: string; param: string } | null
}

// Where the server lists voices: an endpoint from its OpenAPI document, or the
// fixed choices its schema allows for `voice`.
type VoiceList = { endpoint: string; byModel: boolean } | { choices: string[] }

// What the app itself sends, so the form never offers it.
const MANAGED = new Set([
  "model",
  "input",
  "voice",
  "response_format",
  "stream",
  "streaming_interval",
  "verbose",
])

// Everything the app learns about a server when connecting.
export async function discover(url: string): Promise<Discovery> {
  const doc = await openApi(url)
  const paths = Object.entries(doc?.paths ?? {})
  const speech = paths.find(
    ([p, ops]) => /\/audio\/speech$/.test(p) && ops.post
  )
  // The OpenAI routes sit under one prefix: "/v1/audio/speech" → "/v1".
  const prefix = apiPrefix(doc, "/audio/speech")

  const res = await fetch(join(url, `${prefix}/models`), {
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${prefix}/models`)
  const body = (await res.json()) as { data?: { id: string }[] }
  const models = body.data?.map((m) => m.id) ?? []

  if (!doc || !speech) {
    return { prefix, models, fields: null, voiceList: null, loader: null }
  }

  const schema = resolve(
    doc,
    speech[1].post?.requestBody?.content?.["application/json"]?.schema
  )
  const properties = Object.entries(schema?.properties ?? {})
  const fields = properties
    .filter(([name]) => !MANAGED.has(name))
    .map(([name, raw]) => field(doc, name, raw))

  const voicesPath = paths.find(
    ([p, ops]) => /\/audio\/voices$/.test(p) && ops.get
  )
  const voiceChoices = field(
    doc,
    "voice",
    schema?.properties?.voice ?? {}
  ).enum?.map(String)
  const voiceList: VoiceList | null = voicesPath
    ? {
        endpoint: voicesPath[0],
        byModel: Boolean(
          voicesPath[1].get?.parameters?.some((p) => p.name === "model")
        ),
      }
    : voiceChoices?.length
      ? { choices: voiceChoices }
      : null

  const load = doc.paths?.[`${prefix}/models`]?.post
  const param = load?.parameters?.find((p) => p.in === "query")?.name
  const loader = param ? { endpoint: `${prefix}/models`, param } : null

  return { prefix, models, fields, voiceList, loader }
}

// Asks the server to load a model (and download it if it must), through the
// route its OpenAPI document describes. Slow the first time.
export async function loadModel(url: string, found: Discovery, model: string) {
  if (!found.loader) throw new Error("This server can’t load models")
  const { endpoint, param } = found.loader
  const res = await fetch(
    join(url, `${endpoint}?${param}=${encodeURIComponent(model)}`),
    { method: "POST" }
  )
  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(
      `HTTP ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`
    )
  }
}

// The voices a model offers, as the server reports them; empty when it can't
// say, and the voice is typed in by name.
export async function listVoices(
  url: string,
  found: Discovery,
  model: string
): Promise<string[]> {
  const list = found.voiceList
  if (!list) return []
  if ("choices" in list) return list.choices
  const query = list.byModel ? `?model=${encodeURIComponent(model)}` : ""
  const res = await fetch(join(url, list.endpoint + query), {
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${list.endpoint}`)
  // Lists come as { data: [...] }, { voices: [...] } or a bare array, of
  // names or of objects with an id or name.
  const body = (await res.json()) as unknown
  const items = Array.isArray(body)
    ? body
    : ((body as { data?: unknown[]; voices?: unknown[] }).data ??
      (body as { voices?: unknown[] }).voices ??
      [])
  return items
    .map((v) =>
      typeof v === "string"
        ? v
        : ((v as { id?: string; name?: string }).id ??
          (v as { name?: string }).name)
    )
    .filter((v): v is string => Boolean(v))
}

function field(doc: OpenApi, name: string, raw: JsonSchema): SpeechField {
  const p = resolve(doc, raw) ?? {}
  // Optional fields come as anyOf [T, null].
  const type =
    p.type ?? p.anyOf?.map((a) => a.type).find((t) => t && t !== "null")
  return {
    name,
    title: p.title ?? name,
    type: (["number", "integer", "boolean"].includes(type ?? "")
      ? type
      : "string") as SpeechField["type"],
    default: p.default ?? undefined,
    enum: p.enum ?? p.anyOf?.find((a) => a.enum)?.enum,
    description: p.description,
  }
}

export async function clearTtsCache() {
  await db.tts.clear()
}
