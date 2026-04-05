/**
 * Détermine l’animation entre deux routes internes (voir `PageTransition`).
 * - Accueil `/`, `/diagnostic`, `/vente` : ordre 0 → 1 → 2 (forward = glissement « en avant », back = inverse).
 * - Vers l’accueil depuis une autre route : back.
 * - Depuis l’accueil vers une autre route : forward.
 * - Autres combinaisons : fondu léger.
 */
export type RouteTransitionKind = "forward" | "back" | "fade" | "none"

const MAIN_ORDER: Record<string, number> = {
  "/": 0,
  "/diagnostic": 1,
  "/vente": 2,
}

/** `usePathname()` est généralement sans slash final ; on normalise pour les cas limites. */
function normalizePath(p: string): string {
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1)
  return p
}

export function getRouteTransitionKind(
  prev: string | null,
  next: string
): RouteTransitionKind {
  const n = normalizePath(next)
  const p = prev === null ? null : normalizePath(prev)
  if (p === null || p === n) return "none"

  const a = MAIN_ORDER[p]
  const b = MAIN_ORDER[n]

  if (a !== undefined && b !== undefined) {
    if (b > a) return "forward"
    if (b < a) return "back"
    return "none"
  }

  if (n === "/" && p !== "/") return "back"
  if (p === "/" && n !== "/") return "forward"

  return "fade"
}
