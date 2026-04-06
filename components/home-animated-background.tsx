"use client"

import { useEffect, useState } from "react"

/**
 * Fond animé accueil uniquement (page `/`) — aurora / dégradés coniques lents.
 * Remonte après restauration bfcache (bouton Précédent) pour relancer les animations CSS.
 */
export function HomeAnimatedBackground() {
  const [instanceKey, setInstanceKey] = useState(0)

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setInstanceKey((k) => k + 1)
    }
    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
  }, [])

  return (
    <div
      key={instanceKey}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-transparent to-background/55" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="home-bg-v2-spin home-bg-v2-spin--a h-[190vmax] w-[190vmax] will-change-transform">
          <div
            className="h-full w-full blur-3xl opacity-[0.88]"
            style={{
              background:
                "conic-gradient(from 200deg at 50% 50%, hsl(142 76% 52% / 0.55) 0deg, transparent 48deg, hsl(217 82% 58% / 0.42) 125deg, transparent 205deg, hsl(142 72% 48% / 0.38) 295deg, transparent 360deg)",
            }}
          />
        </div>
      </div>
      <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2">
        <div className="home-bg-v2-spin home-bg-v2-spin--b h-[140vmax] w-[140vmax] will-change-transform">
          <div
            className="h-full w-full blur-2xl opacity-[0.72]"
            style={{
              background:
                "conic-gradient(from 90deg at 40% 45%, transparent 0deg, hsl(217 85% 58% / 0.45) 95deg, transparent 185deg, hsl(142 70% 52% / 0.35) 275deg, transparent 360deg)",
            }}
          />
        </div>
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_95%_85%_at_50%_28%,transparent_0%,transparent_42%,rgb(13_27_62/0.72)_88%)]" />
    </div>
  )
}
