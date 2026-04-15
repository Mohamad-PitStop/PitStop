import { NextResponse } from "next/server"
import {
  buildAuthorizationUrl,
  createStatePayload,
  encodeStateCookie,
  getRedirectUri,
  isOAuthProvider,
  isProviderConfigured,
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_MAX_AGE_SECONDS,
} from "@/lib/oauth"

export const runtime = "nodejs"

function safeInternalPath(p: string | null): string | null {
  if (!p || !p.startsWith("/") || p.startsWith("//")) return null
  return p
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  if (!isOAuthProvider(provider)) {
    return NextResponse.json({ ok: false, error: "Fournisseur inconnu." }, { status: 404 })
  }
  if (!isProviderConfigured(provider)) {
    return NextResponse.json(
      { ok: false, error: `Connexion ${provider} non configurée.` },
      { status: 503 }
    )
  }

  const url = new URL(request.url)
  const returnTo = safeInternalPath(url.searchParams.get("callbackUrl"))
  const modeParam = url.searchParams.get("mode")
  const mode = modeParam === "signup" ? "signup" : "login"

  const state = createStatePayload({ provider, returnTo, mode })
  const redirectUri = getRedirectUri(request, provider)
  const authUrl = buildAuthorizationUrl({ provider, redirectUri, state })

  const response = NextResponse.redirect(authUrl)
  response.cookies.set(OAUTH_STATE_COOKIE, encodeStateCookie(state), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  })
  return response
}
