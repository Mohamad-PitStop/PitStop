"use client"

import { usePathname } from "next/navigation"
import { useLayoutEffect, useMemo, useRef } from "react"
import { cn } from "@/lib/utils"
import { getRouteTransitionKind } from "@/lib/route-transition"

/**
 * Enveloppe les pages pour une entrée animée (glissement horizontal discret ou fondu).
 * La direction dépend de la route précédente vs nouvelle (`lib/route-transition.ts`).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prevPathRef = useRef<string | null>(null)

  const kind = useMemo(() => getRouteTransitionKind(prevPathRef.current, pathname), [pathname])

  useLayoutEffect(() => {
    prevPathRef.current = pathname
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
