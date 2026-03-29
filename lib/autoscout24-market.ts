type ComparableListing = {
  title: string
  priceEur: number
  url?: string
}

export type AutoScout24MarketSnapshot = {
  source: "AutoScout24.be"
  searchUrl: string
  query: string
  sampleSize: number
  marketLow: number
  marketMedian: number
  marketHigh: number
  listings: ComparableListing[]
}

type SearchInput = {
  marque: string
  modele: string
  variante?: string
  annee?: string
  kilometrage?: string
  carburant?: string
  transmission?: string
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

function parseInteger(value?: string): number | null {
  if (!value) return null
  const cleaned = value.replace(/[^\d]/g, "")
  if (!cleaned) return null
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : null
}

function mapFuelToAutoscout(value?: string): string | null {
  const v = (value || "").toLowerCase()
  if (v.includes("diesel")) return "D"
  if (v.includes("essence")) return "B"
  if (v.includes("electrique") || v.includes("électrique")) return "E"
  if (v.includes("hybride rechargeable")) return "2"
  if (v.includes("hybride")) return "3"
  if (v.includes("gpl")) return "LPG"
  if (v.includes("gnv") || v.includes("cng")) return "C"
  return null
}

function mapGearToAutoscout(value?: string): string | null {
  const v = (value || "").toLowerCase()
  if (v.includes("automatique")) return "A"
  if (v.includes("manuelle")) return "M"
  return null
}

function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  if (sorted.length === 1) return sorted[0]
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  const weight = idx - lo
  return Math.round(sorted[lo] * (1 - weight) + sorted[hi] * weight)
}

function buildSearchUrl(input: SearchInput): { url: string; query: string } {
  const query = normalizeWhitespace(
    [input.marque, input.modele, input.variante].filter(Boolean).join(" ")
  )
  const params = new URLSearchParams()
  params.set("sort", "standard")
  params.set("desc", "0")
  params.set("cy", "B")
  params.set("atype", "C")
  params.set("ustate", "N,U")
  params.set("q", query)

  const year = parseInteger(input.annee)
  if (year) {
    params.set("fregfrom", String(Math.max(1950, year - 1)))
    params.set("fregto", String(year + 1))
  }

  const km = parseInteger(input.kilometrage)
  if (km != null && km >= 0) {
    const kmFrom = Math.max(0, Math.round(km * 0.7))
    const kmTo = Math.min(350000, Math.round(km * 1.3))
    params.set("kmfrom", String(kmFrom))
    params.set("kmto", String(kmTo))
  }

  const fuel = mapFuelToAutoscout(input.carburant)
  if (fuel) params.set("fuel", fuel)

  const gear = mapGearToAutoscout(input.transmission)
  if (gear) params.set("gear", gear)

  return {
    query,
    url: `https://www.autoscout24.be/fr/lst?${params.toString()}`,
  }
}

function extractPricesFromHtml(html: string): number[] {
  const prices = new Set<number>()

  // JSON-LD often carries clean numeric prices.
  const ldMatches = html.matchAll(/"price"\s*:\s*"(\d{3,7})"/g)
  for (const m of ldMatches) {
    const num = Number(m[1])
    if (num >= 500 && num <= 500000) prices.add(num)
  }

  // Fallback plain-text euro values.
  const eurMatches = html.matchAll(/(\d{1,3}(?:[.\s]\d{3})+|\d{3,7})\s?€/g)
  for (const m of eurMatches) {
    const raw = m[1].replace(/[.\s]/g, "")
    const num = Number(raw)
    if (Number.isFinite(num) && num >= 500 && num <= 500000) prices.add(num)
  }

  return Array.from(prices)
}

function extractListingsFromHtml(html: string): ComparableListing[] {
  const listings: ComparableListing[] = []
  const reg = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g
  for (const m of html.matchAll(reg)) {
    if (listings.length >= 12) break
    const href = m[1]
    if (!href.includes("/offres/")) continue

    const inner = m[2].replace(/<[^>]+>/g, " ")
    const title = normalizeWhitespace(inner)
    if (!title || title.length < 10) continue

    const neighborhood = html.slice(Math.max(0, m.index ?? 0), (m.index ?? 0) + 1200)
    const priceMatch = neighborhood.match(/(\d{1,3}(?:[.\s]\d{3})+|\d{3,7})\s?€/)
    if (!priceMatch) continue

    const price = Number(priceMatch[1].replace(/[.\s]/g, ""))
    if (!Number.isFinite(price) || price < 500 || price > 500000) continue

    listings.push({
      title,
      priceEur: price,
      url: href.startsWith("http") ? href : `https://www.autoscout24.be${href}`,
    })
  }

  return listings
}

export async function fetchAutoScout24MarketSnapshot(
  input: SearchInput
): Promise<AutoScout24MarketSnapshot | null> {
  const { url, query } = buildSearchUrl(input)
  if (!query) return null

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "fr-BE,fr;q=0.9,en;q=0.8",
    },
    cache: "no-store",
  })

  if (!res.ok) return null
  const html = await res.text()
  if (!html || html.length < 2000) return null

  const pricePool = extractPricesFromHtml(html).sort((a, b) => a - b)
  if (pricePool.length < 3) return null

  const marketLow = quantile(pricePool, 0.2)
  const marketMedian = quantile(pricePool, 0.5)
  const marketHigh = quantile(pricePool, 0.8)
  const listings = extractListingsFromHtml(html)

  return {
    source: "AutoScout24.be",
    searchUrl: url,
    query,
    sampleSize: pricePool.length,
    marketLow,
    marketMedian,
    marketHigh,
    listings,
  }
}
