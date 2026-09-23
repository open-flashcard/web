import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { extractReasoningMiddleware, streamText, wrapLanguageModel } from "ai"

import { localStore } from "@/lib/local-store"
import { apiPrefix, joinUrl, openApi } from "@/lib/openapi"

// A language model behind the standard OpenAI chat API (models and chat
// completions), so any such server works. Nothing about one is built in: the
// learner gives its address, connecting finds its API prefix and models.
// Settings are per browser.

export interface LlmSettings {
  enabled: boolean
  url: string // the server's address, e.g. http://localhost:8080
  prefix: string // where its OpenAI API lives, as its OpenAPI document says
  apiKey: string // only for servers that ask for one
  model: string
  replyLang: string // BCP-47 tag the learner reads explanations in
}

export const EMPTY_LLM: LlmSettings = {
  enabled: false,
  url: "",
  prefix: "/v1",
  apiKey: "",
  model: "",
  replyLang: "en",
}

const store = localStore<LlmSettings>(
  "ofc.llm",
  (saved) => {
    const s = { ...EMPTY_LLM, ...(saved as Partial<LlmSettings>) }
    // Settings saved before prefix discovery kept "/v1" in the address.
    const m = /^(.*?)(\/v\d+)\/?$/.exec(s.url)
    return m && !(saved as Partial<LlmSettings>).prefix
      ? { ...s, url: m[1], prefix: m[2] }
      : s
  },
  EMPTY_LLM
)

export const getLlmSettings = store.get
export const setLlmSettings = store.set
export const useLlmSettings = store.use

function authHeaders(apiKey: string): Record<string, string> {
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
}

// What connecting learns: the API prefix (from the server's OpenAPI document
// if it has one, else the standard /v1) and the models it offers. The AI SDK
// sends requests but doesn't list models, so this asks the server itself.
export async function discoverLlm(settings: LlmSettings) {
  const prefix = apiPrefix(await openApi(settings.url), "/chat/completions")
  const res = await fetch(joinUrl(settings.url, `${prefix}/models`), {
    headers: authHeaders(settings.apiKey),
    signal: AbortSignal.timeout(5000),
  })
  if (res.status === 401 || res.status === 403) {
    throw new Error("The server refused the API key.")
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${prefix}/models`)
  const body = (await res.json()) as { data?: { id: string }[] }
  return { prefix, models: body.data?.map((m) => m.id) ?? [] }
}

function model(settings: LlmSettings) {
  const provider = createOpenAICompatible({
    name: "llm",
    baseURL: joinUrl(settings.url, settings.prefix),
    apiKey: settings.apiKey || undefined,
  })
  // Reasoning models (Qwen3, DeepSeek-R1…) may think inside <think> tags;
  // the learner only sees the answer.
  return wrapLanguageModel({
    model: provider(settings.model),
    middleware: extractReasoningMiddleware({ tagName: "think" }),
  })
}

// Streams a reply, calling `onText` with the text so far. Throws on failure.
export async function streamReply(
  settings: LlmSettings,
  { system, prompt }: { system: string; prompt: string },
  onText: (text: string) => void,
  signal?: AbortSignal
) {
  let failure: unknown
  const result = streamText({
    model: model(settings),
    system,
    prompt,
    maxOutputTokens: 1024,
    abortSignal: signal,
    onError: ({ error }) => {
      failure = error
    },
  })
  // The result's own promises reject when a request is cancelled; the stream
  // below reports everything, so they are only kept from going unhandled.
  for (const p of [result.text, result.finishReason, result.usage]) {
    Promise.resolve(p).catch(() => {})
  }
  let text = ""
  try {
    for await (const part of result.textStream) {
      text += part
      onText(text)
    }
  } catch (e) {
    if (!signal?.aborted) throw e
  }
  if (failure && !signal?.aborted) throw failure
  return text
}
