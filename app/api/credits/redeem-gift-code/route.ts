import { NextResponse } from "next/server"
import { z } from "zod"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { getUserCredits } from "@/lib/accounts-db"
import {
  findGiftCodeByNormalizedCode,
  hasUserRedeemedGiftCode,
  redeemGiftCodeForUser,
} from "@/lib/credit-gift-code-db"
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import { isSameOrigin } from "@/lib/request-security"

export const runtime = "nodejs"

const REDEEM_LIMIT = { name: "redeem-gift-code", maxRequests: 30, windowSeconds: 60 * 60 }

const BodySchema = z.object({
  code: z.string().trim().min(4).max(40),
})

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase()
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "Origine non autorisée." }, { status: 403 })
  }

  const ip = getClientIp(req)
  const rl = checkRateLimit(REDEEM_LIMIT, ip)
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  if (!user) {
    return NextResponse.json({ ok: false, error: "Connexion requise." }, { status: 401 })
  }

  let body: z.infer<typeof BodySchema>
  try {
    body = BodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ ok: false, error: "Indiquez un code valide (4 à 40 caractères)." }, { status: 400 })
  }

  const normalized = normalizeCode(body.code)
  if (!/^[A-Z0-9\-_]+$/.test(normalized)) {
    return NextResponse.json(
      { ok: false, error: "Le code ne peut contenir que des lettres, chiffres, tirets et underscores." },
      { status: 400 }
    )
  }

  const row = await findGiftCodeByNormalizedCode(normalized)
  if (!row || !row.active) {
    return NextResponse.json({ ok: false, error: "Code inconnu ou désactivé." }, { status: 400 })
  }

  if (row.maxUses != null && row.usedCount >= row.maxUses) {
    return NextResponse.json({ ok: false, error: "Ce code a atteint son nombre maximum d’utilisations." }, { status: 400 })
  }

  if (await hasUserRedeemedGiftCode(row.id, user.id)) {
    return NextResponse.json({ ok: false, error: "Vous avez déjà utilisé ce code sur votre compte." }, { status: 400 })
  }

  if (row.credits <= 0 || row.credits > 500) {
    return NextResponse.json({ ok: false, error: "Configuration du code invalide." }, { status: 500 })
  }

  try {
    await redeemGiftCodeForUser({
      giftCodeId: row.id,
      userId: user.id,
      credits: row.credits,
      ip,
    })
  } catch (e) {
    console.error("redeem-gift-code:", e)
    return NextResponse.json(
      { ok: false, error: "Impossible d’appliquer le code. Réessayez ou contactez le support." },
      { status: 500 }
    )
  }

  const newBalance = await getUserCredits(user.id)

  return NextResponse.json({
    ok: true,
    creditsAdded: row.credits,
    newBalance,
  })
}
