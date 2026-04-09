/** Formate la liste des communes renvoyées par l’API (noms uniques, lisibles). */
export function formatBelgianMunicipalityLine(names: string[], maxParts = 5): string {
  const u = uniqueBelgianMunicipalityLabels(names.map((n) => n.trim()).filter(Boolean)).sort((a, b) =>
    a.localeCompare(b, "fr-BE", { sensitivity: "base" })
  )
  if (u.length === 0) return ""
  if (u.length <= maxParts) return u.join(" · ")
  return `${u.slice(0, maxParts).join(" · ")} · …`
}

/** Clé de dédoublonnage insensible aux accents, espaces, tirets et apostrophes. */
function belgianMunicipalityDedupeKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/['\u2019`]/g, "")
    .replace(/[·•,;]+/g, " ")
    .replace(/[-\s]+/g, "")
    .toLowerCase()
}

/**
 * Détecte une suite de mots répétée N fois (ex. « A A », « A B A B », « X X X » avec apostrophes différentes).
 */
function dedupeRepeatedWordRuns(raw: string): string {
  const unified = raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/['\u2019`]/g, "'")
  const words = unified.split(" ").filter(Boolean)
  if (words.length < 2) return unified

  for (let unitLen = 1; unitLen <= Math.floor(words.length / 2); unitLen++) {
    if (words.length % unitLen !== 0) continue
    const nrep = words.length / unitLen
    if (nrep < 2) continue
    const unit = words.slice(0, unitLen).join(" ")
    const key0 = belgianMunicipalityDedupeKey(unit)
    let ok = true
    for (let r = 1; r < nrep; r++) {
      const chunk = words.slice(r * unitLen, (r + 1) * unitLen).join(" ")
      if (belgianMunicipalityDedupeKey(chunk) !== key0) {
        ok = false
        break
      }
    }
    if (ok) return unit
  }
  return unified
}

/** Même chaîne répétée collée avec espaces (apostrophes unifiées au préalable). */
function dedupeDoubledWholeString(raw: string): string {
  let t = raw.trim().replace(/['\u2019`]/g, "'")
  for (let i = 0; i < 6; i++) {
    const m = t.match(/^(.+?)\s+\1$/iu)
    if (!m) break
    t = m[1]!.trim()
  }
  return t
}

/** Fusionne les libellés qui désignent la même commune (API ou saisie). */
function uniqueBelgianMunicipalityLabels(names: string[]): string[] {
  const chosen = new Map<string, string>()
  for (const name of names) {
    const k = belgianMunicipalityDedupeKey(name)
    if (!k) continue
    const prev = chosen.get(k)
    if (!prev) {
      chosen.set(k, name)
      continue
    }
    const pick =
      name.length > prev.length
        ? name
        : name.length < prev.length
          ? prev
          : name.localeCompare(prev, "fr-BE", { sensitivity: "variant" }) < 0
            ? name
            : prev
    chosen.set(k, pick)
  }
  return [...chosen.values()]
}

/**
 * Corrections ciblées après dédoublonnage (typos / graphie API vs commune officielle).
 */
function normalizeBelgianMunicipalityFromApi(raw: string): string {
  const once = dedupeDoubledWholeString(dedupeRepeatedWordRuns(raw))
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
  return uniqueBelgianMunicipalityLabels(names)
}
