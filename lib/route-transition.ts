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

export function getRouteTransitionKind(
  prev: string | null,
  next: string
): RouteTransitionKind {
  if (prev === null || prev === next) return "none"

  const a = MAIN_ORDER[prev]
  const b = MAIN_ORDER[next]

  if (a !== undefined && b !== undefined) {
    if (b > a) return "forward"
    if (b < a) return "back"
    return "none"
  }

  if (next === "/" && prev !== "/") return "back"
  if (prev === "/" && next !== "/") return "forward"

  return "fade"
}
