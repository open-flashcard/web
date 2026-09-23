"use client"

import { useLiveQuery } from "dexie-react-hooks"

import { db } from "@/lib/db"
import { progressFrom } from "@/lib/progress"

// XP, level and streak across every deck, live as reviews are added.
export function useProgress() {
  return useLiveQuery(async () =>
    progressFrom(await db.reviews.toArray(), new Date())
  )
}
