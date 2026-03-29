import { NextResponse } from "next/server"
import { z } from "zod"
import { findAccountByEmail } from "@/lib/accounts-db"
import { verifyPassword } from "@/lib/auth-password"
import { AUTH_COOKIE_NAME, buildSessionCookieOptions, createAuthSession } from "@/lib/auth-session"
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

const LOGIN_RATE_LIMIT = { name: "login", maxRequests: 5, windowSeconds: 60 * 15 } // 5 tentatives / 15 min

const LoginSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(128),
})

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(LOGIN_RATE_LIMIT, ip)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)
    const body = LoginSchema.parse(await req.json())
    const email = body.email.toLowerCase()
    const account = await findAccountByEmail(email)
    if (!account || !verifyPassword(body.password, account.passwordHash)) {
      return NextResponse.json({ ok: false, error: "Identifiants invalides." }, { status: 401 })
    }

    const sessionToken = await createAuthSession(account.id)
    const res = NextResponse.json({
      ok: true,
      user: { id: account.id, name: account.name, email: account.email },
    })
    res.cookies.set(AUTH_COOKIE_NAME, sessionToken, buildSessionCookieOptions())
    return res
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Formulaire invalide." }, { status: 400 })
    }
    console.error("Login API error:", error)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
