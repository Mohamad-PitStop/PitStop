"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, Phone, Mail, XCircle } from "lucide-react"

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
  const params = useSearchParams()
  const token = params.get("token") ?? ""
  const [state, setState] = useState<State>({ phase: "loading" })
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!token) {
      setState({ phase: "no_token" })
      return
    }
    // On essaie d'abord de récupérer les infos de la réservation pour afficher un écran de confirmation
    fetch(`/api/reservation/status-by-token?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) {
          setState({ phase: "error", message: data.error ?? "Réservation introuvable." })
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
      .catch(() => setState({ phase: "error", message: "Impossible de charger les informations." }))
  }, [token])

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
        setState({ phase: "error", message: data.error ?? "Erreur lors de l'annulation." })
      }
    } catch {
      setState({ phase: "error", message: "Erreur réseau. Veuillez réessayer." })
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {state.phase === "loading" && (
        <p className="text-muted-foreground text-center">Chargement…</p>
      )}

      {state.phase === "no_token" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center space-y-3">
          <XCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-foreground font-semibold">Lien invalide</p>
          <p className="text-sm text-muted-foreground">Ce lien d&apos;annulation est invalide ou incomplet.</p>
          <Button asChild variant="outline"><Link href="/">Retour à l&apos;accueil</Link></Button>
        </div>
      )}

      {state.phase === "already_cancelled" && (
        <div className="rounded-xl border border-border/50 bg-card p-6 text-center space-y-3">
          <CheckCircle className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-foreground font-semibold">Rendez-vous déjà annulé</p>
          <p className="text-sm text-muted-foreground">Cette réservation a déjà été annulée.</p>
          <Button asChild variant="outline"><Link href="/">Retour à l&apos;accueil</Link></Button>
        </div>
      )}

      {state.phase === "confirm" && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Confirmer l&apos;annulation</p>
              <p className="text-sm text-muted-foreground">
                Vous êtes sur le point d&apos;annuler votre rendez-vous du{" "}
                <span className="font-medium text-foreground">{state.dateLabel}</span>.
              </p>
              <p className="text-sm text-muted-foreground">
                Votre acompte de <strong>25 EUR</strong> sera remboursé automatiquement sur votre moyen de paiement d&apos;origine (5–10 jours ouvrés).
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? "Annulation en cours…" : "Oui, annuler ce rendez-vous"}
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">Conserver</Link>
            </Button>
          </div>
        </div>
      )}

      {state.phase === "contact_garage" && (
        <div className="rounded-xl border border-orange-400/30 bg-orange-500/10 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Annulation en ligne indisponible</p>
              <p className="text-sm text-muted-foreground">
                Le rendez-vous est dans moins de 12 heures. L&apos;annulation en ligne n&apos;est plus possible.
                Vous devez contacter directement le garage pour convenir d&apos;un accord.
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-border/50 bg-card p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Coordonnées du garage</p>
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
          <Button asChild variant="outline" className="w-full"><Link href="/">Retour à l&apos;accueil</Link></Button>
        </div>
      )}

      {state.phase === "too_late" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <XCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Annulation impossible</p>
              <p className="text-sm text-muted-foreground">
                Il reste moins d&apos;1 heure avant le rendez-vous. L&apos;annulation n&apos;est plus possible et l&apos;acompte est conservé conformément aux conditions générales de vente.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="w-full"><Link href="/">Retour à l&apos;accueil</Link></Button>
        </div>
      )}

      {state.phase === "success" && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 space-y-4 text-center">
          <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto" />
          <p className="font-semibold text-foreground text-lg">Rendez-vous annulé</p>
          <p className="text-sm text-muted-foreground">{state.message}</p>
          {state.refunded && (
            <p className="text-xs text-muted-foreground">
              Un email de confirmation a été envoyé si une adresse email était renseignée lors de la réservation.
            </p>
          )}
          <Button asChild variant="outline"><Link href="/">Retour à l&apos;accueil</Link></Button>
        </div>
      )}

      {state.phase === "error" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center space-y-3">
          <XCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-foreground font-semibold">Erreur</p>
          <p className="text-sm text-muted-foreground">{state.message}</p>
          <Button asChild variant="outline"><Link href="/">Retour à l&apos;accueil</Link></Button>
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
        <Suspense fallback={<p className="text-muted-foreground">Chargement…</p>}>
          <AnnulerContent />
        </Suspense>
      </main>
    </div>
  )
}
