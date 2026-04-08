"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, Phone, Mail, XCircle } from "lucide-react"
import { useTranslation } from "@/lib/i18n/locale-context"

function AnnulerLoadingFallback() {
  const { t } = useTranslation()
  return <p className="text-muted-foreground">{t("rdvCancel.loading")}</p>
}

type State =
  | { phase: "loading" }
  | { phase: "confirm"; dateLabel: string }
  | { phase: "contact_garage"; dateLabel: string; garagePhone: string | null; garageEmail: string | null }
  | { phase: "too_late" }
  | { phase: "success"; refunded: boolean; message: string }
  | { phase: "already_cancelled" }
  | { phase: "error"; message: string }
  | { phase: "no_token" }

function AnnulerContent() {
  const { t } = useTranslation()
  const params = useSearchParams()
  const token = params.get("token") ?? ""
  const [state, setState] = useState<State>({ phase: "loading" })
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!token) {
      setState({ phase: "no_token" })
      return
    }
    fetch(`/api/reservation/status-by-token?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) {
          setState({ phase: "error", message: data.error ?? t("rdvCancel.notFound") })
          return
        }
        const { reservation, window: cancelWindow, garagePhone, garageEmail } = data
        if (reservation.status === "cancelled") {
          setState({ phase: "already_cancelled" })
          return
        }
        if (cancelWindow === "contact_garage") {
          setState({ phase: "contact_garage", dateLabel: reservation.dateLabel, garagePhone, garageEmail })
          return
        }
        if (cancelWindow === "too_late") {
          setState({ phase: "too_late" })
          return
        }
        setState({ phase: "confirm", dateLabel: reservation.dateLabel })
      })
      .catch(() => setState({ phase: "error", message: t("rdvCancel.errorLoad") }))
  }, [token, t])

  async function handleCancel() {
    setCancelling(true)
    try {
      const res = await fetch("/api/reservation/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelToken: token }),
      })
      const data = await res.json()
      if (data.ok) {
        setState({ phase: "success", refunded: data.refunded, message: data.message })
      } else if (data.window === "contact_garage") {
        setState({ phase: "contact_garage", dateLabel: "", garagePhone: data.garagePhone, garageEmail: data.garageEmail })
      } else if (data.window === "too_late") {
        setState({ phase: "too_late" })
      } else {
        setState({ phase: "error", message: data.error ?? t("rdvCancel.errorCancel") })
      }
    } catch {
      setState({ phase: "error", message: t("rdvCancel.networkError") })
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {state.phase === "loading" && (
        <p className="text-muted-foreground text-center">{t("rdvCancel.loading")}</p>
      )}

      {state.phase === "no_token" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center space-y-3">
          <XCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-foreground font-semibold">{t("rdvCancel.noTokenTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("rdvCancel.noTokenDesc")}</p>
          <Button asChild variant="outline"><Link href="/">{t("common.backHome")}</Link></Button>
        </div>
      )}

      {state.phase === "already_cancelled" && (
        <div className="rounded-xl border border-border/50 bg-card p-6 text-center space-y-3">
          <CheckCircle className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-foreground font-semibold">{t("rdvCancel.alreadyTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("rdvCancel.alreadyDesc")}</p>
          <Button asChild variant="outline"><Link href="/">{t("common.backHome")}</Link></Button>
        </div>
      )}

      {state.phase === "confirm" && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{t("rdvCancel.confirmTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {t("rdvCancel.confirmBody")}{" "}
                <span className="font-medium text-foreground">{state.dateLabel}</span>.
              </p>
              <p className="text-sm text-muted-foreground">{t("rdvCancel.refundNote")}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? t("rdvCancel.cancelling") : t("rdvCancel.yesCancel")}
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">{t("rdvCancel.keep")}</Link>
            </Button>
          </div>
        </div>
      )}

      {state.phase === "contact_garage" && (
        <div className="rounded-xl border border-orange-400/30 bg-orange-500/10 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{t("rdvCancel.contactTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("rdvCancel.contactBody")}</p>
            </div>
          </div>
          <div className="rounded-lg border border-border/50 bg-card p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">{t("rdvCancel.garageDetails")}</p>
            {state.garagePhone && (
              <a
                href={`tel:${state.garagePhone}`}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                {state.garagePhone}
              </a>
            )}
            {state.garageEmail && (
              <a
                href={`mailto:${state.garageEmail}`}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Mail className="h-4 w-4" />
                {state.garageEmail}
              </a>
            )}
          </div>
          <Button asChild variant="outline" className="w-full"><Link href="/">{t("common.backHome")}</Link></Button>
        </div>
      )}

      {state.phase === "too_late" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <XCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{t("rdvCancel.tooLateTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("rdvCancel.tooLateBody")}</p>
            </div>
          </div>
          <Button asChild variant="outline" className="w-full"><Link href="/">{t("common.backHome")}</Link></Button>
        </div>
      )}

      {state.phase === "success" && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 space-y-4 text-center">
          <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto" />
          <p className="font-semibold text-foreground text-lg">{t("rdvCancel.successTitle")}</p>
          <p className="text-sm text-muted-foreground">{state.message}</p>
          {state.refunded && (
            <p className="text-xs text-muted-foreground">{t("rdvCancel.emailSent")}</p>
          )}
          <Button asChild variant="outline"><Link href="/">{t("common.backHome")}</Link></Button>
        </div>
      )}

      {state.phase === "error" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center space-y-3">
          <XCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-foreground font-semibold">{t("rdvCancel.errorGeneric")}</p>
          <p className="text-sm text-muted-foreground">{state.message}</p>
          <Button asChild variant="outline"><Link href="/">{t("common.backHome")}</Link></Button>
        </div>
      )}
    </div>
  )
}

export default function AnnulerPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Suspense fallback={<AnnulerLoadingFallback />}>
          <AnnulerContent />
        </Suspense>
      </main>
    </div>
  )
}
