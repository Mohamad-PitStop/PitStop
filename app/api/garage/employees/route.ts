import { NextResponse } from "next/server"
import { requireGaragiste, requireGarageOwner } from "@/lib/garage-auth"
import { listEmployees, inviteEmployee, removeEmployee } from "@/lib/garage-employee-db"
import { findGarageById } from "@/lib/garage-db"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const auth = await requireGaragiste(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })
  const { garageId } = auth

  try {
    const [employees, garage] = await Promise.all([
      listEmployees(garageId),
      findGarageById(garageId),
    ])

    return NextResponse.json({
      ok: true,
      employees,
      garageCode: garage?.garageCode ?? null,
    })
  } catch (err) {
    console.error("Garage employees GET error:", err)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const ownerAuth = await requireGarageOwner(req)
  if (!ownerAuth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })
  const { user, garage } = ownerAuth

  try {
    const body = await req.json().catch(() => null)
    if (!body?.email || typeof body.email !== "string") {
      return NextResponse.json({ ok: false, error: "Email requis." }, { status: 400 })
    }

    const email = body.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Email invalide." }, { status: 400 })
    }

    await inviteEmployee(garage.id, email, user.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Garage employees POST error:", err)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const ownerAuth = await requireGarageOwner(req)
  if (!ownerAuth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })

  try {
    const body = await req.json().catch(() => null)
    if (!body?.id) {
      return NextResponse.json({ ok: false, error: "id requis." }, { status: 400 })
    }

    await removeEmployee(body.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Garage employees DELETE error:", err)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
