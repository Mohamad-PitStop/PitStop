/** Libelle affiche pour les options transmission (la valeur stockee reste inchangee). */
export function formatTransmissionOptionLabel(value: string, t: (key: string) => string): string {
  const v = value.trim()
  if (!v) return v
  const lower = v.toLowerCase()
  const normalized = lower
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()

  const autoTechKeywords = [
    "dsg",
    "dct",
    "tct",
    "edc",
    "pdk",
    "cvt",
    "tiptronic",
    "s tronic",
    "powershift",
  ]

  if (normalized.startsWith("manuelle") || normalized.startsWith("manual")) {
    const gearMatch = normalized.match(/\b(\d+)\b/)
    const gearCount = gearMatch ? gearMatch[1] : null
    const base = t("trans.manual")
    if (gearCount) return `${base} ${gearCount}${t("trans.gearsSuffix")}`
    return base
  }
  if (normalized.includes("semi") || normalized.includes("robotisee") || normalized.includes("robotized")) {
    return t("trans.semiAutomatic")
  }
  if (normalized.startsWith("automatique") || normalized.startsWith("automatic")) return t("trans.automatic")
  if (autoTechKeywords.some((kw) => normalized.includes(kw))) return t("trans.automatic")

  return v
}
