/** Libellé affiché pour les options carburant (la valeur stockée reste inchangée). */
export function formatCarburantOptionLabel(value: string): string {
  const v = value.trim()
  if (!v) return v
  const lower = v.toLowerCase()
  if (lower === "essence") return "Essence"
  if (lower === "diesel") return "Diesel"
  return v
}
