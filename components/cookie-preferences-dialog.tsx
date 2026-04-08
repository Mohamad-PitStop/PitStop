"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { readCgvConsent, saveCgvConsent, type CgvConsentValue } from "@/lib/cgv-consent"
import { useTranslation } from "@/lib/i18n/locale-context"

const CONSENT_KEY = "pitstop-cookie-consent-v1"
type ConsentValue = "accepted" | "rejected" | null

function readConsent(): ConsentValue {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(CONSENT_KEY)
  return raw === "accepted" || raw === "rejected" ? raw : null
}

export function CookiePreferencesDialog() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const [consent, setConsent] = useState<ConsentValue>(null)
  const [cgvConsent, setCgvConsent] = useState<CgvConsentValue>(null)
  const [open, setOpen] = useState(false)
  const [showTrigger, setShowTrigger] = useState(true)

  useEffect(() => {
    setConsent(readConsent())
    setCgvConsent(readCgvConsent())
  }, [])

  useEffect(() => {
    const sync = () => {
      setConsent(readConsent())
      setCgvConsent(readCgvConsent())
    }
    window.addEventListener("storage", sync)
    window.addEventListener("pitstop-consent-changed", sync)
    window.addEventListener("pitstop-cgv-consent-changed", sync)
    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener("pitstop-consent-changed", sync)
      window.removeEventListener("pitstop-cgv-consent-changed", sync)
    }
  }, [])

  useEffect(() => {
    const isHome = pathname === "/"
    if (!isHome) {
      setShowTrigger(true)
      return
    }

    const updateVisibility = () => {
      // Sur l'accueil: caché tout en haut, visible dès le début du scroll.
      setShowTrigger(window.scrollY > 4)
    }

    updateVisibility()
    window.addEventListener("scroll", updateVisibility, { passive: true })
    return () => window.removeEventListener("scroll", updateVisibility)
  }, [pathname])

  const saveConsent = (value: Exclude<ConsentValue, null>) => {
    window.localStorage.setItem(CONSENT_KEY, value)
    window.dispatchEvent(new Event("pitstop-consent-changed"))
    setConsent(value)
    setOpen(false)
  }

  const saveCgv = (value: Exclude<CgvConsentValue, null>) => {
    saveCgvConsent(value)
    setCgvConsent(value)
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 transition-all duration-400 ease-out ${
        showTrigger ? "translate-y-0 opacity-100 scale-100" : "translate-y-3 opacity-0 scale-95 pointer-events-none"
      }`}
    >
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="bg-card/90 backdrop-blur">
            {t("cookiesPrefs.manageTrigger")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cookiesPrefs.dialogTitle")}</DialogTitle>
            <DialogDescription>{t("cookiesPrefs.dialogDesc")}</DialogDescription>
          </DialogHeader>

          <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
            {t("cookiesPrefs.statusLabel")}{" "}
            <span className="font-medium text-foreground">
              {consent === "accepted"
                ? t("cookiesPrefs.stateAccepted")
                : consent === "rejected"
                  ? t("cookiesPrefs.stateRejected")
                  : t("cookiesPrefs.stateUndefined")}
            </span>
          </div>

          <div className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
            <p>
              {t("cookiesPrefs.cgvCurrentLabel")}{" "}
              <span className="font-medium text-foreground">
                {cgvConsent === "accepted"
                  ? t("cookiesPrefs.stateAccepted")
                  : cgvConsent === "rejected"
                    ? t("cookiesPrefs.stateRejected")
                    : t("cookiesPrefs.stateUndefined")}
              </span>
            </p>
            <p>
              {t("cookiesPrefs.cgvConsultBefore")}{" "}
              <Link href="/conditions-generales-vente" className="text-primary hover:underline">
                {t("cookiesPrefs.cgvConsultLink")}
              </Link>
              {t("cookiesPrefs.cgvConsultAfter")}
            </p>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => saveCgv("rejected")}>
                {t("cookiesPrefs.withdrawCgv")}
              </Button>
              <Button type="button" size="sm" onClick={() => saveCgv("accepted")}>
                {t("cookiesPrefs.acceptCgv")}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => saveConsent("rejected")}>
              {t("cookies.reject")}
            </Button>
            <Button type="button" onClick={() => saveConsent("accepted")}>
              {t("cookies.accept")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
