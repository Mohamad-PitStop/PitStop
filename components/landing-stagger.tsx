"use client"

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "pitstop-landing-zoom-intro-v1"

type StaggerMode = "idle" | "skip" | "run"

/**
 * Première visite sur l’accueil : cascade zoom (courbe non linéaire), puis mémorisation localStorage.
 */
export function LandingStaggerRoot({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<StaggerMode>("idle")
  const ran = useRef(false)

  useLayoutEffect(() => {
    if (ran.current) return
    ran.current = true
    try {
      if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) {
        setMode("skip")
      } else {
        setMode("run")
      }
    } catch {
      setMode("skip")
    }
  }, [])

  useLayoutEffect(() => {
    if (mode !== "run") return
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, "1")
      } catch {
        // ignore
      }
    }, 3200)
    return () => window.clearTimeout(t)
  }, [mode])

  return (
    <div
      className={cn(
        "landing-stagger-root",
        mode === "run" && "landing-stagger-root--run",
        mode === "skip" && "landing-stagger-root--skip"
      )}
    >
      {children}
    </div>
  )
}

/** Un bloc de la cascade ; `index` contrôle le délai (~52 ms par pas). */
export function LandingStaggerItem({
  children,
  index,
  className,
}: {
  children: ReactNode
  index: number
  className?: string
}) {
  const delayMs = index * 52
  return (
    <div
      className={cn("landing-stagger-item", className)}
      style={{ "--landing-stagger-delay": `${delayMs}ms` } as CSSProperties}
    >
      {children}
    </div>
  )
}
