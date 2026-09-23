// A server's OpenAPI document, when it publishes one: how the app learns what
// an OpenAI-compatible server offers instead of assuming it.

export function joinUrl(url: string, path: string) {
  return url.replace(/\/+$/, "") + path
}

// Where the server's OpenAI routes live — "/v1/chat/completions" → "/v1" — as
// its OpenAPI document says, or the standard "/v1" when it has none.
export function apiPrefix(doc: OpenApi | null, route: string) {
  const path = Object.keys(doc?.paths ?? {}).find((p) => p.endsWith(route))
  return path ? path.slice(0, -route.length) : "/v1"
}

export async function openApi(url: string): Promise<OpenApi | null> {
  try {
    const res = await fetch(joinUrl(url, "/openapi.json"), {
      signal: AbortSignal.timeout(3000),
    })
    return res.ok ? ((await res.json()) as OpenApi) : null
  } catch {
    return null
  }
}

export interface JsonSchema {
  $ref?: string
  type?: string
  title?: string
  description?: string
  default?: string | number | boolean | null
  enum?: (string | number)[]
  anyOf?: JsonSchema[]
  properties?: Record<string, JsonSchema>
}

interface Operation {
  parameters?: { name: string; in?: string }[]
  requestBody?: { content?: Record<string, { schema?: JsonSchema }> }
}

export interface OpenApi {
  paths?: Record<string, { get?: Operation; post?: Operation }>
  components?: { schemas?: Record<string, JsonSchema> }
}

export function resolve(doc: OpenApi, s?: JsonSchema): JsonSchema | undefined {
  const ref = s?.$ref?.match(/^#\/components\/schemas\/(.+)$/)?.[1]
  return ref ? doc.components?.schemas?.[ref] : s
}
