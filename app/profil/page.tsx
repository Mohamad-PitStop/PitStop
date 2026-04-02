"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StripePaymentForm } from "@/components/stripe-payment-form"
import { CREDIT_PACKAGES } from "@/lib/credit-packages"
import {
  Car,
  Calendar,
  Gauge,
  Search,
  RotateCcw,
  Zap,
  Check,
  ArrowLeft,
  Trash2,
} from "lucide-react"

type AuthUser = {
  id: string
  name: string
  email: string
  role: string
  diagnosticCredits: number
}

type DiagnosticStatus = "in_progress" | "completed" | "abandoned"

type Diagnostic = {
  id: string
  createdAt: string
  marque: string
  modele: string
  variante: string | null
  carburant: string | null
  transmission: string | null
  annee: string
  kilometrage: string
  probleme: string
  status: DiagnosticStatus
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("fr-BE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function truncate(text: string, max = 120) {
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text
}

function StatusBadge({ status }: { status: DiagnosticStatus }) {
  if (status === "completed") return null
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/25">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
        En cours
      </span>
    )
  }
  if (status === "abandoned") {
    return (
      <span className="inline-flex items-center rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/40">
        Abandonné
      </span>
    )
  }
  return null
}

export default function ProfilPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([])
  const [loading, setLoading] = useState(true)
  const [resumingId, setResumingId] = useState<string | null>(null)
  const [resumeError, setResumeError] = useState<string | null>(null)
  const [paySuccess, setPaySuccess] = useState(false)
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [selectedPkg, setSelectedPkg] = useState<(typeof CREDIT_PACKAGES)[number] | null>(null)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const refreshUser = () => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data?.user) {
          router.replace("/connexion?redirect=/profil")
        } else {
          setUser({ ...data.user, diagnosticCredits: data.user.diagnosticCredits ?? 0 })
        }
      })
      .catch(() => router.replace("/connexion?redirect=/profil"))
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("redirect_status") === "succeeded" || params.get("success") === "1") {
      setPaySuccess(true)
      window.history.replaceState({}, "", "/profil")
    }

    // Load user + diagnostics in parallel
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()).catch(() => null),
      fetch("/api/mes-diagnostics").then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([userData, diagData]) => {
      if (!userData?.user) {
        router.replace("/connexion?redirect=/profil")
        return
      }
      setUser({ ...userData.user, diagnosticCredits: userData.user.diagnosticCredits ?? 0 })
      setDiagnostics(diagData?.diagnostics ?? [])
    }).finally(() => setLoading(false))
  }, [router])

  // Refresh balance after payment success
  useEffect(() => {
    if (!paySuccess) return
    const timer = setTimeout(refreshUser, 2000)
    return () => clearTimeout(timer)
  }, [paySuccess])

  const handleBuy = async (packageId: string) => {
    setLoadingPkg(packageId)
    try {
      const res = await fetch("/api/credits/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, intent: "credit_purchase" }),
      })
      const data = await res.json().catch(() => null)
      if (data?.ok && data?.clientSecret) {
        setSelectedPkg(CREDIT_PACKAGES.find((p) => p.id === packageId) ?? null)
        setClientSecret(data.clientSecret)
      }
    } finally {
      setLoadingPkg(null)
    }
  }

  const handleResume = async (d: Diagnostic) => {
    setResumingId(d.id)
    setResumeError(null)
    try {
      const response = await fetch(`/api/diagnostic/${d.id}`)
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? "Erreur")
      sessionStorage.setItem("diagnostic", JSON.stringify(data.diagnostic))
      sessionStorage.setItem("vehicleInfo", JSON.stringify(data.vehicleInfo))
      if (data.followUps) sessionStorage.setItem("followUps", data.followUps)
      else sessionStorage.removeItem("followUps")
      router.push("/resultat")
    } catch {
      setResumeError("Impossible de reprendre ce diagnostic. Veuillez réessayer.")
    } finally {
      setResumingId(null)
    }
  }

  const returnUrl =
    typeof window !== "undefined" ? `${window.location.origin}/profil` : ""

  const handleDeleteAccount = async () => {
    setDeleteError(null)
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer définitivement votre compte ? Cette action est irréversible. Les crédits restants ne sont pas remboursables."
    )
    if (!confirmed) return

    setDeletingAccount(true)
    try {
      const res = await fetch("/api/auth/delete-account", { method: "POST" })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "Suppression impossible pour le moment.")
      }
      router.push("/")
      router.refresh()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Suppression impossible pour le moment.")
      setDeletingAccount(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        {/* Retour */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Link>

        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <>
            {/* En-tête profil */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Mon profil</h1>
                {user && <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>}
              </div>
              <Link href="/diagnostic">
                <Button size="sm" className="gap-2">
                  <Search className="h-4 w-4" />
                  Nouveau diagnostic
                </Button>
              </Link>
            </div>

            {/* Bannière succès */}
            {paySuccess && (
              <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Paiement confirmé ! Vos crédits ont bien été ajoutés à votre compte.
                </p>
              </div>
            )}

            {/* Solde crédits */}
            {user && (
              <section className="space-y-4">
                <h2 className="text-base font-semibold">Crédits diagnostics</h2>
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-5 py-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Solde disponible</p>
                    <p className="text-lg font-semibold">{user.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-orange-500">{user.diagnosticCredits}</p>
                    <p className="text-xs text-muted-foreground">
                      crédit{user.diagnosticCredits !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Packages */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {CREDIT_PACKAGES.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`relative flex flex-col rounded-xl border p-3 ${
                        pkg.highlight
                          ? "border-orange-400 ring-1 ring-orange-400/30"
                          : "border-border/60"
                      }`}
                    >
                      {/* Badge espace réservé pour alignement */}
                      <div className="h-5 flex items-center justify-center mb-2">
                        {pkg.highlight && (
                          <span className="bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                            Meilleure offre
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mb-2">
                        <Zap className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                        <span className="text-xs font-medium">{pkg.label}</span>
                      </div>
                      <div className="mb-3">
                        {pkg.originalPrice && (
                          <p className="text-[10px] text-muted-foreground line-through">{pkg.originalPrice}</p>
                        )}
                        <p className="text-lg font-bold leading-tight">{pkg.priceLabel}</p>
                        {pkg.badge && (
                          <span className="inline-block mt-0.5 bg-green-500/10 text-green-700 dark:text-green-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            {pkg.badge}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className={`w-full text-xs h-7 mt-auto ${pkg.highlight ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
                        variant={pkg.highlight ? "default" : "outline"}
                        onClick={() => handleBuy(pkg.id)}
                        disabled={loadingPkg !== null}
                      >
                        {loadingPkg === pkg.id ? "…" : "Acheter"}
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Paiement sécurisé par Stripe. Les crédits sont crédités instantanément.
                </p>
                <p className="text-[11px] font-medium text-amber-300/90">
                  Important : les crédits achetés et non utilisés ne sont pas remboursables.
                </p>
              </section>
            )}

            {/* Historique diagnostics */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Historique des diagnostics</h2>
              </div>

              {resumeError && (
                <p className="text-destructive text-sm rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                  {resumeError}
                </p>
              )}

              {diagnostics.length === 0 ? (
                <div className="text-center py-12 space-y-4 rounded-xl border border-border/50">
                  <Car className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm text-muted-foreground">Aucun diagnostic enregistré.</p>
                  <Link href="/diagnostic">
                    <Button variant="outline" size="sm">Lancer mon premier diagnostic</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {diagnostics.map((d) => (
                    <Card
                      key={d.id}
                      className={`border-border/50 bg-card transition-colors ${
                        d.status === "abandoned" ? "opacity-60" : "hover:border-border"
                      }`}
                    >
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground">
                                {d.marque} {d.modele}
                                {d.variante ? ` — ${d.variante}` : ""}
                              </span>
                              {d.carburant && (
                                <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                                  {d.carburant}
                                </span>
                              )}
                              {d.transmission && (
                                <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                                  {d.transmission}
                                </span>
                              )}
                              <StatusBadge status={d.status} />
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {d.annee}
                              </span>
                              <span className="flex items-center gap-1">
                                <Gauge className="h-3.5 w-3.5" />
                                {Number(d.kilometrage).toLocaleString("fr-BE")} km
                              </span>
                            </div>
                            <p className="text-sm text-foreground/80 leading-relaxed">
                              {truncate(d.probleme)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <time className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(d.createdAt)}
                            </time>
                            {d.status === "in_progress" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 h-7 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                                onClick={() => handleResume(d)}
                                disabled={resumingId === d.id}
                              >
                                {resumingId === d.id ? (
                                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                ) : (
                                  <RotateCcw className="h-3 w-3" />
                                )}
                                {resumingId === d.id ? "Chargement…" : "Reprendre"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Suppression de compte */}
            <section className="pt-2">
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-foreground">Supprimer mon compte</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cette action est définitive : vos données de profil et votre historique seront supprimés.
                </p>
                <p className="mt-2 text-xs font-medium text-amber-300/90">
                  Les crédits restants ne peuvent pas être remboursés.
                </p>
                {deleteError && (
                  <p className="mt-2 text-xs text-destructive">{deleteError}</p>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  className="mt-4 w-full sm:w-auto"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deletingAccount ? "Suppression..." : "Supprimer mon compte"}
                </Button>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Modal paiement Stripe */}
      {clientSecret && selectedPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setClientSecret(null); setSelectedPkg(null) }}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#c8d8f0] p-6 shadow-2xl" style={{ backgroundColor: "#E8EEF8" }}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold" style={{ color: "#0D1B3E" }}>Achat de crédits</p>
                <p className="text-sm mt-0.5" style={{ color: "#1a2d5a" }}>
                  {selectedPkg.label} — {selectedPkg.priceLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setClientSecret(null); setSelectedPkg(null) }}
                className="rounded-full p-1.5 transition-colors hover:bg-[#c8d8f0]"
                style={{ color: "#1a2d5a" }}
                aria-label="Fermer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <StripePaymentForm
              clientSecret={clientSecret}
              returnUrl={returnUrl}
              buttonLabel={`Payer ${selectedPkg.priceLabel}`}
            />
            <p className="mt-3 text-xs font-medium" style={{ color: "#7a2e2e" }}>
              Les crédits achetés et non utilisés ne peuvent pas être remboursés.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
