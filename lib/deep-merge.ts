/** Fusion récursive d’objets plain (feuilles : primitives / tableaux remplacés). */
export function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...target }
  for (const [k, v] of Object.entries(source)) {
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      const prev = out[k]
      out[k] = deepMerge(
        typeof prev === "object" && prev !== null && !Array.isArray(prev)
          ? (prev as Record<string, unknown>)
          : {},
        v as Record<string, unknown>
      )
    } else {
      out[k] = v
    }
  }
  return out
}

export function deepMergeAll(...parts: Record<string, unknown>[]) {
  return parts.reduce((a, b) => deepMerge(a, b), {} as Record<string, unknown>)
}
