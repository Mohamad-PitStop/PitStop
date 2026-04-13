/**
 * Validation Cloudflare Turnstile côté serveur.
 *
 * Variables d'environnement requises :
 *   TURNSTILE_SECRET_KEY   — clé secrète obtenue dans Cloudflare Dashboard > Turnstile
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY — clé publique (côté client)
 *
 * En développement sans clés configurées, la validation est ignorée (laisse passer).
 */

export async function verifyTurnstile(token: string | null | undefined, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim()

  // Sans clé configurée : passer silencieusement en dev, bloquer en prod
  if (!secret) {
    return process.env.NODE_ENV !== "production"
  }

  // Token absent
  if (!token || typeof token !== "string" || token.trim() === "") {
    return false
  }

  try {
    const body = new URLSearchParams({ secret, response: token.trim() })
    if (ip) body.set("remoteip", ip)

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      // Timeout de 5 secondes pour ne pas bloquer la route indéfiniment
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) return false
    const data = (await res.json()) as { success: boolean }
    return data.success === true
  } catch {
    // Réseau ou timeout : en prod on rejette, en dev on laisse passer
    return process.env.NODE_ENV !== "production"
  }
}
