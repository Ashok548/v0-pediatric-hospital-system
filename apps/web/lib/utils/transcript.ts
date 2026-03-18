export function appendTranscript(existing: string, generated: string): string {
  const cleanGenerated = generated.trim()
  if (!cleanGenerated) return existing
  return existing.trim().length > 0
    ? `${existing.trimEnd()} ${cleanGenerated}`
    : cleanGenerated
}