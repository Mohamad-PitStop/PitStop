import { verifyPin } from "@/lib/admin-auth"
import { getDiagnosticRequests } from "@/lib/diagnostics-db"
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

export const runtime = "nodejs"

const PIN_RATE_LIMIT = { name: "admin-pin", maxRequests: 5, windowSeconds: 60 * 15 } // 5 tentatives / 15 min

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(PIN_RATE_LIMIT, ip)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

    const pin = req.headers.get("x-admin-pin")
    if (!pin || !verifyPin(pin)) {
      return Response.json({ ok: false, error: "Code incorrect ou manquant." }, { status: 401 })
    }

    const url = new URL(req.url)
    const limit = Math.min(
      Math.max(1, parseInt(url.searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
      MAX_LIMIT
    )

    const list = await getDiagnosticRequests(limit)
    return Response.json({ ok: true, diagnostics: list })
  } catch (error) {
    console.error("Erreur GET admin diagnostics:", error)
    return Response.json({ ok: false, error: "Erreur lors de la récupération." }, { status: 500 })
  }
}
