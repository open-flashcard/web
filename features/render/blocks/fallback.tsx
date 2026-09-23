// `custom` blocks, and block types from a later 1.x this app doesn't know (§7.2).
export function Fallback({
  block,
}: {
  block: { type: string; fallback?: string }
}) {
  if (block.fallback) return <p>{block.fallback}</p>
  return (
    <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
      Content of type “{block.type}” can’t be shown.
    </p>
  )
}
