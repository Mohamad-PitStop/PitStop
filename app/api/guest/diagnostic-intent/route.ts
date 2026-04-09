import { NextResponse } from "next/server"
import { getUserFromAuthCookie, extractCookieValue } from "@/lib/auth-session"
import {
  GUEST_INTENT_COOKIE,
  GUEST_USED_COOKIE,
  guestDiagnosticCookieOptions,
  GUEST_INTENT_MAX_AGE,
} from "@/lib/guest-diagnostic"

export const runtime = "nodejs"

/**
 * Appelé quand l’utilisateur non connecté choisit explicitement le diagnostic invité.
 * Refus si déjà connecté ou si le gratuit invité a déjà été utilisé sur ce navigateur.
 */
export async function POST(req: Request) {
  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  if (user) {
    return NextResponse.json(
      { ok: false, error: "ALREADY_LOGGED_IN", message: "Connectez-vous pour utiliser votre compte." },
      { status: 400 }
    )
  }
  if (extractCookieValue(req.headers.get("cookie"), GUEST_USED_COOKIE) === "1") {
    return NextResponse.json(
      { ok: false, error: "GUEST_ALREADY_USED", message: "Vous avez déjà utilisé votre diagnostic invité gratuit." },
      { status: 403 }
    )
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(GUEST_INTENT_COOKIE, "1", guestDiagnosticCookieOptions(GUEST_INTENT_MAX_AGE))
  return res
}
