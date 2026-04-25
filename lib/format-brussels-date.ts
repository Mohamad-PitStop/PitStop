/**
 * Helpers de formatage de dates côté Bruxelles.
 *
 * SQLite via `CURRENT_TIMESTAMP` retourne une chaîne UTC sans suffixe
 * (ex : `"2026-04-22 05:01:00"`). En JavaScript, `new Date(str)` interprète
 * alors cette chaîne comme une heure LOCALE, ce qui décale l'affichage de
 * +1 ou +2 heures selon la saison. On normalise donc la chaîne avant de
 * formater dans le fuseau Europe/Brussels.
 */

const BRUSSELS_TZ = "Europe/Brussels"

/**
 * Convertit une chaîne SQLite/Postgres en `Date` interprétée comme UTC.
 * Si la chaîne porte déjà une indication de fuseau (`Z` ou `±HH:MM`), elle
 * est utilisée telle quelle.
 */
function parseAsUtc(input: string): Date {
  const trimmed = input.trim()
  if (!trimmed) return new Date(NaN)
  // Déjà au format ISO avec fuseau (Z ou ±HH:MM) ?
  if (/[zZ]$/.test(trimmed) || /[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    return new Date(trimmed)
  }
  // Format SQLite "YYYY-MM-DD HH:MM:SS[.fff]" → on en fait un ISO UTC.
  const isoLike = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T")
  return new Date(`${isoLike}Z`)
}

/**
 * Normalise une valeur DATETIME (libsql / Date / chaîne) en chaîne ISO UTC
 * stricte, prête à être consommée côté client. Retourne `null` si la valeur
 * est absente ou non parseable.
 */
export function toIsoUtc(value: unknown): string | null {
  if (value == null) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString()
  }
  const str = String(value).trim()
  if (!str) return null
  const d = parseAsUtc(str)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export function formatBrusselsDateTime(input: string | null | undefined): string {
  if (!input) return "—"
  const d = parseAsUtc(input)
  if (Number.isNaN(d.getTime())) return input
  try {
    return new Intl.DateTimeFormat("fr-BE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: BRUSSELS_TZ,
    }).format(d)
  } catch {
    return input
  }
}

export function formatBrusselsDate(input: string | null | undefined): string {
  if (!input) return "—"
  const d = parseAsUtc(input)
  if (Number.isNaN(d.getTime())) return input
  try {
    return new Intl.DateTimeFormat("fr-BE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: BRUSSELS_TZ,
    }).format(d)
  } catch {
    return input
  }
}
