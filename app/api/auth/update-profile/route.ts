import { NextResponse } from "next/server"
import { z } from "zod"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { findAccountByEmail, updateAccountProfile } from "@/lib/accounts-db"
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

export const runtime = "nodejs"

const RATE_LIMIT = { name: "update-profile", maxRequests: 5, windowSeconds: 60 * 15 }

const Schema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(160).optional(),
  postalCode: z.string().trim().max(20).optional(),
})

export async function PATCH(req: Request) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(RATE_LIMIT, ip)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

    const user = await getUserFromAuthCookie(req.headers.get("cookie"))
    if (!user) {
      return NextResponse.json({ ok: false, error: "Non connecté." }, { status: 401 })
    }

    const body = Schema.parse(await req.json())

    if (!body.name && !body.email && body.postalCode === undefined) {
      return NextResponse.json({ ok: false, error: "Aucun champ à mettre à jour." }, { status: 400 })
    }

    // Vérifier unicité du nouvel email
    if (body.email) {
      const newEmail = body.email.toLowerCase()
      if (newEmail !== user.email) {
        const existing = await findAccountByEmail(newEmail)
        if (existing) {
          return NextResponse.json(
            { ok: false, error: "Cette adresse email est déjà utilisée par un autre compte." },
            { status: 409 }
          )
        }
        body.email = newEmail
      } else {
        // Même email → pas de mise à jour nécessaire
        body.email = undefined
      }
    }

    await updateAccountProfile(user.id, {
      name: body.name,
      email: body.email,
      postalCode: body.postalCode,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Données invalides." }, { status: 400 })
    }
    console.error("update-profile error:", error)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
