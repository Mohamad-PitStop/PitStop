/** Formate la liste des communes (noms uniques, lisibles). */
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

/** Fusionne les libellés qui désignent la même commune. */
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

/** Jeu bpost / géoréférencement — https://public.opendatasoft.com/explore/dataset/georef-belgium-postal-codes */
const ODS_BASE =
  "https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-belgium-postal-codes/records"

type OdsPostalRecord = {
  smun_name_fr?: string | null
  smun_name_nl?: string | null
  mun_name_fr?: string | null
  mun_name_nl?: string | null
}

/** Libellé d’affichage : FR prioritaire, sinon NL (sections bilingues / Flandre). */
function localityLabelFromRecord(r: OdsPostalRecord): string | null {
  const fr = (r.smun_name_fr ?? r.mun_name_fr)?.trim()
  if (fr) return fr
  const nl = (r.smun_name_nl ?? r.mun_name_nl)?.trim()
  return nl || null
}

/**
 * Communes / sections associées à un code postal (source : OpenDataSoft, jeu bpost « georef-belgium-postal-codes »).
 */
export async function fetchBelgianMunicipalitiesForPostal(postal: string): Promise<string[]> {
  const url = new URL(ODS_BASE)
  url.searchParams.set("limit", "100")
  url.searchParams.set("refine", `postcode:${postal}`)
  url.searchParams.set("select", "postcode,smun_name_fr,smun_name_nl,mun_name_fr,mun_name_nl")

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 86_400 },
  })
  if (!res.ok) return []

  const data = (await res.json()) as { results?: OdsPostalRecord[] }
  const rows = Array.isArray(data.results) ? data.results : []
  const names = rows
    .map(localityLabelFromRecord)
    .filter((n): n is string => typeof n === "string" && n.length > 0)

  return uniqueBelgianMunicipalityLabels(names)
}
