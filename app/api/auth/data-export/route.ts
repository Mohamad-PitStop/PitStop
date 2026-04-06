import { NextResponse } from "next/server"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { findAccountById } from "@/lib/accounts-db"
import { getDiagnosticsByUserId } from "@/lib/diagnostics-db"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const user = await getUserFromAuthCookie(req.headers.get("cookie"))
    if (!user) {
      return NextResponse.json({ ok: false, error: "Non connecté." }, { status: 401 })
    }

    const [account, diagnostics] = await Promise.all([
      findAccountById(user.id),
      getDiagnosticsByUserId(user.id, 200),
    ])

    if (!account) {
      return NextResponse.json({ ok: false, error: "Compte introuvable." }, { status: 404 })
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: "1.0",
      account: {
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.role,
        diagnosticCredits: account.diagnosticCredits,
        inscriptionCodePostal: account.signupPostalCode ?? null,
        inscriptionCommune: account.signupCity ?? null,
      },
      diagnostics: diagnostics.map((d) => ({
        id: d.id,
        createdAt: d.createdAt,
        marque: d.marque,
        modele: d.modele,
        variante: d.variante,
        carburant: d.carburant,
        transmission: d.transmission,
        annee: d.annee,
        kilometrage: d.kilometrage,
        probleme: d.probleme,
        status: d.status,
        // promptText exclu (données internes)
      })),
    }

    const filename = `pitstop-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("data-export error:", error)
    return NextResponse.json({ ok: false, error: "Erreur lors de l'export." }, { status: 500 })
  }
}
