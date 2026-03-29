import { NextResponse } from "next/server"
import { AUTH_COOKIE_NAME, buildSessionCookieOptions, clearAuthSession } from "@/lib/auth-session"

export async function POST(req: Request) {
  await clearAuthSession(req.headers.get("cookie"))
  const res = NextResponse.json({ ok: true })
  res.cookies.set(AUTH_COOKIE_NAME, "", { ...buildSessionCookieOptions(), maxAge: 0 })
  return res
}
