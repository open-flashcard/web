"use client"

import * as React from "react"

import type { Dir, Speech } from "@/lib/ofc/types"

export interface BlockCtx {
  revealed: boolean
  lang?: string
  dir: Dir
  // False inside choice options: they are buttons, and can't contain buttons.
  sound?: boolean
}

export const BlockContext = React.createContext<BlockCtx>({
  revealed: false,
  dir: "ltr",
  sound: true,
})

// The speaker and play buttons that sit at the end of a textual block.
export type SoundSlot = (text: string, speech?: Speech) => React.ReactNode
