import type { Dir } from "./types"

// Absolute and data: references resolve as-is. Relative paths resolve only against
// the files imported with the deck's package (§3.4), and never outside it (§8).
export function resolveMedia(
  src: string | undefined,
  local?: ReadonlyMap<string, string>
): string | null {
  if (!src) return null
  if (/^(https?:|data:|blob:)/i.test(src)) return src
  if (/^[a-z][a-z0-9+.-]*:/i.test(src) || src.startsWith("/")) return null
  const path = src.replace(/^(\.\/)+/, "").split(/[?#]/)[0]
  if (path.split("/").includes("..")) return null
  let decoded = path
  try {
    decoded = decodeURI(path)
  } catch {}
  return local?.get(decoded) ?? local?.get(path) ?? null
}

// Links are the one place a deck can hand the browser a navigable URL, so allow-list schemes.
export function safeHref(href: string): string | null {
  return /^(https?:|mailto:)/i.test(href) ? href : null
}

const RTL = new Set([
  "ar",
  "arc",
  "dv",
  "fa",
  "he",
  "iw",
  "ku",
  "ps",
  "sd",
  "syr",
  "ug",
  "ur",
  "yi",
])

// §5.3: when `dir` is absent, derive it from `lang`.
export function directionOf(lang?: string, dir?: Dir): Dir | undefined {
  if (dir) return dir
  if (!lang) return undefined
  const primary = lang.split("-")[0].toLowerCase()
  return RTL.has(primary) && !/-Latn\b/i.test(lang) ? "rtl" : "ltr"
}
