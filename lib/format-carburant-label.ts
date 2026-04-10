/** Libellé affiché pour les options carburant (la valeur stockée reste inchangée). */
export function formatCarburantOptionLabel(value: string, t: (key: string) => string): string {
  const v = value.trim()
  if (!v) return v
  const lower = v.toLowerCase()
  if (lower === "essence") return t("fuel.essence")
  if (lower === "diesel") return t("fuel.diesel")
  if (lower === "hybride") return t("fuel.hybride")
  if (lower === "hybride rechargeable") return t("fuel.hybrideRechargeable")
  if (lower === "electrique" || lower === "électrique") return t("fuel.electrique")
  if (lower === "gpl") return t("fuel.gpl")
  if (lower === "gnv") return t("fuel.gnv")
  if (lower === "ethanol (e85)" || lower === "éthanol (e85)" || lower === "e85") return t("fuel.ethanolE85")
  if (lower === "hydrogene" || lower === "hydrogène") return t("fuel.hydrogene")
  return v
}
