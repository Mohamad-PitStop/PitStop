import { NextResponse } from "next/server"
import { isValidBelgianPostalCode, normalizePostalCode } from "@/lib/signup-location"
import { fetchBelgianMunicipalitiesForPostal } from "@/lib/belgian-postal-open-data"
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

export const runtime = "nodejs"

const RL = { name: "belgian-postal-lookup", maxRequests: 45, windowSeconds: 60 }

export async function GET(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(RL, ip)
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

  const url = new URL(req.url)
  const raw = url.searchParams.get("code") ?? ""
  const code = normalizePostalCode(raw)
  if (!isValidBelgianPostalCode(code)) {
    return NextResponse.json({ ok: true, municipalities: [] as string[] })
  }

  try {
    const municipalities = await fetchBelgianMunicipalitiesForPostal(code)
    return NextResponse.json({ ok: true, municipalities })
  } catch (e) {
    console.error("belgian-postal lookup:", e)
    return NextResponse.json({ ok: true, municipalities: [] as string[] })
  }
}
