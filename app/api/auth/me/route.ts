import { NextResponse } from "next/server"
import { createHash } from "node:crypto"
import {
  AUTH_COOKIE_NAME,
  extractCookieValue,
  getUserFromAuthCookie,
} from "@/lib/auth-session"
import { findSessionByTokenHash, findAccountById } from "@/lib/accounts-db"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const debug = url.searchParams.get("debug") === "1"
  const cookieHeader = req.headers.get("cookie")

  if (debug) {
    // Diagnostic temporaire OAuth : localise laquelle des 3 étapes échoue.
    const token = extractCookieValue(cookieHeader, AUTH_COOKIE_NAME)
    if (!token) {
      return NextResponse.json({ ok: true, user: null, debug: { step: "no_cookie", cookieHeaderLen: cookieHeader?.length ?? 0 } })
    }
    const tokenHash = createHash("sha256").update(token).digest("hex")
    const session = await findSessionByTokenHash(tokenHash)
    if (!session) {
      return NextResponse.json({
        ok: true,
        user: null,
        debug: { step: "session_not_found", tokenLen: token.length, tokenHashPrefix: tokenHash.slice(0, 12) },
      })
    }
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ ok: true, user: null, debug: { step: "session_expired", expiresAt: session.expiresAt } })
    }
    const account = await findAccountById(session.userId)
    if (!account) {
      return NextResponse.json({
        ok: true,
        user: null,
        debug: { step: "account_not_found", sessionUserId: session.userId },
      })
    }
    return NextResponse.json({
      ok: true,
      user: { id: account.id, name: account.name, email: account.email, role: account.role },
      debug: { step: "ok" },
    })
  }

  const user = await getUserFromAuthCookie(cookieHeader)
  if (!user) return NextResponse.json({ ok: true, user: null })
  return NextResponse.json({ ok: true, user })
}
