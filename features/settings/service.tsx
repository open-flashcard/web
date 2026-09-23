"use client"

import * as React from "react"
import { Loader2Icon, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

export type Connection<T> =
  | { status: "idle" }
  | { status: "connecting" }
  | { status: "connected"; data: T }
  | { status: "error"; error: string }

// Connecting to an external server: nothing until asked (or `auto`, for a
// server connected before), then what it reported or why it failed.
export function useConnection<T>(load: () => Promise<T>, auto: boolean) {
  const [state, setState] = React.useState<Connection<T>>({ status: "idle" })
  const loadRef = React.useRef(load)
  React.useEffect(() => {
    loadRef.current = load
  })

  const connect = React.useCallback(async () => {
    setState({ status: "connecting" })
    try {
      setState({ status: "connected", data: await loadRef.current() })
    } catch (e) {
      setState({ status: "error", error: (e as Error).message })
    }
  }, [])

  const tried = React.useRef(false)
  React.useEffect(() => {
    if (!auto || tried.current) return
    tried.current = true
    connect()
  }, [auto, connect])

  return { state, connect, reset: () => setState({ status: "idle" }) }
}

// A card for one external service, with its on/off switch.
export function ServiceCard({
  title,
  description,
  enabled,
  onEnabledChange,
  children,
}: {
  title: string
  description: React.ReactNode
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-extrabold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onEnabledChange}
          aria-label={`Use ${title.toLowerCase()}`}
          className="mt-1"
        />
      </div>
      {enabled && children}
    </section>
  )
}

export function StatusLine<T>({
  state,
  connected,
}: {
  state: Connection<T>
  connected: (data: T) => string
}) {
  if (state.status === "idle") return null
  return (
    <p
      className={cn(
        "flex items-center gap-2 text-sm",
        state.status === "error" ? "text-destructive" : "text-muted-foreground"
      )}
    >
      {state.status === "connecting" ? (
        <Loader2Icon className="size-3.5 animate-spin" />
      ) : (
        <span
          className={cn(
            "size-2 rounded-full",
            state.status === "connected" ? "bg-success" : "bg-destructive"
          )}
        />
      )}
      {state.status === "connecting" && "Connecting…"}
      {state.status === "connected" && connected(state.data)}
      {state.status === "error" && state.error}
    </p>
  )
}

export const field =
  "h-8 w-full min-w-0 rounded-lg border bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&>optgroup]:bg-background [&>option]:bg-background"

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

// One titled step of a service card: Server, Voices, Model…
export function Step({
  icon: Icon,
  title,
  aside,
  children,
}: {
  icon: LucideIcon
  title: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
        {aside && (
          <span className="ms-auto text-xs text-muted-foreground">{aside}</span>
        )}
      </div>
      {children}
    </div>
  )
}
