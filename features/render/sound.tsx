"use client"

import * as React from "react"
import { PlayIcon, SquareIcon, Volume2Icon, VolumeXIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { serverSpeaks, subscribeTts, synthesize, voiceSpeed } from "@/lib/tts"
import type { AudioBlock, Speech } from "@/lib/ofc/types"

// One sound at a time across the whole page: starting one stops the last.
let active: { stop: () => void } | null = null

type Start = (done: () => void) => () => void

function useSound() {
  const [playing, setPlaying] = React.useState(false)
  const handle = React.useRef<{ stop: () => void } | null>(null)

  // Leaving the card stops its sound.
  React.useEffect(() => () => handle.current?.stop(), [])

  function toggle(start: Start) {
    if (handle.current) {
      handle.current.stop()
      return
    }
    active?.stop()
    let halt = () => {}
    const h = {
      stop() {
        halt()
        done()
      },
    }
    function done() {
      if (handle.current !== h) return
      handle.current = null
      if (active === h) active = null
      setPlaying(false)
    }
    handle.current = h
    active = h
    setPlaying(true)
    halt = start(done)
  }

  return { playing, toggle }
}

// Whether the TTS server is set up to speak `lang`, updating when settings change.
export function useServerSpeaks(lang?: string) {
  return React.useSyncExternalStore(
    subscribeTts,
    () => serverSpeaks(lang),
    () => false
  )
}

const canSpeak = () =>
  typeof window !== "undefined" && "speechSynthesis" in window

// Local TTS server first (see lib/tts.ts), then the browser's own voice.
function speak(text: string, lang?: string, speech?: Speech): Start {
  return (done) => {
    const spoken = speech?.text ?? text
    const voiceLang = speech?.lang ?? lang
    let stopped = false
    let halt = () => {}

    const browser = () => {
      if (!stopped) halt = browserSpeak(spoken, voiceLang, speech)(done)
    }

    if (serverSpeaks(voiceLang)) {
      const request = new AbortController()
      halt = () => request.abort()
      synthesize(spoken, voiceLang, {
        rate: speech?.rate,
        signal: request.signal,
      }).then(
        (blob) => {
          if (stopped) return
          const url = URL.createObjectURL(blob)
          const stop = play(url)(() => {
            URL.revokeObjectURL(url)
            done()
          })
          halt = () => {
            stop()
            URL.revokeObjectURL(url)
          }
        },
        (error) => {
          console.warn("TTS server failed, using the browser voice:", error)
          browser()
        }
      )
    } else {
      browser()
    }

    return () => {
      stopped = true
      halt()
    }
  }
}

function browserSpeak(text: string, lang?: string, speech?: Speech): Start {
  return (done) => {
    const u = new SpeechSynthesisUtterance(text)
    if (lang) u.lang = lang
    u.rate = voiceSpeed(lang) * (speech?.rate ?? 1)
    if (speech?.pitch !== undefined) u.pitch = speech.pitch
    const voice = speechSynthesis
      .getVoices()
      .find((v) => v.name === speech?.voice)
    if (voice) u.voice = voice
    u.onend = done
    u.onerror = done
    speechSynthesis.cancel()
    speechSynthesis.speak(u)
    return () => speechSynthesis.cancel()
  }
}

function play(src: string, start?: number, end?: number): Start {
  return (done) => {
    const audio = new Audio(src)
    audio.addEventListener("loadedmetadata", () => {
      if (start) audio.currentTime = start
    })
    audio.addEventListener("timeupdate", () => {
      if (end !== undefined && audio.currentTime >= end) {
        audio.pause()
        done()
      }
    })
    audio.onended = done
    audio.onerror = done
    audio.play().catch(done)
    return () => audio.pause()
  }
}

// Reads a textual block aloud with the browser's speech engine.
export function Speak({
  text,
  lang,
  speech,
}: {
  text: string
  lang?: string
  speech: Speech
}) {
  const { playing, toggle } = useSound()
  const server = useServerSpeaks(speech.lang ?? lang)
  if (!canSpeak()) return null
  return (
    <SoundButton
      playing={playing}
      label={server ? "Read aloud (TTS server)" : "Read aloud (browser voice)"}
      icon={<Volume2Icon className="size-4" />}
      onClick={() => toggle(speak(text, lang, speech))}
    />
  )
}

// An audio block plays its own file, and nothing else: reading text aloud is
// the speaker button's job (`Speak`). A missing file is shown as missing.
export function AudioButton({
  block,
  src,
  showTranscript,
}: {
  block: AudioBlock
  src: string | null
  showTranscript?: boolean
}) {
  const { playing, toggle } = useSound()
  const transcript = block.transcript ?? block.caption

  if (!src) {
    return (
      <span
        title={`Audio file not available: ${block.src}`}
        className="inline-flex items-center gap-2 align-middle text-sm text-muted-foreground/60"
      >
        <span className="inline-flex size-7 items-center justify-center">
          <VolumeXIcon className="size-4" />
        </span>
        {showTranscript && transcript}
      </span>
    )
  }

  const start = play(src, block.start, block.end)
  if (showTranscript && transcript) {
    return (
      <button
        type="button"
        data-sound
        onClick={() => toggle(start)}
        title="Play audio"
        className="inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-start text-sm transition-colors hover:bg-muted"
      >
        {playing ? (
          <SquareIcon className="size-3 shrink-0 fill-current" />
        ) : (
          <PlayIcon className="size-3.5 shrink-0 fill-current" />
        )}
        <span>{transcript}</span>
      </button>
    )
  }
  return (
    <SoundButton
      playing={playing}
      label="Play audio"
      icon={<PlayIcon className="size-3.5 fill-current" />}
      onClick={() => toggle(start)}
    />
  )
}

function SoundButton({
  playing,
  label,
  icon,
  onClick,
}: {
  playing: boolean
  label: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      data-sound
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-full align-middle text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
    >
      {playing ? <SquareIcon className="size-3 fill-current" /> : icon}
    </button>
  )
}
