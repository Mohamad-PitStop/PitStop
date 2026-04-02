import { NextResponse } from "next/server"
import { z } from "zod"
import { addCredits, findAccountByEmail, getAdminCreditGrantedLast24h, getUserCredits, logAdminCreditGrant } from "@/lib/accounts-db"
import { isSameOrigin } from "@/lib/request-security"
import { requireOwnerAdmin } from "@/lib/admin-security"

const BodySchema = z.object({
  email: z.string().trim().email().max(160),
  credits: z.number().int().positive().max(200),
  reason: z.string().trim().max(240).optional(),
})

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "Origine de requête non autorisée." }, { status: 403 })
  }

  const admin = await requireOwnerAdmin(req)
  if (!admin) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Paramètres invalides" }, { status: 400 })
  }

  const email = parsed.data.email.toLowerCase()
  const creditsToAdd = parsed.data.credits
  const reason = parsed.data.reason?.trim() || null
  const dayCap = Number(process.env.ADMIN_FREE_CREDITS_DAILY_CAP ?? 1000)
  const alreadyGranted = await getAdminCreditGrantedLast24h(admin.id)
  if (alreadyGranted + creditsToAdd > dayCap) {
    return NextResponse.json(
      {
        ok: false,
        error: `Plafond de sécurité atteint (${dayCap} crédits / 24h).`,
      },
      { status: 429 }
    )
  }

  const account = await findAccountByEmail(email)
  if (!account) {
    return NextResponse.json({ ok: false, error: "Aucun compte trouvé pour cet e-mail." }, { status: 404 })
  }

  await addCredits(account.id, creditsToAdd)
  await logAdminCreditGrant({
    adminUserId: admin.id,
    targetUserId: account.id,
    targetEmail: account.email,
    credits: creditsToAdd,
    reason,
  })
  const newBalance = await getUserCredits(account.id)

  return NextResponse.json({
    ok: true,
    user: {
      id: account.id,
      name: account.name,
      email: account.email,
      newBalance,
    },
    addedCredits: creditsToAdd,
    dailyLimit: dayCap,
    dailyUsedAfterGrant: alreadyGranted + creditsToAdd,
  })
}

