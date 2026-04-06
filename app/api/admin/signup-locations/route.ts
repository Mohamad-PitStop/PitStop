import { NextResponse } from "next/server"
import { getSignupLocationAggregates } from "@/lib/accounts-db"
import { requireOwnerAdmin } from "@/lib/admin-security"

export const runtime = "nodejs"

/**
 * Statistiques agrégées (anonymes) : répartition des comptes par code postal + commune à l’inscription.
 */
export async function GET(req: Request) {
  const admin = await requireOwnerAdmin(req)
  if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const data = await getSignupLocationAggregates()
  return NextResponse.json({
    ok: true,
    ...data,
    note:
      "Données agrégées uniquement (aucun lien avec un identifiant ou un e-mail dans cette vue).",
  })
}
