import { carModels } from "@/lib/vehicle-model-catalog"
import {
  getAvailableFuelTypesForSelection,
  getAvailableTransmissionTypesForSelection,
} from "@/lib/vehicle-compatibility-catalog"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/cars/models?make=XXX — modèles et options depuis le catalogue statique uniquement (plus d’API Ninjas). */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const make = searchParams.get("make")?.trim()
    if (!make) {
      return Response.json({ ok: false, error: "make requis" }, { status: 400 })
    }

    const models = carModels[make] ?? []
    const fuelTypes = getAvailableFuelTypesForSelection(make, "")
    const transmissions = getAvailableTransmissionTypesForSelection(make, "", "")

    return Response.json({
      ok: true,
      models,
      fuelTypes: fuelTypes.length ? fuelTypes : undefined,
      transmissions: transmissions.length ? transmissions : undefined,
    })
  } catch (error) {
    console.error("API cars/models error:", error)
    const make = new URL(req.url).searchParams.get("make")?.trim()
    return Response.json({ ok: true, models: make ? (carModels[make] ?? []) : [] })
  }
}
