import { NextResponse } from "next/server"
import { getUserFromAuthCookie, extractCookieValue } from "@/lib/auth-session"
import { GUEST_USED_COOKIE } from "@/lib/guest-diagnostic"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  const guestDiagnosticUsed = extractCookieValue(req.headers.get("cookie"), GUEST_USED_COOKIE) === "1"
  return NextResponse.json({
    loggedIn: !!user,
    guestDiagnosticUsed,
  })
}
