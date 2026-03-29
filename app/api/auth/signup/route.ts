import { NextResponse } from "next/server"
import { z } from "zod"
import { createAccount, findAccountByEmail, findPendingAssignmentByEmail, deletePendingAssignment, type UserRole } from "@/lib/accounts-db"
import { hashPassword } from "@/lib/auth-password"
import { AUTH_COOKIE_NAME, buildSessionCookieOptions, createAuthSession } from "@/lib/auth-session"
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

const SIGNUP_RATE_LIMIT = { name: "signup", maxRequests: 5, windowSeconds: 60 * 60 } // 5 inscriptions / heure
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase().trim()

const SignupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(128),
})

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(SIGNUP_RATE_LIMIT, ip)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)
    const body = SignupSchema.parse(await req.json())
    const email = body.email.toLowerCase()

    const exists = await findAccountByEmail(email)
    if (exists) {
      return NextResponse.json({ ok: false, error: "Un compte existe déjà avec cet e-mail." }, { status: 409 })
    }

    let role: UserRole = ADMIN_EMAIL && email === ADMIN_EMAIL ? "admin" : "user"
    let pendingId: string | null = null

    // Rôle préassigné par l'admin (basé sur l'email)
    if (role !== "admin") {
      const pending = await findPendingAssignmentByEmail(email)
      if (pending) {
        role = pending.role
        pendingId = pending.id
      }
    }

    const passwordHash = hashPassword(body.password)
    const account = await createAccount({ name: body.name, email, passwordHash, role })

    // Supprimer l'assignation en attente une fois consommée
    if (pendingId) await deletePendingAssignment(pendingId)

    const sessionToken = await createAuthSession(account.id)
    const res = NextResponse.json({
      ok: true,
      user: {
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.role,
      },
    })
    res.cookies.set(AUTH_COOKIE_NAME, sessionToken, buildSessionCookieOptions())
    return res
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Formulaire invalide." }, { status: 400 })
    }
    console.error("Signup API error:", error)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
