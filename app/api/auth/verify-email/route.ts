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
  setUserGarageId,
  type UserRole,
} from "@/lib/accounts-db"
import { AUTH_COOKIE_NAME, buildSessionCookieOptions, createAuthSession } from "@/lib/auth-session"
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import { sendSignupConfirmedEmail } from "@/lib/signup-confirmed-email"
import { findPendingGarageRegistration, deletePendingGarageRegistration } from "@/lib/pending-garage-registration-db"
import { createGarage } from "@/lib/garage-db"
import { activateEmployee } from "@/lib/garage-employee-db"
import { assignDiagnosticRequestToUser } from "@/lib/diagnostics-db"
import { clearGuestDiagnosticCookies, sanitizePostVerifyRedirect } from "@/lib/guest-diagnostic"

export const runtime = "nodejs"

const VERIFY_RATE_LIMIT = { name: "verify-email", maxRequests: 10, windowSeconds: 60 * 15 }
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase().trim()

const Schema = z.object({
  token: z.string().min(10),
  pendingGuestDiagnosticId: z.string().trim().min(10).max(120).optional(),
  postVerifyRedirect: z.string().max(2048).optional(),
})

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(VERIFY_RATE_LIMIT, ip)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

    const { token, pendingGuestDiagnosticId, postVerifyRedirect } = Schema.parse(await req.json())
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
      const sessionToken = await createAuthSession(existing.id)
      let redirectTo: string | null = null
      if (pendingGuestDiagnosticId && existing.role !== "garagiste") {
        const ok = await assignDiagnosticRequestToUser(pendingGuestDiagnosticId, existing.id)
        if (ok) {
          redirectTo = sanitizePostVerifyRedirect(postVerifyRedirect) ?? "/mes-diagnostics"
        }
      }
      const res = NextResponse.json({ ok: true, alreadyExists: true, redirectTo })
      res.cookies.set(AUTH_COOKIE_NAME, sessionToken, buildSessionCookieOptions())
      if (redirectTo) clearGuestDiagnosticCookies(res)
      return res
    }

    // Vérifier s'il y a une inscription garage en attente
    const pendingGarage = await findPendingGarageRegistration(pending.email)

    // Déterminer le rôle (priorité : admin email > garage > pré-assignation > user)
    let role: UserRole = ADMIN_EMAIL && pending.email === ADMIN_EMAIL ? "admin" : "user"
    let pendingAssignmentId: string | null = null
    let garageId: string | null = null

    if (pendingGarage) {
      role = "garagiste"
      if (pendingGarage.type === "employee" && pendingGarage.garageId) {
        garageId = pendingGarage.garageId
      }
    } else if (role !== "admin") {
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
      signupPostalCode: pending.postalCode || null,
      signupCity: pending.city || null,
      garageId,
    })

    // Si inscription garage owner : créer le garage
    if (pendingGarage?.type === "owner" && pendingGarage.garageData) {
      const gd = JSON.parse(pendingGarage.garageData)
      const garage = await createGarage({
        companyName: gd.companyName,
        bceTvaNumber: gd.bceTvaNumber,
        street: gd.street,
        postalCode: gd.postalCode,
        city: gd.city,
        iban: gd.iban,
        professionalPhone: gd.professionalPhone,
        professionalEmail: gd.professionalEmail,
        managerName: gd.managerName,
        managerUserId: account.id,
        specialties: gd.specialties,
        businessHours: gd.businessHours,
      })
      // Lier l'account au garage
      await setUserGarageId(account.id, garage.id)
    }

    // Si inscription garage employee : activer l'employé
    if (pendingGarage?.type === "employee" && garageId) {
      await activateEmployee(garageId, pending.email, account.id)
    }

    // Nettoyer l'inscription garage en attente
    if (pendingGarage) await deletePendingGarageRegistration(pending.email)

    // Consommer la pré-assignation de rôle si elle existait
    if (pendingAssignmentId) await deletePendingAssignment(pendingAssignmentId)

    // Nettoyer la vérification en attente
    await deletePendingVerification(pending.email)

    let welcomed = false
    let redirectTo: string | null = null
    let attachedFromGuest = false
    if (pendingGuestDiagnosticId && role !== "garagiste") {
      attachedFromGuest = await assignDiagnosticRequestToUser(pendingGuestDiagnosticId, account.id)
      if (attachedFromGuest) {
        redirectTo = sanitizePostVerifyRedirect(postVerifyRedirect) ?? "/mes-diagnostics"
      }
    }

    // Crédit de bienvenue : pas si le diagnostic invité vient d’être rattaché (= déjà « gratuit » consommé).
    if (!attachedFromGuest) {
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
    }

    void sendSignupConfirmedEmail({
      to: account.email,
      name: account.name,
      welcomed: attachedFromGuest ? false : welcomed,
      testPhaseBonus: TEST_PHASE_SIGNUP_BONUS_ENABLED,
    }).catch((err) => console.error("verify-email: envoi email de confirmation:", err))

    const sessionToken = await createAuthSession(account.id)
    const res = NextResponse.json({
      ok: true,
      welcomed: attachedFromGuest ? false : welcomed,
      testPhaseBonus: TEST_PHASE_SIGNUP_BONUS_ENABLED,
      redirectTo,
      user: { id: account.id, name: account.name, email: account.email, role: account.role },
    })
    res.cookies.set(AUTH_COOKIE_NAME, sessionToken, buildSessionCookieOptions())
    if (attachedFromGuest) clearGuestDiagnosticCookies(res)
    return res
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Token invalide." }, { status: 400 })
    }
    console.error("verify-email error:", error)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
