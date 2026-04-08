import { NextResponse } from "next/server"
import { requireGaragiste } from "@/lib/garage-auth"
import { requestHoursChange } from "@/lib/garage-hours-db"
import { findGarageById } from "@/lib/garage-db"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const auth = await requireGaragiste(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })
  const { user, garageId } = auth

  try {
    const body = await req.json().catch(() => null)
    if (!body?.proposedHours) {
      return NextResponse.json({ ok: false, error: "proposedHours requis." }, { status: 400 })
    }

    const garage = await findGarageById(garageId)
    if (!garage) {
      return NextResponse.json({ ok: false, error: "Garage introuvable." }, { status: 404 })
    }

    const currentHours = garage.businessHours
    const proposedHoursJson = JSON.stringify(body.proposedHours)

    const requestId = await requestHoursChange(
      garageId,
      user.id,
      currentHours,
      proposedHoursJson
    )

    return NextResponse.json({ ok: true, requestId })
  } catch (err) {
    console.error("Hours change request error:", err)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
