/** Libelle affiche pour les options transmission (la valeur stockee reste inchangee). */
export function formatTransmissionOptionLabel(value: string, t: (key: string) => string): string {
  const v = value.trim()
  if (!v) return v
  const lower = v.toLowerCase()

  if (lower === "manuelle") return t("trans.manual")
  if (lower === "automatique") return t("trans.automatic")
  if (lower === "semi-automatique (robotisee)" || lower === "semi-automatique (robotisée)") {
    return t("trans.semiAutomatic")
  }
  return v
}
