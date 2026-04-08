import { NextResponse } from "next/server"
import { requireGaragiste } from "@/lib/garage-auth"
import { listPayoutsForGarage, markReadyPayouts, requestPayout } from "@/lib/deposit-payout-db"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const auth = await requireGaragiste(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })
  const { garageId } = auth

  try {
    // Mark any payouts that are now ready (30 min after appointment end)
    await markReadyPayouts(garageId)

    const payouts = await listPayoutsForGarage(garageId)
    return NextResponse.json({ ok: true, payouts })
  } catch (err) {
    console.error("Garage payout GET error:", err)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const auth = await requireGaragiste(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })
  const { garageId } = auth

  try {
    const body = await req.json().catch(() => null)
    if (!body?.payoutId) {
      return NextResponse.json({ ok: false, error: "payoutId requis." }, { status: 400 })
    }

    const success = await requestPayout(body.payoutId, garageId)
    if (!success) {
      return NextResponse.json(
        { ok: false, error: "Ce paiement n'est pas encore disponible pour retrait." },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Garage payout POST error:", err)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
