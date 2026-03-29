import { NextResponse } from "next/server"
import { createHash } from "node:crypto"
import { z } from "zod"
import { findPasswordResetToken, consumePasswordResetToken, updateAccountPassword } from "@/lib/accounts-db"
import { hashPassword } from "@/lib/auth-password"
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

const RESET_RATE_LIMIT = { name: "reset-password", maxRequests: 5, windowSeconds: 60 * 15 } // 5 tentatives / 15 min

const Schema = z.object({
  token: z.string().min(1).max(200),
  password: z.string().min(8).max(128),
})

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(RESET_RATE_LIMIT, ip)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)
    const { token, password } = Schema.parse(await req.json())

    const tokenHash = hashToken(token)
    const record = await findPasswordResetToken(tokenHash)

    if (!record) {
      return NextResponse.json({ ok: false, error: "Lien invalide ou déjà utilisé." }, { status: 400 })
    }

    if (new Date(record.expiresAt).getTime() < Date.now()) {
      await consumePasswordResetToken(tokenHash)
      return NextResponse.json({ ok: false, error: "Ce lien a expiré. Veuillez faire une nouvelle demande." }, { status: 400 })
    }

    const passwordHash = hashPassword(password)
    await updateAccountPassword(record.userId, passwordHash)
    await consumePasswordResetToken(tokenHash)

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Données invalides." }, { status: 400 })
    }
    console.error("reset-password error:", error)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
