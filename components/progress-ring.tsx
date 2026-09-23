import { cn } from "@/lib/utils"

// A circular meter; `value` runs 0–1 and is clamped.
export function ProgressRing({
  value,
  size = 88,
  stroke = 9,
  className,
  children,
}: {
  value: number
  size?: number
  stroke?: number
  className?: string
  children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const clamped = Math.min(Math.max(value, 0), 1)
  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-current opacity-20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          className="stroke-current transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}
