"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TEST_PHASE_SIGNUP_BONUS_ENABLED } from "@/lib/feature-flags"
import { Sparkles } from "lucide-react"

const PARAM = "welcome_test"

/**
 * Modale post-inscription (phase de test uniquement) : remerciement + 1 crédit offert.
 */
export function SignupWelcomeOverlay() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!TEST_PHASE_SIGNUP_BONUS_ENABLED) return
    if (searchParams.get(PARAM) === "1") {
      setOpen(true)
    }
  }, [searchParams])

  function dismiss() {
    setOpen(false)
    const url = new URL(window.location.href)
    url.searchParams.delete(PARAM)
    router.replace(url.pathname + url.search, { scroll: false })
  }

  if (!TEST_PHASE_SIGNUP_BONUS_ENABLED || !open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-test-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-background/70 backdrop-blur-md"
        onClick={dismiss}
        aria-label="Fermer"
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-primary/25 bg-card/95 p-6 shadow-2xl shadow-primary/10 animate-in fade-in zoom-in-95 duration-300">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
            <Sparkles className="h-7 w-7 text-primary" aria-hidden />
          </div>
        </div>
        <h2 id="welcome-test-title" className="font-display text-center text-xl font-bold text-foreground">
          Merci d&apos;être des nôtres !
        </h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
          Votre compte est confirmé. Pendant cette <strong className="text-foreground">phase de test</strong>, votre
          participation nous aide à améliorer PitStop.
        </p>
        <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
          Merci de tester le site avec nous.
        </p>
        <p className="mt-4 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-center text-sm font-medium text-primary">
          Pour vous remercier : <span className="font-bold">un crédit de diagnostic gratuit</span> a été ajouté à votre
          solde.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/diagnostic" onClick={dismiss}>
              Lancer un diagnostic
            </Link>
          </Button>
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={dismiss}>
            Continuer sur l&apos;accueil
          </Button>
        </div>
      </div>
    </div>
  )
}
