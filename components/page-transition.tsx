"use client"

import { usePathname } from "next/navigation"
import { useLayoutEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import { getRouteTransitionKind } from "@/lib/route-transition"

/**
 * Dernier pathname « commité » après navigation (effet client).
 * Un `useRef` seul échoue si ce composant est remonté lors d’une navigation SPA :
 * le ref repasse à `null` et l’animation est toujours `none`.
 * La variable module survit au remontage (un onglet = une instance JS).
 */
let lastCommittedPathname: string | null = null

/**
 * Enveloppe les pages pour une entrée animée (glissement horizontal discret ou fondu).
 * La direction dépend de la route précédente vs nouvelle (`lib/route-transition.ts`).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const kind = useMemo(
    () => getRouteTransitionKind(lastCommittedPathname, pathname),
    [pathname]
  )

  useLayoutEffect(() => {
    lastCommittedPathname = pathname
  }, [pathname])

  const animClass =
    kind === "forward"
      ? "page-t-enter-forward"
      : kind === "back"
        ? "page-t-enter-back"
        : kind === "fade"
          ? "page-t-enter-fade"
          : ""

  return (
    <div key={pathname} className={cn("min-h-screen", animClass)}>
      {children}
    </div>
  )
}
