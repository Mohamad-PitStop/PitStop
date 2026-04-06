/** Normalisation et validation — localisation à l'inscription (Belgique). */

export function normalizePostalCode(raw: string): string {
  return raw.replace(/\s/g, "").trim()
}

/** Codes postaux belges : 4 chiffres (1000–9999). */
export function isValidBelgianPostalCode(normalized: string): boolean {
  return /^\d{4}$/.test(normalized)
}

export function normalizeCity(raw: string): string {
  return raw.trim().replace(/\s+/g, " ")
}

export function isValidCity(normalized: string): boolean {
  if (normalized.length < 2 || normalized.length > 80) return false
  return /^[\p{L}0-9\s'’.\-()]+$/u.test(normalized)
}
