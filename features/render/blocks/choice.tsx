"use client"

import * as React from "react"
import { CheckIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ChoiceBlock } from "@/lib/ofc/types"
import { BlockContext } from "@/features/render/context"
import { Blocks } from "@/features/render/side"

export function Choice({ block: b }: { block: ChoiceBlock }) {
  const ctx = React.useContext(BlockContext)
  const { revealed } = ctx
  const multi = b.options.filter((o) => o.correct).length > 1
  const [order] = React.useState(() => {
    const idx = b.options.map((_, i) => i)
    if (!b.shuffle) return idx
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[idx[i], idx[j]] = [idx[j], idx[i]]
    }
    return idx
  })
  const [selected, setSelected] = React.useState<Set<number>>(new Set())
  const [checked, setChecked] = React.useState(false)
  const done = checked || revealed

  function pick(i: number) {
    if (done) return
    if (multi) {
      const next = new Set(selected)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      setSelected(next)
    } else {
      setSelected(new Set([i]))
      setChecked(true)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {multi && (
        <p className="text-xs text-muted-foreground">Select all that apply.</p>
      )}
      {order.map((i) => {
        const o = b.options[i]
        const isSelected = selected.has(i)
        return (
          <div key={o.id ?? i} className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => pick(i)}
              aria-pressed={isSelected}
              className={cn(
                "flex items-start gap-3 rounded-md border px-3 py-2 text-start transition-colors",
                !done && "hover:bg-muted",
                !done && isSelected && "border-primary bg-muted",
                done && o.correct && "border-green-600 bg-green-600/10",
                done &&
                  isSelected &&
                  !o.correct &&
                  "border-red-600 bg-red-600/10"
              )}
            >
              <span className="mt-1 size-4 shrink-0">
                {done && o.correct && (
                  <CheckIcon className="size-4 text-green-600" />
                )}
                {done && isSelected && !o.correct && (
                  <XIcon className="size-4 text-red-600" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <BlockContext.Provider value={{ ...ctx, sound: false }}>
                  <Blocks blocks={o.content} />
                </BlockContext.Provider>
              </div>
            </button>
            {done && isSelected && o.feedback && (
              <div className="ps-10 text-sm text-muted-foreground">
                <Blocks blocks={o.feedback} />
              </div>
            )}
          </div>
        )
      })}
      {multi && !done && (
        <button
          type="button"
          onClick={() => setChecked(true)}
          className="self-start text-sm text-primary underline underline-offset-4"
        >
          Check answer
        </button>
      )}
      {done && b.explanation && (
        <div className="rounded-md bg-muted/50 p-3 text-sm">
          <Blocks blocks={b.explanation} />
        </div>
      )}
    </div>
  )
}
