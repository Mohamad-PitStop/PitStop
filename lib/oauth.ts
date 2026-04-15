import { createHash, randomBytes } from "node:crypto"

/**
 * OAuth 2.0 minimal pour Google et Facebook.
 *
 * Flux :
 *  1. `/api/auth/oauth/[provider]/start` → génère un state + PKCE,
 *     pose un cookie court (`pitstop_oauth_state`), redirige vers l'URL d'autorisation du provider.
 *  2. Le provider renvoie l'utilisateur vers `/api/auth/oauth/[provider]/callback?code=…&state=…`.
 *  3. Callback vérifie le state, échange le code contre un access token, récupère le profil.
 *  4. Logique de compte : login existant, link par email vérifié, ou création de compte.
 */

export type OAuthProviderId = "google" | "facebook"

export type OAuthProfile = {
  providerAccountId: string
  email: string | null
  emailVerified: boolean
  name: string | null
  avatarUrl: string | null
}

type ProviderConfig = {
  id: OAuthProviderId
  authorizeUrl: string
  tokenUrl: string
  userInfoUrl: string
  scope: string
  /** Google exige/supporte PKCE ; Facebook ne le supporte pas (sha256). */
  usePkce: boolean
  clientIdEnv: string
  clientSecretEnv: string
  /** Valeurs supplémentaires à joindre à l'URL d'autorisation. */
  extraAuthParams?: Record<string, string>
  /** Valeurs supplémentaires côté token. */
  extraTokenParams?: Record<string, string>
  /** Parse la réponse de l'endpoint userinfo en profil normalisé. */
  parseProfile: (raw: unknown) => OAuthProfile
}

const PROVIDERS: Record<OAuthProviderId, ProviderConfig> = {
  google: {
    id: "google",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile",
    usePkce: true,
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    extraAuthParams: {
      access_type: "online",
      prompt: "select_account",
    },
    parseProfile(raw) {
      const r = raw as {
        sub?: string
        email?: string
        email_verified?: boolean
        name?: string
        picture?: string
      }
      return {
        providerAccountId: String(r.sub ?? ""),
        email: r.email ?? null,
        emailVerified: Boolean(r.email_verified),
        name: r.name ?? null,
        avatarUrl: r.picture ?? null,
      }
    },
  },
  facebook: {
    id: "facebook",
    authorizeUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    userInfoUrl: "https://graph.facebook.com/me?fields=id,name,email,picture.type(large)",
    scope: "email public_profile",
    usePkce: false,
    clientIdEnv: "FACEBOOK_APP_ID",
    clientSecretEnv: "FACEBOOK_APP_SECRET",
    parseProfile(raw) {
      const r = raw as {
        id?: string
        name?: string
        email?: string
        picture?: { data?: { url?: string } }
      }
      return {
        providerAccountId: String(r.id ?? ""),
        email: r.email ?? null,
        // Facebook ne renvoie pas l'état "email_verified" ; on considère l'email comme
        // vérifié côté Facebook (leur signup l'exige). À recouper si besoin.
        emailVerified: Boolean(r.email),
        name: r.name ?? null,
        avatarUrl: r.picture?.data?.url ?? null,
      }
    },
  },
}

export function isOAuthProvider(s: string): s is OAuthProviderId {
  return s === "google" || s === "facebook"
}

export function getProviderConfig(id: OAuthProviderId): ProviderConfig {
  return PROVIDERS[id]
}

export function isProviderConfigured(id: OAuthProviderId): boolean {
  const cfg = PROVIDERS[id]
  return Boolean(process.env[cfg.clientIdEnv] && process.env[cfg.clientSecretEnv])
}

/** Retourne l'URL absolue du callback pour un provider donné. */
export function getRedirectUri(request: Request, provider: OAuthProviderId): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  return `${base.replace(/\/$/, "")}/api/auth/oauth/${provider}/callback`
}

// ── State + PKCE ──────────────────────────────────────────────────────────────

export const OAUTH_STATE_COOKIE = "pitstop_oauth_state"
export const OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10 // 10 minutes

export type OAuthStatePayload = {
  provider: OAuthProviderId
  /** Valeur aléatoire, comparée au state renvoyé par le provider. */
  nonce: string
  /** Code verifier PKCE (Google). */
  codeVerifier: string
  /** Redirection finale après login (callbackUrl). */
  returnTo: string | null
  /** "login" ou "signup" — sert de contexte UI, aucune différence technique. */
  mode: "login" | "signup"
  createdAt: number
}

