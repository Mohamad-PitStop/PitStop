import { carBrands } from "@/lib/vehicle-model-catalog"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/cars/makes : marques depuis le catalogue statique uniquement (plus d’API Ninjas). */
export async function GET() {
  try {
    return Response.json({ ok: true, makes: carBrands })
  } catch (error) {
    console.error("API cars/makes error:", error)
    return Response.json({ ok: true, makes: carBrands })
  }
}
