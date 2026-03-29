"use client"

import { useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/next"

const CONSENT_KEY = "pitstop-cookie-consent-v1"

function hasAcceptedConsent(): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(CONSENT_KEY) === "accepted"
}

export function AnalyticsConsentGate() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const sync = () => setEnabled(hasAcceptedConsent())
    sync()
    window.addEventListener("storage", sync)
    window.addEventListener("pitstop-consent-changed", sync)
    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener("pitstop-consent-changed", sync)
    }
  }, [])

  if (!enabled) return null
  return <Analytics />
}
