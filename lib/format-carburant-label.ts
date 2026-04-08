/** Libellé affiché pour les options carburant (la valeur stockée reste inchangée). */
export function formatCarburantOptionLabel(value: string, t: (key: string) => string): string {
  const v = value.trim()
  if (!v) return v
  const lower = v.toLowerCase()
  if (lower === "essence") return t("fuel.essence")
  if (lower === "diesel") return t("fuel.diesel")
  return v
}
