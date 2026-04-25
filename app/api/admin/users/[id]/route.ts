import { NextResponse } from "next/server"
import { requireOwnerAdmin } from "@/lib/admin-security"
import { findAccountByEmail } from "@/lib/accounts-db"
import { getDiagnosticsByUserId } from "@/lib/diagnostics-db"
import { prisma } from "@/lib/prisma"
import { toIsoUtc } from "@/lib/format-brussels-date"

type AccountByIdRow = {
  id: string
  name: string
  email: string
  role: string
  diagnosticCredits: number
  createdAt: string | null
}

/**
 * GET /api/admin/users/[id]
 * Renvoie le profil d'un utilisateur + son historique de diagnostics (jusqu'à 200).
 * Réservé au propriétaire admin (cf. requireOwnerAdmin).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireOwnerAdmin(req)
  if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const { id } = await params
  if (!id) return NextResponse.json({ error: "Identifiant manquant" }, { status: 400 })

  // Compte cible — recherche directe par id puisqu'on ne dispose pas d'un helper dédié.
  const rows = await prisma.$queryRawUnsafe<AccountByIdRow[]>(
    `SELECT "id", "name", "email", "role", "diagnosticCredits", "createdAt"
     FROM "UserAccount" WHERE "id" = ? LIMIT 1`,
    id
  ).catch(() => [] as AccountByIdRow[])
  const account = rows[0]
  if (!account) {
    // Fallback : si l'identifiant fourni est en réalité un e-mail (cas ancien), on tolère.
    const byEmail = await findAccountByEmail(id)
    if (!byEmail) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 })
    return buildResponse(byEmail.id, {
      id: byEmail.id,
      name: byEmail.name,
      email: byEmail.email,
      role: byEmail.role,
      diagnosticCredits: byEmail.diagnosticCredits,
      createdAt: (byEmail as unknown as { createdAt?: string | null }).createdAt ?? null,
    })
  }

  return buildResponse(account.id, account)
}

async function buildResponse(userId: string, account: AccountByIdRow) {
  const diagnostics = await getDiagnosticsByUserId(userId, 200)
  return NextResponse.json({
    user: {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      diagnosticCredits: account.diagnosticCredits,
      createdAt: toIsoUtc(account.createdAt),
    },
    diagnostics: diagnostics.map((d) => ({
      id: d.id,
      createdAt: toIsoUtc(d.createdAt),
      marque: d.marque,
      modele: d.modele,
      variante: d.variante,
      carburant: d.carburant,
      transmission: d.transmission,
      annee: d.annee,
      kilometrage: d.kilometrage,
      probleme: d.probleme,
      status: d.status,
    })),
  })
}
