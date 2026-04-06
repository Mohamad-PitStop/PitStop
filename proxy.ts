import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/** Aligné sur `AUTH_COOKIE_NAME` dans `lib/auth-session.ts` (évite d'importer ce module en Edge). */
const AUTH_COOKIE = "pitstop_auth"

/** Routes réservées aux utilisateurs connectés (diagnostic compte uniquement). */
const PROTECTED_PREFIXES = ["/diagnostic", "/resultat"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
  if (needsAuth) {
    const token = request.cookies.get(AUTH_COOKIE)?.value
    if (!token) {
      const url = request.nextUrl.clone()
      // Connexion d’abord : les utilisateurs existants ne doivent pas être envoyés vers l’inscription.
      url.pathname = "/connexion"
      url.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`)
      url.searchParams.set("reason", "diagnostic")
      return NextResponse.redirect(url)
    }
  }

  const response = NextResponse.next()

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY")

  // Prevent MIME-type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff")

  // Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // Disable browser features we don't need
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self)"
  )

  // Basic XSS protection (legacy browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block")

  // Strict transport security (HTTPS only)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    )
  }

  return response
}

export const config = {
  matcher: [
    // Apply to all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
