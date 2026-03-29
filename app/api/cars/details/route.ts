import {
  getAvailableFuelTypesForSelection,
  getAvailableTransmissionTypesForSelection,
} from "@/lib/vehicle-compatibility-catalog"
import { getAvailableYearsForModel } from "@/lib/vehicle-year-catalog"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/cars/details?make=XXX&model=YYY — carburant, transmission, années depuis le catalogue statique uniquement (plus d’API Ninjas). */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const make = searchParams.get("make")?.trim()
    const model = searchParams.get("model")?.trim()
    if (!make || !model) {
      return Response.json({ ok: false, error: "make et model requis" }, { status: 400 })
    }

    const fuelTypes = getAvailableFuelTypesForSelection(make, model)
    const transmissions = getAvailableTransmissionTypesForSelection(make, model, "")
    const years = getAvailableYearsForModel(make, model, "", "")

    return Response.json({
      ok: true,
      fuelTypes: fuelTypes.length ? fuelTypes : undefined,
      transmissions: transmissions.length ? transmissions : undefined,
      years: years.length ? years.map(Number) : undefined,
    })
  } catch (error) {
    console.error("API cars/details error:", error)
    return Response.json(
      { ok: false, error: "Impossible de charger les détails." },
      { status: 500 }
    )
  }
}
