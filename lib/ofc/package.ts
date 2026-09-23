import { parseDeck } from "./load"
import type { Deck } from "./types"

export interface PickedFile {
  path: string // relative to what the user picked, e.g. "identity/audio/a.mp3"
  file: File
}

export interface LoadedDeck {
  deck: Deck
  media?: { path: string; blob: Blob }[]
}

// Files from an <input type="file">, with or without `webkitdirectory`.
export function fromFileList(files: FileList): PickedFile[] {
  return Array.from(files).map((file) => ({
    path: file.webkitRelativePath || file.name,
    file,
  }))
}

// Files from a drop, walking into any dropped folders.
export async function fromDataTransfer(dt: DataTransfer) {
  // Entries must be taken synchronously, before the first await.
  const entries = Array.from(dt.items)
    .map((item) => item.webkitGetAsEntry())
    .filter((e): e is FileSystemEntry => e !== null)
  const out: PickedFile[] = []

  async function walk(entry: FileSystemEntry, prefix: string) {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) =>
        (entry as FileSystemFileEntry).file(resolve, reject)
      )
      out.push({ path: prefix + entry.name, file })
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader()
      // readEntries returns results in batches until it returns an empty one.
      for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
          reader.readEntries(resolve, reject)
        )
        if (!batch.length) break
        for (const child of batch) await walk(child, `${prefix}${entry.name}/`)
      }
    }
  }

  for (const entry of entries) await walk(entry, "")
  return out
}

// Turn picked files into decks. A `deck.json` is a package (§3.4): every other
// file under its folder is media, addressed by its path relative to deck.json.
// Any other .json file is a bare deck document.
export async function loadDecks(files: PickedFile[]) {
  const visible = files.filter((f) => !f.path.split("/").some(isHidden))
  const packages = visible
    .filter((f) => basename(f.path) === "deck.json")
    .map((f) => ({ doc: f, dir: dirname(f.path) }))
  const inPackage = (f: PickedFile) =>
    packages.some((p) => f !== p.doc && f.path.startsWith(p.dir))

  const decks: LoadedDeck[] = []
  const errors: string[] = []

  for (const { doc, dir } of packages) {
    try {
      const deck = parseDeck(await doc.file.text())
      const media = visible
        .filter((f) => f !== doc && f.path.startsWith(dir))
        .map((f) => ({
          path: f.path.slice(dir.length),
          blob: withType(f.file),
        }))
      // A lone deck.json carries no media; keep whatever was imported before.
      decks.push({ deck, media: media.length ? media : undefined })
    } catch (e) {
      errors.push(`${doc.path}: ${(e as Error).message}`)
    }
  }

  for (const f of visible) {
    if (!f.path.toLowerCase().endsWith(".json") || inPackage(f)) continue
    if (packages.some((p) => p.doc === f)) continue
    try {
      decks.push({ deck: parseDeck(await f.file.text()) })
    } catch (e) {
      errors.push(`${f.path}: ${(e as Error).message}`)
    }
  }

  if (!decks.length && !errors.length) {
    errors.push(
      "No deck found. Choose a .ofc.json file or a folder with deck.json."
    )
  }
  return { decks, errors }
}

// Browsers leave File.type empty for some extensions (.m4a, .opus); media
// elements play more reliably from a blob that states its type.
const MEDIA_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  opus: "audio/ogg",
  wav: "audio/wav",
  flac: "audio/flac",
  webm: "video/webm",
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
}

function withType(file: File): Blob {
  if (file.type) return file
  const ext = file.name.slice(file.name.lastIndexOf(".") + 1).toLowerCase()
  const type = MEDIA_TYPES[ext]
  return type ? new Blob([file], { type }) : file
}

const isHidden = (segment: string) => segment.startsWith(".")
const basename = (path: string) => path.slice(path.lastIndexOf("/") + 1)
const dirname = (path: string) => path.slice(0, path.lastIndexOf("/") + 1)
