"use client"

import { usePathname } from "next/navigation"
import { useLayoutEffect, useState, type ReactNode } from "react"
import { getRouteTransitionKind } from "@/lib/route-transition"

const STORAGE_KEY = "pitstop-page-transition-prev"

function readStoredPath(): string | null {
  if (typeof window === "undefined") return null
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStoredPath(path: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, path)
  } catch {
    // private mode, etc.
  }
}

/**
 * Enveloppe les pages pour une entrée animée (glissement discret ou fondu).
 * - Au 1er rendu (SSR + 1er paint client), on ne lit pas sessionStorage : même résultat
 *   que le serveur (`prev` = null), pas d’erreur d’hydratation.
 * - Après `useLayoutEffect`, on lit le dernier chemin enregistré → transitions SPA fiables,
 *   y compris si l’instance React est remontée (ref module insuffisant seul).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  const prevPath = mounted ? readStoredPath() : null
  const kind = getRouteTransitionKind(prevPath, pathname)

  useLayoutEffect(() => {
    setMounted(true)
    writeStoredPath(pathname)
  }, [pathname])

  const animClass =
    kind === "forward"
      ? "page-t-enter-forward"
      : kind === "back"
        ? "page-t-enter-back"
        : kind === "fade"
          ? "page-t-enter-fade"
          : ""

  const className = [
    animClass ? `min-h-screen ${animClass}` : "min-h-screen",
    /* Stacking / compositing : transitions plus stables (Safari / Firefox) */
    "isolate [transform:translateZ(0)]",
  ].join(" ")

  return (
    <div key={pathname} className={className}>
      {children}
    </div>
  )
}
