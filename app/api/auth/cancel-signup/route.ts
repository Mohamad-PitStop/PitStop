import { NextResponse } from "next/server"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { deleteAccountById } from "@/lib/accounts-db"
import { AUTH_COOKIE_NAME } from "@/lib/auth-session"

export const runtime = "nodejs"

/**
 * Annule un signup OAuth en cours (compte créé mais code postal non renseigné).
 * Appelé depuis /completer-profil via `navigator.sendBeacon` quand l'utilisateur
 * quitte la page (pagehide, visibilitychange) ou via fetch sur action explicite.
 *
 * - Supprime le UserAccount (cascade OAuthAccount + UserSession via deleteAccountById)
 * - Efface le cookie de session
 * - Pose un cookie flash `pitstop_signup_cancelled` (lisible côté JS, 5 min)
 *   que la page d'accueil détecte pour afficher un toast d'annulation.
 *
 * Idempotent : si l'utilisateur n'est pas pending (ou pas connecté), ne fait rien
 * et ne pose pas de cookie flash — évite de spammer le message sur un logout normal.
 */
export async function POST(req: Request) {
  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  if (!user || !user.pendingCompletion) {
    return NextResponse.json({ ok: true, cancelled: false })
  }

  try {
    await deleteAccountById(user.id)
  } catch (err) {
    console.error("[cancel-signup] deleteAccountById failed:", err)
    return NextResponse.json({ ok: false, error: "cleanup_failed" }, { status: 500 })
  }

  const isSecure = process.env.NODE_ENV === "production"
  const res = NextResponse.json({ ok: true, cancelled: true })
  res.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge: 0,
  })
  res.cookies.set("pitstop_signup_cancelled", "1", {
    httpOnly: false,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge: 60 * 5,
  })
  return res
}
