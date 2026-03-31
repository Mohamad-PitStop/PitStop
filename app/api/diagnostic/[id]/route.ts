import { NextResponse } from "next/server"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { getDiagnosticRequestById, updateDiagnosticStatus, type DiagnosticStatus } from "@/lib/diagnostics-db"

const ALLOWED_STATUSES: DiagnosticStatus[] = ["abandoned", "completed"]

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  if (!user) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 })
  }

  const { id } = await params
  const row = await getDiagnosticRequestById(id)
  if (!row || row.userId !== user.id) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 })
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
  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  if (!user) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json().catch(() => null)
  const status = body?.status as DiagnosticStatus | undefined

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
  }

  const row = await getDiagnosticRequestById(id)
  if (!row || row.userId !== user.id) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 })
  }

  await updateDiagnosticStatus(id, status)
  return NextResponse.json({ ok: true })
}
