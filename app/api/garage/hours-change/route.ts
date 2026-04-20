import { NextResponse } from "next/server"
import { requireGaragiste } from "@/lib/garage-auth"
import { requestHoursChange, listHoursRequestsForGarage } from "@/lib/garage-hours-db"
import { findGarageById } from "@/lib/garage-db"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const auth = await requireGaragiste(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })
  const { garageId } = auth

  try {
    const requests = await listHoursRequestsForGarage(garageId)
    const pending = requests.find((r) => r.status === "pending") ?? null
    return NextResponse.json({
      ok: true,
      pending: pending
        ? {
            id: pending.id,
            createdAt: pending.createdAt,
            proposedHours: pending.proposedHours,
          }
        : null,
      history: requests.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        status: r.status,
        adminNote: r.adminNote,
        processedAt: r.processedAt,
      })),
    })
  } catch (err) {
    console.error("Hours change GET error:", err)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}

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
