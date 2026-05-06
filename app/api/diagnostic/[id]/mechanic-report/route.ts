import { NextResponse } from "next/server"
import { getUserFromAuthCookie, extractCookieValue } from "@/lib/auth-session"
import {
  getDiagnosticRequestById,
  updateDiagnosticMechanicReport,
} from "@/lib/diagnostics-db"
import { GUEST_ROW_COOKIE } from "@/lib/guest-diagnostic"
import { requireOwnerAdmin } from "@/lib/admin-security"
import {
  generateMechanicReport,
  shouldGenerateMechanicReport,
  type MechanicReport,
} from "@/lib/mechanic-report"

export const maxDuration = 60

function guestOwnsRow(cookieHeader: string | null, id: string, row: { userId: string | null }) {
  if (row.userId !== null) return false
  return extractCookieValue(cookieHeader, GUEST_ROW_COOKIE) === id
}

function pickLocale(input: unknown): "fr" | "en" | "nl" {
  return input === "en" || input === "nl" ? input : "fr"
}

/**
 * Génère (ou retourne depuis le cache DB) le rapport garagiste d'un diagnostic.
 * Cette opération est coûteuse (web search + structuration, 15-35s) : on la défère
 * jusqu'au téléchargement du PDF, qui est la seule UI consommatrice du rapport.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
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
      const admin = await requireOwnerAdmin(req)
      if (!admin) {
        return NextResponse.json({ error: "Non trouvé" }, { status: 404 })
      }
    }
  } else if (!guestOwnsRow(cookieHeader, id, row)) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 })
  }

  if (!row.resultJson) {
    return NextResponse.json({ error: "Diagnostic incomplet" }, { status: 409 })
  }

  // Cache hit : on évite la regénération coûteuse.
  if (row.mechanicReportJson) {
    try {
      const cached: MechanicReport = JSON.parse(row.mechanicReportJson)
      return NextResponse.json({ mechanicReport: cached })
    } catch {
      // JSON corrompu en DB : on regénère.
    }
  }

  let diagnostic: Record<string, unknown>
  try {
    diagnostic = JSON.parse(row.resultJson) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Diagnostic illisible" }, { status: 500 })
  }

  if (!shouldGenerateMechanicReport(diagnostic)) {
    // Pas de rapport pertinent pour ce type de diagnostic : on retourne null
    // sans rien stocker, pour pouvoir reconsidérer plus tard si la donnée évolue.
    return NextResponse.json({ mechanicReport: null })
  }

  const body = (await req.json().catch(() => null)) as { locale?: unknown; cylindree?: unknown; puissance?: unknown; typeBoiteAuto?: unknown } | null
  const locale = pickLocale(body?.locale)
  const cylindree = typeof body?.cylindree === "string" ? body.cylindree : ""
  const puissance = typeof body?.puissance === "string" ? body.puissance : ""
  const typeBoiteAuto = typeof body?.typeBoiteAuto === "string" ? body.typeBoiteAuto : ""

  const report = await generateMechanicReport({
    locale,
    marque: row.marque,
    modele: row.modele,
    variante: row.variante,
    annee: row.annee,
    carburant: row.carburant,
    transmission: row.transmission,
    cylindree,
    puissance,
    typeBoiteAuto,
    probleme: row.probleme,
    diagnostic,
  })

  if (report) {
    try {
      await updateDiagnosticMechanicReport(id, JSON.stringify(report))
    } catch (err) {
      console.error("Mechanic report cache write failed:", err)
    }
  }

  return NextResponse.json({ mechanicReport: report })
}
