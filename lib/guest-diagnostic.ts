import type { NextResponse } from "next/server"

/** Cookie : l’utilisateur a choisi « diagnostic invité » (avant le 1er POST). */
export const GUEST_INTENT_COOKIE = "pitstop_guest_diag_intent"
/** Cookie : un diagnostic invité gratuit a déjà été consommé sur ce navigateur. */
export const GUEST_USED_COOKIE = "pitstop_guest_diag_used"
/** Cookie : id du DiagnosticRequest invité en cours (follow-ups + abandon). */
export const GUEST_ROW_COOKIE = "pitstop_guest_diag_id"

export const GUEST_INTENT_MAX_AGE = 60 * 60
export const GUEST_USED_MAX_AGE = 60 * 60 * 24 * 400

export function guestDiagnosticCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  }
}

export function clearGuestDiagnosticCookies(res: NextResponse) {
  const z = { maxAge: 0, path: "/" as const, httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" }
  res.cookies.set(GUEST_INTENT_COOKIE, "", z)
  res.cookies.set(GUEST_USED_COOKIE, "", z)
  res.cookies.set(GUEST_ROW_COOKIE, "", z)
}

/** sessionStorage côté client */
export const SS_GUEST_ACTIVE = "pitstop_guest_diagnostic_active"
export const SS_GUEST_DIAG_ID = "pitstop_guest_diagnostic_id"
export const SS_POST_VERIFY_REDIRECT = "pitstop_post_verify_redirect"

/** Redirection post-vérification e-mail : chemin interne uniquement. */
export function sanitizePostVerifyRedirect(url: unknown): string | null {
  if (typeof url !== "string" || !url.startsWith("/") || url.startsWith("//")) return null
  if (url.length > 2048) return null
  return url
}
