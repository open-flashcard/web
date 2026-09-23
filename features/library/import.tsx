"use client"

import * as React from "react"
import { FileJsonIcon, FolderOpenIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { importDeck } from "@/lib/db/decks"
import {
  fromDataTransfer,
  fromFileList,
  loadDecks,
  type PickedFile,
} from "@/lib/ofc/package"

async function importPicked(files: PickedFile[]) {
  const { decks, errors } = await loadDecks(files)
  errors.forEach((text) => toast.error(text))
  for (const { deck, media } of decks) {
    try {
      const r = await importDeck(deck, media)
      const extra = r.media ? ` and ${r.media} media files` : ""
      // A deck with an id already here replaces that deck; cards keep their
      // progress when their id (or, without one, their front) is unchanged.
      toast.success(
        r.replaced
          ? `Replaced “${deck.name}”: ${r.kept} cards kept their progress, ${r.added} new, ${r.removed} removed${extra}.`
          : `Imported “${deck.name}” with ${r.added} cards${extra}.`
      )
    } catch (e) {
      toast.error(`${deck.name}: ${(e as Error).message}`)
    }
  }
}

const ImportContext = React.createContext<{
  pickFile: () => void
  pickFolder: () => void
  dragging: boolean
}>({ pickFile() {}, pickFolder() {}, dragging: false })

// Accepts decks dropped anywhere inside it, and provides the pickers to
// ImportButtons and DropZone below.
export function ImportArea({ children }: { children: React.ReactNode }) {
  const fileInput = React.useRef<HTMLInputElement>(null)
  const folderInput = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) importPicked(fromFileList(e.target.files))
    e.target.value = ""
  }

  return (
    <ImportContext.Provider
      value={{
        pickFile: () => fileInput.current?.click(),
        pickFolder: () => folderInput.current?.click(),
        dragging,
      }}
    >
      <div
        className="contents"
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragging(false)
          }
        }}
        onDrop={async (e) => {
          e.preventDefault()
          setDragging(false)
          importPicked(await fromDataTransfer(e.dataTransfer))
        }}
      >
        {children}
      </div>
      <input
        ref={fileInput}
        type="file"
        multiple
        accept=".json,application/json"
        className="hidden"
        onChange={onChange}
      />
      <input
        ref={folderInput}
        type="file"
        className="hidden"
        {...{ webkitdirectory: "" }}
        onChange={onChange}
      />
    </ImportContext.Provider>
  )
}

export function ImportButtons() {
  const { pickFile, pickFolder } = React.useContext(ImportContext)
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={pickFolder}>
        <FolderOpenIcon data-icon="inline-start" />
        Folder
      </Button>
      <Button variant="outline" size="sm" onClick={pickFile}>
        <PlusIcon data-icon="inline-start" />
        File
      </Button>
    </div>
  )
}

// `compact` sits in the deck grid as an "add a deck" tile.
export function DropZone({
  compact,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  const { dragging } = React.useContext(ImportContext)
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 text-center text-muted-foreground transition-colors",
        compact ? "py-6" : "py-10",
        dragging && "border-primary bg-primary/5 text-foreground",
        className
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
        <FileJsonIcon className="size-6" />
      </span>
      {compact ? (
        <p className="text-sm">Drop a deck here, or</p>
      ) : (
        <p className="max-w-sm text-sm">
          Drop a <code className="font-mono">.ofc.json</code> file, or a deck
          folder with <code className="font-mono">deck.json</code> and its
          media.
        </p>
      )}
      <ImportButtons />
      {!compact && (
        <p className="text-xs">Decks and progress stay in this browser.</p>
      )}
    </div>
  )
}
