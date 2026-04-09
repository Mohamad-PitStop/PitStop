import { formatBelgianMunicipalityLine } from "@/lib/belgian-postal-open-data"

function normBelgianLocationToken(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/['\u2019`]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/\s*·\s*/g, "·")
    .trim()
    .toLowerCase()
}

function tokensRoughlyMatch(a: string, b: string): boolean {
  const na = normBelgianLocationToken(a)
  const nb = normBelgianLocationToken(b)
  if (!na || !nb) return false
  if (na === nb) return true
  if (na.length < 3 || nb.length < 3) return na === nb
  return nb.includes(na) || na.includes(nb)
}

/** La commune saisie correspond-elle à au moins une commune renvoyée pour ce code postal ? */
export function cityMatchesBelgianMunicipalities(city: string, municipalities: string[]): boolean {
  const trimmed = city.trim()
  if (!trimmed || municipalities.length === 0) return false

  const line = formatBelgianMunicipalityLine(municipalities)
  if (normBelgianLocationToken(trimmed) === normBelgianLocationToken(line)) return true

  for (const m of municipalities) {
    if (tokensRoughlyMatch(trimmed, m)) return true
  }

  const parts = trimmed
    .split(/·|•/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length > 1) {
    return parts.every((p) => municipalities.some((m) => tokensRoughlyMatch(p, m)))
  }

  return false
}
