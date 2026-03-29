"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

const CONSENT_KEY = "pitstop-cookie-consent-v1"
type ConsentValue = "accepted" | "rejected"

function readConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(CONSENT_KEY)
  return raw === "accepted" || raw === "rejected" ? raw : null
}

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<ConsentValue | null>(null)

  useEffect(() => {
    setConsent(readConsent())
  }, [])

  const saveConsent = (value: ConsentValue) => {
    window.localStorage.setItem(CONSENT_KEY, value)
    window.dispatchEvent(new Event("pitstop-consent-changed"))
    setConsent(value)
  }

  if (consent) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-3xl rounded-xl border border-border/60 bg-card/95 p-4 shadow-lg backdrop-blur">
      <p className="text-sm text-muted-foreground">
        Nous utilisons des mesures d&apos;audience pour ameliorer PitStop. Vous pouvez accepter ou refuser ces cookies
        non essentiels.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => saveConsent("rejected")}>
          Refuser
        </Button>
        <Button type="button" onClick={() => saveConsent("accepted")}>
          Accepter
        </Button>
      </div>
    </div>
  )
}
