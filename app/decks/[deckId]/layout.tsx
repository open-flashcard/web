import { DeckShell } from "@/features/deck/deck-shell"

export default function DeckLayout({
  children,
}: LayoutProps<"/decks/[deckId]">) {
  return <DeckShell>{children}</DeckShell>
}
