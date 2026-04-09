/** Formate la liste des communes renvoyées par l’API (noms uniques, lisibles). */
export function formatBelgianMunicipalityLine(names: string[], maxParts = 5): string {
  const u = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "fr-BE", { sensitivity: "base" })
  )
  if (u.length === 0) return ""
  if (u.length <= maxParts) return u.join(" · ")
  return `${u.slice(0, maxParts).join(" · ")} · …`
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
  const names = places.map((p) => p["place name"]).filter((n): n is string => typeof n === "string" && n.trim().length > 0)
  return [...new Set(names)]
}
