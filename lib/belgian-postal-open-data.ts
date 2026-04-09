/** Formate la liste des communes renvoyées par l’API (noms uniques, lisibles). */
export function formatBelgianMunicipalityLine(names: string[], maxParts = 5): string {
  const u = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "fr-BE", { sensitivity: "base" })
  )
  if (u.length === 0) return ""
  if (u.length <= maxParts) return u.join(" · ")
  return `${u.slice(0, maxParts).join(" · ")} · …`
}

/**
 * Zippopotam renvoie parfois le même libellé deux fois collé (ex. « X X »).
 */
function dedupeRepeatedPlaceNameSegment(raw: string): string {
  let t = raw.trim()
  for (let i = 0; i < 4; i++) {
    const m = t.match(/^(.+?)\s+\1$/iu)
    if (!m) break
    t = m[1]!.trim()
  }
  return t
}

/**
 * Corrections ciblées après dédoublonnage (typos / graphie API vs commune officielle).
 */
function normalizeBelgianMunicipalityFromApi(raw: string): string {
  const once = dedupeRepeatedPlaceNameSegment(raw)
  const compact = once
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/['\u2019`]/g, "'")
    .replace(/[-\s]+/g, "")
    .toLowerCase()

  if (compact === "brainelalleud") return "Braine-l'Alleud"

  return once.trim()
}

type ZippopotamPlace = { "place name"?: string }
type ZippopotamResponse = { places?: ZippopotamPlace[] }

export async function fetchBelgianMunicipalitiesForPostal(postal: string): Promise<string[]> {
  const res = await fetch(`https://api.zippopotam.us/be/${encodeURIComponent(postal)}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86_400 },
  })
  if (!res.ok) return []
  const data = (await res.json()) as ZippopotamResponse
  const places = Array.isArray(data.places) ? data.places : []
  const names = places
    .map((p) => p["place name"])
    .filter((n): n is string => typeof n === "string" && n.trim().length > 0)
    .map(normalizeBelgianMunicipalityFromApi)
    .filter((n) => n.length > 0)
  return [...new Set(names)]
}
