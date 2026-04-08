import { NextResponse } from "next/server"
import { requireGaragiste } from "@/lib/garage-auth"
import { listClosures, createClosure, deleteClosure } from "@/lib/garage-closure-db"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const auth = await requireGaragiste(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })
  const { garageId } = auth

  try {
    const closures = await listClosures(garageId)
    return NextResponse.json({ ok: true, closures })
  } catch (err) {
    console.error("Garage closures GET error:", err)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const auth = await requireGaragiste(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })
  const { user, garageId } = auth

  try {
    const body = await req.json().catch(() => null)
    if (!body?.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return NextResponse.json({ ok: false, error: "Date invalide (format YYYY-MM-DD requis)." }, { status: 400 })
    }

    // Validate minimum 12h advance
    const closureDate = new Date(`${body.date}T00:00:00`)
    const minDate = new Date(Date.now() + 12 * 60 * 60 * 1000)
    if (closureDate < minDate) {
      return NextResponse.json(
        { ok: false, error: "La fermeture doit être ajoutée au moins 12h à l'avance." },
        { status: 400 }
      )
    }

    const closure = await createClosure(garageId, body.date, body.reason ?? null, user.id)
    return NextResponse.json({ ok: true, closure })
  } catch (err) {
    console.error("Garage closures POST error:", err)
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

    await deleteClosure(body.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Garage closures DELETE error:", err)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
