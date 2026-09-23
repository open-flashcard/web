import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"

// Title bar for pages below the deck list, with a way back to it.
export function PageHeader({
  title,
  children,
}: {
  title?: string
  children?: React.ReactNode
}) {
  return (
    <header className="flex items-center gap-2">
      <Link
        href="/"
        aria-label="Back to decks"
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        <ArrowLeftIcon />
      </Link>
      <h1 className="min-w-0 flex-1 truncate font-heading text-2xl font-extrabold tracking-tight">
        {title}
      </h1>
      {children}
    </header>
  )
}
