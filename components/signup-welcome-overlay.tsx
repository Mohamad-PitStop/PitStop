"use client"

import { useEffect, useLayoutEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TEST_PHASE_SIGNUP_BONUS_ENABLED } from "@/lib/feature-flags"
import { Sparkles } from "lucide-react"
import { useTranslation } from "@/lib/i18n/locale-context"

const PARAM = "welcome_test"
/** Affichage en attente après redirection depuis la vérification email (URL nettoyée tout de suite). */
const PENDING_KEY = "pitstop_welcome_test_pending"
/** Une fois la modale fermée dans cet onglet : ne plus rouvrir si l’URL repasse en ?welcome_test=1 (ex. historique). */
const ACK_KEY = "pitstop_welcome_test_ack"

/**
 * Modale post-inscription (phase de test uniquement) : remerciement + 1 crédit offert.
 * L’URL `/?welcome_test=1` est remplacée immédiatement par `/` pour ne pas la garder dans l’historique
 * (retour navigateur, restauration d’onglet). La modale ne s’affiche qu’une fois par flux de confirmation.
 */
export function SignupWelcomeOverlay() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [portalReady, setPortalReady] = useState(false)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useLayoutEffect(() => {
    if (!TEST_PHASE_SIGNUP_BONUS_ENABLED) return
    if (searchParams.get(PARAM) !== "1") return
    try {
      if (sessionStorage.getItem(ACK_KEY) === "1") {
        router.replace("/", { scroll: false })
        return
      }
      sessionStorage.setItem(PENDING_KEY, "1")
    } catch {
      // sessionStorage indisponible : on tente quand même d’ouvrir via l’effet ci-dessous
    }
    router.replace("/", { scroll: false })
  }, [searchParams, router])

  useEffect(() => {
    if (!TEST_PHASE_SIGNUP_BONUS_ENABLED) return
    try {
      if (sessionStorage.getItem(PENDING_KEY) === "1") {
        window.scrollTo(0, 0)
        setOpen(true)
      }
    } catch {
      // ignore
    }
  }, [searchParams])

  function dismiss() {
    setOpen(false)
    try {
      sessionStorage.removeItem(PENDING_KEY)
      sessionStorage.setItem(ACK_KEY, "1")
    } catch {
      // ignore
    }
    const url = new URL(window.location.href)
    url.searchParams.delete(PARAM)
    router.replace(url.pathname + url.search, { scroll: false })
  }

  if (!TEST_PHASE_SIGNUP_BONUS_ENABLED || !open || !portalReady) return null

  const overlay = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-test-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-background/70 backdrop-blur-md"
        onClick={dismiss}
        aria-label={t("signupWelcome.close")}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-primary/25 bg-card/95 p-6 shadow-2xl shadow-primary/10 animate-in fade-in zoom-in-95 duration-300">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
            <Sparkles className="h-7 w-7 text-primary" aria-hidden />
          </div>
        </div>
        <h2 id="welcome-test-title" className="font-display text-center text-xl font-bold text-foreground">
          {t("signupWelcome.title")}
        </h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">{t("signupWelcome.p1")}</p>
        <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">{t("signupWelcome.p2")}</p>
        <p className="mt-4 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-center text-sm font-medium text-primary">
          {t("signupWelcome.gift")}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/diagnostic" onClick={dismiss}>
              {t("signupWelcome.ctaDiagnostic")}
            </Link>
          </Button>
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={dismiss}>
            {t("signupWelcome.ctaHome")}
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}