export function createStatePayload(input: {
  provider: OAuthProviderId
  returnTo: string | null
  mode: "login" | "signup"
}): OAuthStatePayload {
  return {
    provider: input.provider,
    nonce: randomBytes(16).toString("hex"),
    codeVerifier: base64UrlEncode(randomBytes(32)),
    returnTo: input.returnTo,
    mode: input.mode,
    createdAt: Date.now(),
  }
}

export function encodeStateCookie(payload: OAuthStatePayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")
}

export function decodeStateCookie(value: string): OAuthStatePayload | null {
  try {
    const json = Buffer.from(value, "base64url").toString("utf8")
    const parsed = JSON.parse(json) as OAuthStatePayload
    if (!parsed || typeof parsed !== "object") return null
    if (!isOAuthProvider(parsed.provider)) return null
    if (typeof parsed.nonce !== "string" || parsed.nonce.length < 16) return null
    return parsed
  } catch {
    return null
  }
}

/** Code challenge PKCE (S256). */
export function computeCodeChallenge(verifier: string): string {
  return base64UrlEncode(createHash("sha256").update(verifier).digest())
}

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

// ── Construction de l'URL d'autorisation ─────────────────────────────────────

export function buildAuthorizationUrl(input: {
  provider: OAuthProviderId
  redirectUri: string
  state: OAuthStatePayload
}): string {
  const cfg = PROVIDERS[input.provider]
  const params = new URLSearchParams({
    client_id: requireEnv(cfg.clientIdEnv),
    redirect_uri: input.redirectUri,
    response_type: "code",
    scope: cfg.scope,
    // Le state envoyé au provider est juste le nonce ; le reste du payload
    // est stocké server-side dans le cookie httpOnly (plus sûr et plus compact).
    state: input.state.nonce,
  })
  if (cfg.usePkce) {
    params.set("code_challenge", computeCodeChallenge(input.state.codeVerifier))
    params.set("code_challenge_method", "S256")
  }
  if (cfg.extraAuthParams) {
    for (const [k, v] of Object.entries(cfg.extraAuthParams)) {
      params.set(k, v)
    }
  }
  return `${cfg.authorizeUrl}?${params.toString()}`
}

// ── Échange code → access token → profil ─────────────────────────────────────

export async function exchangeCodeForProfile(input: {
  provider: OAuthProviderId
  code: string
  redirectUri: string
  codeVerifier: string
}): Promise<OAuthProfile> {
  const cfg = PROVIDERS[input.provider]
  const tokenParams = new URLSearchParams({
    client_id: requireEnv(cfg.clientIdEnv),
    client_secret: requireEnv(cfg.clientSecretEnv),
    code: input.code,
    grant_type: "authorization_code",
    redirect_uri: input.redirectUri,
  })
  if (cfg.usePkce) {
    tokenParams.set("code_verifier", input.codeVerifier)
  }
  if (cfg.extraTokenParams) {
    for (const [k, v] of Object.entries(cfg.extraTokenParams)) {
      tokenParams.set(k, v)
    }
  }

  const tokenRes = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: tokenParams.toString(),
  })
  if (!tokenRes.ok) {
    const body = await tokenRes.text().catch(() => "")
    throw new Error(`[oauth:${cfg.id}] token exchange failed (${tokenRes.status}): ${body.slice(0, 200)}`)
  }
  const tokenData = (await tokenRes.json()) as { access_token?: string; token_type?: string }
  if (!tokenData.access_token) {
    throw new Error(`[oauth:${cfg.id}] missing access_token in token response`)
  }

  const profileRes = await fetch(cfg.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/json",
    },
  })
  if (!profileRes.ok) {
    const body = await profileRes.text().catch(() => "")
    throw new Error(`[oauth:${cfg.id}] profile fetch failed (${profileRes.status}): ${body.slice(0, 200)}`)
  }
  const profileRaw = (await profileRes.json()) as unknown
  const profile = cfg.parseProfile(profileRaw)
  if (!profile.providerAccountId) {
    throw new Error(`[oauth:${cfg.id}] profile response missing provider account id`)
  }
  return profile
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env var: ${name}`)
  return v
}
