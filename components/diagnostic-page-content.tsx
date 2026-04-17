"use client"

import { useCallback, useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { VehicleForm } from "@/components/vehicle-form"
import { DiagnosticGuestGate } from "@/components/diagnostic-guest-gate"
import { CheckCircle, Info } from "lucide-react"
import { useTranslation } from "@/lib/i18n/locale-context"
import { buildLoginUrl } from "@/lib/login-redirect"

export function DiagnosticPageContent({ skipGuestGate = false }: { skipGuestGate?: boolean }) {
  const { t } = useTranslation()
  const [guestUsed, setGuestUsed] = useState(false)
  const [guestMode, setGuestMode] = useState(false)
  const [eligibilityReady, setEligibilityReady] = useState(skipGuestGate)
  const [authGateOpen, setAuthGateOpen] = useState(false)

  // Pré-charge en arrière-plan si l'utilisateur a déjà consommé son diag invité.
  // On n'affiche PLUS la modale au chargement : le formulaire est visible tout de
  // suite pour laisser l'utilisateur saisir son véhicule. La modale ne s'ouvre
  // qu'au clic sur « Lancer le diagnostic » si la session n'est pas connectée.
  useEffect(() => {
    if (skipGuestGate) return
    let cancelled = false
    ;(async () => {
      try {
        const gRes = await fetch("/api/guest/diagnostic-eligibility", { credentials: "include" })
        const g = await gRes.json().catch(() => null)
        if (cancelled) return
        setGuestUsed(!!g?.guestDiagnosticUsed)
        setEligibilityReady(true)
      } catch {
        if (!cancelled) setEligibilityReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [skipGuestGate])

  const onLogin = useCallback(() => {
    window.location.assign(buildLoginUrl("/diagnostic", { reason: "diagnostic" }))
  }, [])

  const onContinueGuest = useCallback(async () => {
    const r = await fetch("/api/guest/diagnostic-intent", { method: "POST", credentials: "include" })
    const data = await r.json().catch(() => null)
    if (!r.ok) {
      throw new Error(typeof data?.message === "string" ? data.message : "Impossible d’activer le mode invité.")
    }
    setGuestMode(true)
    setAuthGateOpen(false)
  }, [])

  const onRequireAuth = useCallback(() => {
    if (skipGuestGate) return
    setAuthGateOpen(true)
  }, [skipGuestGate])

  return (
    <div className="relative min-h-screen bg-background">
      <DiagnosticGuestGate
        open={authGateOpen}
        guestUsed={guestUsed}
        loading={!eligibilityReady}
        onLogin={onLogin}
        onContinueGuest={onContinueGuest}
      />

      <Navbar />

      <main className={authGateOpen ? "pointer-events-none opacity-40 select-none" : ""}>
        <section className="relative overflow-hidden py-14 md:py-20">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

          <div className="container relative mx-auto max-w-6xl px-4">
            <div className="mx-auto mb-6 max-w-3xl text-center md:mb-8">
              <h1 className="font-display mb-4 text-balance text-3xl font-bold leading-tight text-foreground md:text-4xl lg:text-5xl">
                {t("diagnosticPage.title")}
              </h1>

              <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
                {t("diagnosticPage.subtitle")}
              </p>
            </div>

            <div className="mx-auto mb-8 flex max-w-3xl justify-center md:mb-10">
              <div className="flex min-h-[2rem] items-center justify-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-center text-[12px] font-medium leading-snug text-primary sm:gap-2 sm:px-5 sm:py-2 sm:text-sm">
                <CheckCircle className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                <span>{t("diagnosticPage.badge")}</span>
              </div>
            </div>

            <div className="mx-auto max-w-4xl space-y-8">
              <VehicleForm
                guestDiagnosticSession={guestMode && !skipGuestGate}
                onRequireAuth={skipGuestGate ? undefined : onRequireAuth}
              />

              <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-secondary/30 p-4">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="text-sm text-muted-foreground">
                  <p className="mb-1 font-medium text-foreground">{t("diagnosticPage.disclaimerTitle")}</p>
                  <p>{t("diagnosticPage.disclaimerBody")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
