/**
 * Événement window pour resynchroniser l’UI après connexion / déconnexion
 * sans recharger la page (liens accueil, CTA diagnostic, etc.).
 */
export const AUTH_SESSION_CHANGED_EVENT = "pitstop-auth-session-changed"

export function dispatchAuthSessionChanged(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT))
}
