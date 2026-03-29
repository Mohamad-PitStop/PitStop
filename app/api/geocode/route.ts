import { z } from "zod"

export const runtime = "nodejs"

const QuerySchema = z.object({
  q: z.string().min(2),
})

type NominatimResult = {
  lat?: string
  lon?: string
  display_name?: string
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const { q } = QuerySchema.parse({ q: url.searchParams.get("q") ?? "" })

    // Nominatim usage policy: provide a valid User-Agent and keep requests reasonable.
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
      {
        headers: {
          "User-Agent": "PitStop/1.0 (geocoding; contact: dev@pitstop.local)",
          "Accept-Language": "fr",
        },
        cache: "no-store",
      }
    )

    if (!res.ok) {
      return Response.json({ ok: false, error: "Erreur de géocodage" }, { status: 502 })
    }

    const data = (await res.json()) as NominatimResult[]
    const first = data?.[0]
    const lat = first?.lat ? Number(first.lat) : NaN
    const lng = first?.lon ? Number(first.lon) : NaN
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return Response.json({ ok: false, error: "Adresse introuvable" }, { status: 404 })
    }

    return Response.json({ ok: true, lat, lng, label: first?.display_name ?? q })
  } catch (error) {
    console.error("Erreur geocode:", error)
    return Response.json({ ok: false, error: "Requête invalide" }, { status: 400 })
  }
}

