/**
 * URL de la page de connexion et construction des liens « retour après login ».
 * Un seul paramètre `callbackUrl` (évite la confusion avec `redirect` et les oublis d’encodage).
 */

export const LOGIN_PATH = "/connexion" as const

export type LoginRedirectReason = "diagnostic"

export function buildLoginUrl(
  returnPath: string,
  options?: { reason?: LoginRedirectReason }
): string {
  const params = new URLSearchParams()
  params.set("callbackUrl", returnPath.startsWith("/") ? returnPath : `/${returnPath}`)
  if (options?.reason) params.set("reason", options.reason)
  return `${LOGIN_PATH}?${params.toString()}`
}
