import { NextResponse } from "next/server"
import { requireGaragiste } from "@/lib/garage-auth"
import {
  getGarageBlockedSlotsForRange,
  createGarageBlockedSlot,
  deleteGarageBlockedSlot,
} from "@/lib/garage-blocked-slots-db"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const auth = await requireGaragiste(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })
  const { garageId } = auth

  try {
    const url = new URL(req.url)
    const from = url.searchParams.get("from")
    const to = url.searchParams.get("to")

    if (!from || !to) {
      return NextResponse.json({ ok: false, error: "Paramètres from et to requis." }, { status: 400 })
    }

    const slots = await getGarageBlockedSlotsForRange(garageId, new Date(from), new Date(to))
    return NextResponse.json({ ok: true, slots })
  } catch (err) {
    console.error("Garage blocked-slots GET error:", err)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const auth = await requireGaragiste(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })
  const { user, garageId } = auth

  try {
    const body = await req.json().catch(() => null)
    if (!body?.startAt || !body?.endAt) {
      return NextResponse.json({ ok: false, error: "startAt et endAt requis." }, { status: 400 })
    }

    const slot = await createGarageBlockedSlot(
      garageId,
      new Date(body.startAt),
      new Date(body.endAt),
      body.label ?? null,
      user.id
    )
    return NextResponse.json({ ok: true, slot })
  } catch (err) {
    console.error("Garage blocked-slots POST error:", err)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const auth = await requireGaragiste(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })

  try {
    const body = await req.json().catch(() => null)
    if (!body?.id) {
      return NextResponse.json({ ok: false, error: "id requis." }, { status: 400 })
    }

    await deleteGarageBlockedSlot(body.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Garage blocked-slots DELETE error:", err)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
