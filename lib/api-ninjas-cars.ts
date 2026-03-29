/**
 * Server-side only: calls API Ninjas Cars API.
 * Key must be in env API_NINJAS_KEY (never exposed to frontend).
 */

const BASE = "https://api.api-ninjas.com/v1/cars"

export type NinjasCar = {
  make?: string
  model?: string
  year?: number
  fuel_type?: string
  transmission?: string
  class?: string
  [key: string]: unknown
}

function getKey(): string {
  const key = process.env.API_NINJAS_KEY
  if (!key) throw new Error("API_NINJAS_KEY is not set")
  return key
}

async function fetchNinjas<T>(params: Record<string, string | number>): Promise<T[]> {
  const url = new URL(BASE)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const res = await fetch(url.toString(), {
    headers: { "X-Api-Key": getKey() },
    next: { revalidate: 3600 },
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`API Ninjas error ${res.status}: ${t}`)
  }
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

/** Fetch cars with optional make, model, year. Limit max 50 per request. */
export async function fetchCars(options: {
  make?: string
  model?: string
  year?: number
  limit?: number
}): Promise<NinjasCar[]> {
  const params: Record<string, string | number> = {
    limit: Math.min(options.limit ?? 50, 50),
  }
  if (options.make) params.make = options.make
  if (options.model) params.model = options.model
  if (options.year != null) params.year = options.year
  return fetchNinjas<NinjasCar>(params)
}

/** Normalize make for display (capitalize). */
export function normalizeMake(raw: string): string {
  const s = (raw ?? "").trim()
  if (!s) return ""
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

/** Normalize model for display. */
export function normalizeModel(raw: string): string {
  return (raw ?? "").trim() || ""
}

/** Map API fuel_type to our labels. */
export function mapFuelType(api: string | undefined): string {
  if (!api) return ""
  const v = api.toLowerCase()
  if (v === "gas" || v === "essence") return "Essence"
  if (v === "diesel") return "Diesel"
  if (v === "electric" || v === "electricity") return "Électrique"
  if (v === "hybrid" || v === "hybrid (premium)" || v === "hybrid (plugin)" || v === "plug-in hybrid") return "Hybride rechargeable"
  if (v.includes("hybrid")) return "Hybride"
  if (v === "flex fuel" || v === "e85") return "E85"
  if (v === "natural gas" || v === "cng") return "GNV"
  if (v === "lpg" || v === "gpl") return "GPL"
  if (v === "hydrogen") return "Hydrogène"
  return normalizeMake(api)
}

/** Map API transmission to our labels. */
export function mapTransmission(api: string | undefined): string {
  if (!api) return ""
  const v = String(api).toLowerCase()
  if (v === "a" || v === "automatic" || v === "auto") return "Automatique"
  if (v === "m" || v === "manual") return "Manuelle"
  if (v.includes("automated") || v.includes("robot") || v.includes("dct") || v.includes("dual clutch")) return "Semi-automatique (robotisée)"
  if (v.includes("cvt")) return "Automatique"
  return (api as string).trim()
}
