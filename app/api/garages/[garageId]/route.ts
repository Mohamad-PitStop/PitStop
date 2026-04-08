import { NextResponse } from "next/server"
import { findGarageById } from "@/lib/garage-db"

export const runtime = "nodejs"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ garageId: string }> }
) {
  try {
    const { garageId } = await params
    const garage = await findGarageById(garageId)
    if (!garage || garage.status !== "approved") {
      return NextResponse.json({ ok: false, error: "Garage non trouvé." }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      garage: {
        id: garage.id,
        companyName: garage.companyName,
        street: garage.street,
        postalCode: garage.postalCode,
        city: garage.city,
        specialties: JSON.parse(garage.specialties),
        businessHours: JSON.parse(garage.businessHours),
        professionalPhone: garage.professionalPhone,
        professionalEmail: garage.professionalEmail,
      },
    })
  } catch (error) {
    console.error("GET /api/garages/[garageId] error:", error)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
