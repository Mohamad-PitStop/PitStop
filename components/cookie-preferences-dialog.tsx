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

const CONSENT_KEY = "pitstop-cookie-consent-v1"
type ConsentValue = "accepted" | "rejected" | null

function readConsent(): ConsentValue {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(CONSENT_KEY)
  return raw === "accepted" || raw === "rejected" ? raw : null
}

export function CookiePreferencesDialog() {
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
            Gérer mes préférences
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Préférences cookies et CGV</DialogTitle>
            <DialogDescription>
              Gérez vos cookies analytics et votre accord aux conditions générales de vente.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
            Statut actuel:{" "}
            <span className="font-medium text-foreground">
              {consent === "accepted" ? "Accepté" : consent === "rejected" ? "Refusé" : "Non défini"}
            </span>
          </div>

          <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground space-y-2">
            <p>
              Accord CGV actuel:{" "}
              <span className="font-medium text-foreground">
                {cgvConsent === "accepted" ? "Accepté" : cgvConsent === "rejected" ? "Refusé" : "Non défini"}
              </span>
            </p>
            <p>
              Consulter les{" "}
              <Link href="/conditions-generales-vente" className="text-primary hover:underline">
                conditions générales de vente
              </Link>
              .
            </p>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => saveCgv("rejected")}>
                Je retire mon accord
              </Button>
              <Button type="button" size="sm" onClick={() => saveCgv("accepted")}>
                J&apos;accepte les CGV
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => saveConsent("rejected")}>
              Refuser
            </Button>
            <Button type="button" onClick={() => saveConsent("accepted")}>
              Accepter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
