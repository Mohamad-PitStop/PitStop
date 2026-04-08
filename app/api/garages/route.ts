import { NextResponse } from "next/server"
import { listApprovedGarages } from "@/lib/garage-db"

export const runtime = "nodejs"

// Coordonnées approximatives par code postal belge (premiers chiffres)
const POSTAL_COORDS: Record<string, { lat: number; lng: number }> = {
  "10": { lat: 50.85, lng: 4.35 }, // Bruxelles
  "11": { lat: 50.88, lng: 4.35 },
  "12": { lat: 50.82, lng: 4.30 },
  "13": { lat: 50.72, lng: 4.40 },
  "14": { lat: 50.90, lng: 4.45 },
  "15": { lat: 50.98, lng: 4.50 },
  "16": { lat: 50.85, lng: 4.70 },
  "17": { lat: 50.85, lng: 4.00 },
  "18": { lat: 50.95, lng: 4.30 },
  "19": { lat: 50.75, lng: 4.25 },
  "20": { lat: 51.22, lng: 4.40 }, // Antwerpen
  "21": { lat: 51.18, lng: 4.42 },
  "22": { lat: 51.15, lng: 4.45 },
  "23": { lat: 51.10, lng: 4.50 },
  "24": { lat: 51.05, lng: 4.70 },
  "25": { lat: 51.00, lng: 4.48 },
  "26": { lat: 51.12, lng: 4.30 },
  "27": { lat: 51.15, lng: 4.25 },
  "28": { lat: 51.10, lng: 4.35 },
  "29": { lat: 51.22, lng: 4.55 },
  "30": { lat: 50.88, lng: 4.70 }, // Leuven
  "31": { lat: 50.85, lng: 4.75 },
  "32": { lat: 50.90, lng: 4.80 },
  "33": { lat: 50.82, lng: 4.85 },
  "34": { lat: 50.80, lng: 4.70 },
  "35": { lat: 50.92, lng: 4.62 },
  "36": { lat: 50.95, lng: 5.35 },
  "37": { lat: 50.80, lng: 5.20 },
  "38": { lat: 50.75, lng: 5.00 },
  "39": { lat: 50.95, lng: 5.10 },
  "40": { lat: 50.63, lng: 5.57 }, // Liège
  "41": { lat: 50.60, lng: 5.55 },
  "42": { lat: 50.58, lng: 5.60 },
  "43": { lat: 50.55, lng: 5.50 },
  "44": { lat: 50.65, lng: 5.45 },
  "45": { lat: 50.50, lng: 5.70 },
  "46": { lat: 50.45, lng: 5.80 },
  "47": { lat: 50.60, lng: 5.85 },
  "48": { lat: 50.30, lng: 5.85 },
  "49": { lat: 50.35, lng: 5.95 },
  "50": { lat: 50.46, lng: 3.95 }, // Namur
  "51": { lat: 50.48, lng: 3.90 },
  "52": { lat: 50.43, lng: 3.85 },
  "53": { lat: 50.40, lng: 3.80 },
  "54": { lat: 50.30, lng: 4.00 },
  "55": { lat: 50.25, lng: 4.85 },
  "56": { lat: 50.45, lng: 4.45 },
  "57": { lat: 50.60, lng: 3.40 },
  "60": { lat: 50.42, lng: 4.44 }, // Charleroi
  "61": { lat: 50.40, lng: 4.45 },
  "62": { lat: 50.38, lng: 4.50 },
  "63": { lat: 50.35, lng: 4.55 },
  "64": { lat: 50.50, lng: 4.30 },
  "65": { lat: 50.55, lng: 4.20 },
  "70": { lat: 50.45, lng: 3.95 }, // Mons
  "71": { lat: 50.48, lng: 3.90 },
  "72": { lat: 50.42, lng: 3.85 },
  "73": { lat: 50.40, lng: 3.80 },
  "74": { lat: 50.55, lng: 3.60 },
  "75": { lat: 50.50, lng: 3.50 },
  "76": { lat: 50.60, lng: 3.45 },
  "77": { lat: 50.50, lng: 3.70 },
  "78": { lat: 50.82, lng: 3.28 },
  "79": { lat: 50.78, lng: 3.32 },
  "80": { lat: 50.85, lng: 3.10 }, // Brugge
  "81": { lat: 50.83, lng: 3.05 },
  "82": { lat: 50.87, lng: 3.15 },
  "83": { lat: 50.90, lng: 3.20 },
  "84": { lat: 51.05, lng: 2.85 },
  "85": { lat: 51.10, lng: 2.90 },
  "86": { lat: 50.82, lng: 3.35 },
  "87": { lat: 50.80, lng: 3.40 },
  "88": { lat: 51.00, lng: 3.50 },
  "89": { lat: 50.80, lng: 3.80 },
  "90": { lat: 51.05, lng: 3.72 }, // Gent
  "91": { lat: 51.08, lng: 3.75 },
  "92": { lat: 51.02, lng: 3.68 },
  "93": { lat: 51.00, lng: 3.65 },
  "94": { lat: 51.03, lng: 3.60 },
  "95": { lat: 50.92, lng: 3.55 },
  "96": { lat: 50.95, lng: 3.80 },
  "97": { lat: 50.90, lng: 3.90 },
  "98": { lat: 51.10, lng: 3.55 },
  "99": { lat: 51.15, lng: 3.60 },
}

function getPostalCoords(postalCode: string): { lat: number; lng: number } | null {
  const prefix = postalCode.substring(0, 2)
  return POSTAL_COORDS[prefix] ?? null
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const userPostal = url.searchParams.get("postalCode") || ""
    const garages = await listApprovedGarages()

    const userCoords = userPostal ? getPostalCoords(userPostal) : null

    const result = garages.map((g) => {
      const garageCoords = getPostalCoords(g.postalCode)
      let distance: number | null = null
      if (userCoords && garageCoords) {
        distance = Math.round(haversineKm(userCoords.lat, userCoords.lng, garageCoords.lat, garageCoords.lng) * 10) / 10
      }
      return {
        id: g.id,
        companyName: g.companyName,
        street: g.street,
        postalCode: g.postalCode,
        city: g.city,
        specialties: JSON.parse(g.specialties),
        distance,
      }
    })

    // Sort by distance if available
    if (userCoords) {
      result.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
    }

    return NextResponse.json({ ok: true, garages: result })
  } catch (error) {
    console.error("GET /api/garages error:", error)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
