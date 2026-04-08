import { NextResponse } from "next/server"
import { requireOwnerAdmin } from "@/lib/admin-security"
import { listPayoutRequests, confirmTransfer } from "@/lib/deposit-payout-db"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const auth = await requireOwnerAdmin(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })

  const payouts = await listPayoutRequests()
  return NextResponse.json({ ok: true, payouts })
}

export async function POST(req: Request) {
  const auth = await requireOwnerAdmin(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const { payoutId, reference } = body ?? {}

  if (!payoutId || !reference) {
    return NextResponse.json({ ok: false, error: "Paramètres invalides" }, { status: 400 })
  }

  await confirmTransfer(payoutId, auth.id, reference)

  return NextResponse.json({ ok: true })
}
