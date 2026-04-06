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
      className="home-animated-bg pointer-events-none fixed inset-0 z-0 overflow-hidden isolate"
      aria-hidden
    >
      <div className="absolute inset-0 bg-background [transform:translateZ(0)]" />
      <div className="home-aurora-fade-y absolute inset-0 bg-gradient-to-b from-background/55 via-transparent to-background/55 [transform:translateZ(0)]" />
      <div className="home-aurora-anchor home-aurora-anchor--a absolute left-1/2 top-[36%] [transform:translate3d(-50%,-50%,0)]">
        <div className="home-bg-v2-spin home-bg-v2-spin--a h-[min(235vmin,3200px)] w-[min(235vmin,3200px)] max-w-none will-change-transform [transform:translateZ(0)] [-webkit-backface-visibility:hidden] [backface-visibility:hidden]">
          <div
            className="home-aurora-a-inner h-full w-full blur-[56px] opacity-[0.95] [transform:translateZ(0)] sm:blur-[64px]"
            style={{
              background:
                "conic-gradient(from 200deg at 50% 50%, hsl(142 76% 52% / 0.62) 0deg, transparent 52deg, hsl(217 82% 58% / 0.5) 125deg, transparent 205deg, hsl(142 72% 48% / 0.46) 295deg, transparent 360deg)",
            }}
          />
        </div>
      </div>
      <div className="home-aurora-anchor home-aurora-anchor--b absolute left-1/2 top-[30%] [transform:translate3d(-50%,-50%,0)]">
        <div className="home-bg-v2-spin home-bg-v2-spin--b h-[min(175vmin,2800px)] w-[min(175vmin,2800px)] max-w-none will-change-transform [transform:translateZ(0)] [-webkit-backface-visibility:hidden] [backface-visibility:hidden]">
          <div
            className="home-aurora-b-inner h-full w-full blur-[44px] opacity-[0.82] [transform:translateZ(0)] sm:blur-[52px]"
            style={{
              background:
                "conic-gradient(from 90deg at 40% 45%, transparent 0deg, hsl(217 85% 58% / 0.52) 95deg, transparent 185deg, hsl(142 70% 52% / 0.42) 275deg, transparent 360deg)",
            }}
          />
        </div>
      </div>
      <div className="home-aurora-vignette absolute inset-0 bg-[radial-gradient(ellipse_100%_92%_at_50%_18%,transparent_0%,transparent_48%,rgb(13_27_62/0.65)_90%)] [transform:translateZ(0)] [pointer-events:none]" />
    </div>
  )
}
