import { NextResponse } from "next/server"
import {
  findPendingSignupByToken,
  PENDING_SIGNUP_COOKIE,
} from "@/lib/pending-signup-db"
import { extractCookieValue } from "@/lib/auth-session"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const token = extractCookieValue(req.headers.get("cookie"), PENDING_SIGNUP_COOKIE)
  if (!token) return NextResponse.json({ ok: true, pending: null })
  const pending = await findPendingSignupByToken(token)
  if (!pending) return NextResponse.json({ ok: true, pending: null })
  return NextResponse.json({
    ok: true,
    pending: {
      email: pending.profile.email,
      name: pending.profile.name,
      provider: pending.provider,
    },
  })
}
