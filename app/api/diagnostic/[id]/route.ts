import { NextResponse } from "next/server"
import { getUserFromAuthCookie, extractCookieValue } from "@/lib/auth-session"
import { getDiagnosticRequestById, updateDiagnosticStatus, type DiagnosticStatus } from "@/lib/diagnostics-db"
import { GUEST_ROW_COOKIE } from "@/lib/guest-diagnostic"
import { requireOwnerAdmin } from "@/lib/admin-security"

const ALLOWED_STATUSES: DiagnosticStatus[] = ["abandoned", "completed"]

function guestOwnsRow(cookieHeader: string | null, id: string, row: { userId: string | null }) {
  if (row.userId !== null) return false
  return extractCookieValue(cookieHeader, GUEST_ROW_COOKIE) === id
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieHeader = req.headers.get("cookie")
  const user = await getUserFromAuthCookie(cookieHeader)
  const { id } = await params

  const row = await getDiagnosticRequestById(id)
  if (!row) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 })
  }

  if (user) {
    if (row.userId !== user.id) {
      // Bypass propriétaire-admin : un seul admin du site, accès en lecture seule
      // pour le support / la qualité des diagnostics.
      const admin = await requireOwnerAdmin(req)
      if (!admin) {
        return NextResponse.json({ error: "Non trouvé" }, { status: 404 })
      }
    }
  } else if (!guestOwnsRow(cookieHeader, id, row)) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 })
  }

  if (!row.resultJson) {
    return NextResponse.json({ error: "Résultat non disponible" }, { status: 404 })
  }

  const diagnostic = JSON.parse(row.resultJson)
  const vehicleInfo = {
    marque: row.marque,
    modele: row.modele,
    variante: row.variante ?? "",
    carburant: row.carburant ?? "",
    transmission: row.transmission ?? "",
    annee: row.annee,
    kilometrage: row.kilometrage,
    probleme: row.probleme,
  }

  return NextResponse.json({ diagnostic, vehicleInfo, followUps: row.followUps ?? null })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieHeader = req.headers.get("cookie")
  const user = await getUserFromAuthCookie(cookieHeader)
  const { id } = await params

  const body = await req.json().catch(() => null)
  const status = body?.status as DiagnosticStatus | undefined

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
  }

  const row = await getDiagnosticRequestById(id)
  if (!row) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 })
  }

  if (user) {
    if (row.userId !== user.id) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 })
    }
  } else if (!guestOwnsRow(cookieHeader, id, row)) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 })
  }

  await updateDiagnosticStatus(id, status)
  return NextResponse.json({ ok: true })
}
