import { NextResponse } from "next/server"
import { createHash } from "node:crypto"
import { z } from "zod"
import { TEST_PHASE_SIGNUP_BONUS_ENABLED } from "@/lib/feature-flags"
import {
  findPendingVerificationByTokenHash,
  deletePendingVerification,
} from "@/lib/email-verification-db"
import {
  findAccountByEmail,
  createAccount,
  findPendingAssignmentByEmail,
  deletePendingAssignment,
  addCredits,
  canGrantWelcomeCredit,
  recordWelcomeCreditGrant,
  type UserRole,
} from "@/lib/accounts-db"
import { AUTH_COOKIE_NAME, buildSessionCookieOptions, createAuthSession } from "@/lib/auth-session"
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import { sendSignupConfirmedEmail } from "@/lib/signup-confirmed-email"

export const runtime = "nodejs"

const VERIFY_RATE_LIMIT = { name: "verify-email", maxRequests: 10, windowSeconds: 60 * 15 }
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase().trim()

const Schema = z.object({ token: z.string().min(10) })

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(VERIFY_RATE_LIMIT, ip)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

    const { token } = Schema.parse(await req.json())
    const tokenHash = hashToken(token)

    const pending = await findPendingVerificationByTokenHash(tokenHash)
    if (!pending) {
      return NextResponse.json(
        { ok: false, error: "Ce lien de vérification est invalide ou a expiré. Veuillez faire une nouvelle inscription." },
        { status: 400 }
      )
    }

    // Vérifier l'expiration
    if (new Date(pending.expiresAt) < new Date()) {
      await deletePendingVerification(pending.email)
      return NextResponse.json(
        { ok: false, error: "Ce lien a expiré (validité 24 h). Veuillez faire une nouvelle inscription." },
        { status: 400 }
      )
    }

    // Vérifier qu'un compte n'a pas déjà été créé entre-temps (double clic, race condition)
    const existing = await findAccountByEmail(pending.email)
    if (existing) {
      await deletePendingVerification(pending.email)
      // Compte déjà créé : créer simplement une session
      const sessionToken = await createAuthSession(existing.id)
      const res = NextResponse.json({ ok: true, alreadyExists: true })
      res.cookies.set(AUTH_COOKIE_NAME, sessionToken, buildSessionCookieOptions())
      return res
    }

    // Déterminer le rôle (priorité : admin email > pré-assignation > user)
    let role: UserRole = ADMIN_EMAIL && pending.email === ADMIN_EMAIL ? "admin" : "user"
    let pendingAssignmentId: string | null = null

    if (role !== "admin") {
      const pendingRole = await findPendingAssignmentByEmail(pending.email)
      if (pendingRole) {
        role = pendingRole.role
        pendingAssignmentId = pendingRole.id
      }
    }

    // Créer le compte (le passwordHash a déjà été calculé lors de l'inscription)
    const account = await createAccount({
      name: pending.name,
      email: pending.email,
      passwordHash: pending.passwordHash,
      role,
    })

    // Consommer la pré-assignation de rôle si elle existait
    if (pendingAssignmentId) await deletePendingAssignment(pendingAssignmentId)

    // Nettoyer la vérification en attente
    await deletePendingVerification(pending.email)

    // Crédit de bienvenue : phase de test = 1 crédit systématique ; sinon anti-abus par IP (60 j).
    let welcomed = false
    if (TEST_PHASE_SIGNUP_BONUS_ENABLED) {
      await addCredits(account.id, 1)
      welcomed = true
    } else {
      const grantWelcome = await canGrantWelcomeCredit(ip)
      if (grantWelcome) {
        await addCredits(account.id, 1)
        await recordWelcomeCreditGrant(ip)
        welcomed = true
      }
    }

    // E-mail de bienvenue (ne bloque pas la réponse en cas d’échec SMTP)
    void sendSignupConfirmedEmail({
      to: account.email,
      name: account.name,
      welcomed,
      testPhaseBonus: TEST_PHASE_SIGNUP_BONUS_ENABLED,
    }).catch((err) => console.error("verify-email: envoi email de confirmation:", err))

    // Créer la session et retourner le cookie
    const sessionToken = await createAuthSession(account.id)
    const res = NextResponse.json({
      ok: true,
      welcomed,
      testPhaseBonus: TEST_PHASE_SIGNUP_BONUS_ENABLED,
      user: { id: account.id, name: account.name, email: account.email, role: account.role },
    })
    res.cookies.set(AUTH_COOKIE_NAME, sessionToken, buildSessionCookieOptions())
    return res
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Token invalide." }, { status: 400 })
    }
    console.error("verify-email error:", error)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
