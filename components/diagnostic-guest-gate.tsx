"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/i18n/locale-context"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

type Props = {
  open: boolean
  guestUsed: boolean
  loading: boolean
  onLogin: () => void
  onContinueGuest: () => Promise<void>
}

export function DiagnosticGuestGate({ open, guestUsed, loading, onLogin, onContinueGuest }: Props) {
  const { t } = useTranslation()
  const [guestLoading, setGuestLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (!open) return null

  async function handleGuest() {
    setErr(null)
    setGuestLoading(true)
    try {
      await onContinueGuest()
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur")
    } finally {
      setGuestLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/70 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-diag-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl shadow-black/20">
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">…</p>
          </div>
        ) : guestUsed ? (
          <>
            <h2 id="guest-diag-title" className="font-display text-xl font-bold text-foreground">
              {t("guestDiag.usedTitle")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("guestDiag.usedBody")}</p>
            <Button className="mt-6 w-full" onClick={onLogin}>
              {t("guestDiag.usedLogin")}
            </Button>
          </>
        ) : (
          <>
            <h2 id="guest-diag-title" className="font-display text-xl font-bold text-foreground">
              {t("guestDiag.entryTitle")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("guestDiag.entryIntro")}</p>
            <p className="mt-3 text-xs text-muted-foreground/90 border border-border/40 rounded-lg p-3 bg-muted/20">
              {t("guestDiag.existingAccountHint")}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{t("guestDiag.guestNote")}</p>
            {err ? <p className="mt-3 text-sm text-destructive">{err}</p> : null}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button variant="outline" className="w-full sm:flex-1" onClick={onLogin}>
                {t("guestDiag.loginCta")}
              </Button>
              <Button className="w-full sm:flex-1" disabled={guestLoading} onClick={() => void handleGuest()}>
                {guestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("guestDiag.guestCta")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
