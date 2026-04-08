import { NextResponse } from "next/server"
import { requireOwnerAdmin } from "@/lib/admin-security"
import {
  listPendingHoursRequests,
  approveHoursChange,
  rejectHoursChange,
} from "@/lib/garage-hours-db"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const auth = await requireOwnerAdmin(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })

  const requests = await listPendingHoursRequests()
  return NextResponse.json({ ok: true, requests })
}

export async function POST(req: Request) {
  const auth = await requireOwnerAdmin(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const { requestId, action, note } = body ?? {}

  if (!requestId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ ok: false, error: "Paramètres invalides" }, { status: 400 })
  }

  if (action === "approve") {
    await approveHoursChange(requestId, auth.id)
  } else {
    await rejectHoursChange(requestId, auth.id, note ?? null)
  }

  return NextResponse.json({ ok: true })
}
