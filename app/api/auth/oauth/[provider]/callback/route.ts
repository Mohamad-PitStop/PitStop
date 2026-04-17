import { NextResponse } from "next/server"
import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth-session"
import {
  decodeStateCookie,
  exchangeCodeForProfile,
  getRedirectUri,
  isOAuthProvider,
  isProviderConfigured,
  OAUTH_STATE_COOKIE,
} from "@/lib/oauth"
import { resolveOAuthSignIn } from "@/lib/oauth-db"
import {
  AUTH_COOKIE_NAME,
  buildSessionCookieOptions,
  createAuthSession,
  extractCookieValue,
} from "@/lib/auth-session"

export const runtime = "nodejs"

function redirectToConnexion(base: string, reason: string, returnTo?: string | null) {
  const url = new URL("/connexion", base)
  url.searchParams.set("oauth_error", reason)
  if (returnTo) url.searchParams.set("callbackUrl", returnTo)
  return NextResponse.redirect(url)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const requestUrl = new URL(request.url)
  const baseOrigin = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin

  if (!isOAuthProvider(provider)) {
    return NextResponse.json({ ok: false, error: "Fournisseur inconnu." }, { status: 404 })
  }
  if (!isProviderConfigured(provider)) {
    return redirectToConnexion(baseOrigin, "not_configured")
  }

  // Refus explicite par l'utilisateur côté provider (ex: "Cancel" chez Google).
  const providerError = requestUrl.searchParams.get("error")
  if (providerError) {
    return redirectToConnexion(baseOrigin, providerError)
  }

  const code = requestUrl.searchParams.get("code")
  const stateNonce = requestUrl.searchParams.get("state")
  if (!code || !stateNonce) {
    return redirectToConnexion(baseOrigin, "missing_params")
  }

  const stateCookieValue = extractCookieValue(request.headers.get("cookie"), OAUTH_STATE_COOKIE)
  const state = stateCookieValue ? decodeStateCookie(stateCookieValue) : null

  if (!state || state.provider !== provider || state.nonce !== stateNonce) {
    return redirectToConnexion(baseOrigin, "invalid_state")
  }

  let profile
  try {
    profile = await exchangeCodeForProfile({
      provider,
      code,
      redirectUri: getRedirectUri(request, provider),
      codeVerifier: state.codeVerifier,
    })
  } catch (err) {
    console.error("[oauth] exchange failed:", err)
    return redirectToConnexion(baseOrigin, "exchange_failed", state.returnTo)
  }

  let resolved
  try {
    resolved = await resolveOAuthSignIn({ provider, profile })
  } catch (err) {
    console.error("[oauth] resolveOAuthSignIn threw:", err)
    return redirectToConnexion(baseOrigin, "exchange_failed", state.returnTo)
  }
  if (!resolved.ok) {
    return redirectToConnexion(baseOrigin, resolved.error, state.returnTo)
  }

  let sessionToken
  try {
    sessionToken = await createAuthSession(resolved.result.userId)
  } catch (err) {
    console.error("[oauth] createAuthSession threw:", err)
    return redirectToConnexion(baseOrigin, "exchange_failed", state.returnTo)
  }

  console.log(`[oauth] success provider=${provider} kind=${resolved.result.kind} userId=${resolved.result.userId}`)
  const destination = state.returnTo ?? "/"
  // Nouveau compte créé via OAuth → code postal manquant. On redirige vers l'écran
  // de complétion de profil, en conservant la destination d'origine via `?next=`.
  const finalUrl =
    resolved.result.kind === "created"
      ? (() => {
          const u = new URL("/completer-profil", baseOrigin)
          u.searchParams.set("next", destination)
          return u
        })()
      : new URL(destination, baseOrigin)

  // On pose le cookie via une page HTML intermédiaire plutôt qu'un redirect 302.
  // Next.js / Vercel Edge peut supprimer les Set-Cookie headers sur les réponses
  // redirect ; une réponse 200 avec meta-refresh garantit que le cookie est stocké
  // par le navigateur avant la navigation vers la destination finale.
  const isSecure = process.env.NODE_ENV === "production"
  const cookieStr = [
    `${AUTH_COOKIE_NAME}=${sessionToken}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    isSecure ? "Secure" : "",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ].filter(Boolean).join("; ")

  const clearStateStr = [
    `${OAUTH_STATE_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    isSecure ? "Secure" : "",
    "Max-Age=0",
  ].filter(Boolean).join("; ")

  const dest = finalUrl.toString()
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=${dest}">
  <title>Connexion…</title>
</head>
<body>
  <script>window.location.replace(${JSON.stringify(dest)})</script>
</body>
</html>`

  // IMPORTANT : chaque cookie DOIT être dans un header `Set-Cookie` distinct.
  // Joindre deux cookies avec une virgule casse le parsing navigateur (la virgule
  // apparaît légitimement dans `Expires=Wed, 09 Jun …`), ce qui faisait qu'AUCUN
  // des deux cookies n'était posé → session OAuth silencieusement perdue.
  const headers = new Headers({
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store, no-cache",
  })
  headers.append("Set-Cookie", cookieStr)
  headers.append("Set-Cookie", clearStateStr)

  return new Response(html, { status: 200, headers })
}
