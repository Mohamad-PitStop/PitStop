import { NextResponse } from "next/server"
import { z } from "zod"
import {
  AUTH_COOKIE_NAME,
  buildSessionCookieOptions,
  createAuthSession,
  extractCookieValue,
} from "@/lib/auth-session"
import {
  deletePendingSignupByToken,
  findPendingSignupByToken,
  PENDING_SIGNUP_COOKIE,
} from "@/lib/pending-signup-db"
import { createAccount, findAccountByEmail } from "@/lib/accounts-db"
import { linkOAuthAccount, OAUTH_ONLY_PASSWORD_MARKER } from "@/lib/oauth-db"
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

export const runtime = "nodejs"

const RATE_LIMIT = { name: "pending-signup-complete", maxRequests: 10, windowSeconds: 60 * 15 }

const Schema = z.object({
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{4}$/u, "Code postal belge invalide."),
  city: z.string().trim().min(2).max(80),
})

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(RATE_LIMIT, ip)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

    const token = extractCookieValue(req.headers.get("cookie"), PENDING_SIGNUP_COOKIE)
    if (!token) {
      return NextResponse.json({ ok: false, error: "pending_not_found" }, { status: 401 })
    }
    const pending = await findPendingSignupByToken(token)
    if (!pending) {
      return NextResponse.json({ ok: false, error: "pending_expired" }, { status: 401 })
    }

    const body = Schema.parse(await req.json())

    const profile = pending.profile
    if (!profile.email) {
      await deletePendingSignupByToken(token)
      return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 })
    }
    const email = profile.email.toLowerCase()

    // Race : un autre onglet / un autre provider peut avoir fini avant nous.
    const existing = await findAccountByEmail(email)
    if (existing) {
      await deletePendingSignupByToken(token)
      return NextResponse.json({ ok: false, error: "email_already_used" }, { status: 409 })
    }

    const created = await createAccount({
      name: profile.name?.trim() || email.split("@")[0] || "Utilisateur",
      email,
      passwordHash: OAUTH_ONLY_PASSWORD_MARKER,
      role: "user",
      signupPostalCode: body.postalCode,
      signupCity: body.city,
      garageId: null,
    })
    await linkOAuthAccount({ userId: created.id, provider: pending.provider, profile })

    const sessionToken = await createAuthSession(created.id)
    await deletePendingSignupByToken(token)

    const res = NextResponse.json({ ok: true })
    res.cookies.set(AUTH_COOKIE_NAME, sessionToken, buildSessionCookieOptions())
    res.cookies.set(PENDING_SIGNUP_COOKIE, "", { ...buildSessionCookieOptions(), maxAge: 0 })
    return res
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 })
    }
    console.error("pending-signup/complete error:", error)
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}
