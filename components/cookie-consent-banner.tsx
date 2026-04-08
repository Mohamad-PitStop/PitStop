"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/locale-context"

const CONSENT_KEY = "pitstop-cookie-consent-v1"
type ConsentValue = "accepted" | "rejected"

function readConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(CONSENT_KEY)
  return raw === "accepted" || raw === "rejected" ? raw : null
}

export function CookieConsentBanner() {
  const { t } = useTranslation()
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
    <div className="fixed left-4 right-4 z-50 mx-auto max-w-3xl rounded-xl border border-border/60 bg-card/95 p-4 shadow-lg backdrop-blur max-sm:bottom-[calc(4.5rem+env(safe-area-inset-bottom))] sm:max-xl:bottom-[calc(4.5rem+env(safe-area-inset-bottom))] xl:bottom-4">
      <p className="text-sm text-muted-foreground">{t("cookies.banner")}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => saveConsent("rejected")}>
          {t("cookies.reject")}
        </Button>
        <Button type="button" onClick={() => saveConsent("accepted")}>
          {t("cookies.accept")}
        </Button>
      </div>
    </div>
  )
}
