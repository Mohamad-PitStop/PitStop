/** Aplatisit un arbre d’objets en clés pointées ; seules les feuilles string sont conservées. */
export function flattenMessages(
  obj: Record<string, unknown>,
  prefix = ""
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (typeof v === "string") {
      out[key] = v
    } else if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flattenMessages(v as Record<string, unknown>, key))
    }
  }
  return out
}
