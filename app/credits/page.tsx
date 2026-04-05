"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CREDIT_PACKAGES } from "@/lib/credit-packages"
import { StripePaymentForm } from "@/components/stripe-payment-form"
import { hasAcceptedCgv, saveCgvConsent } from "@/lib/cgv-consent"
import { PromoInput, type PromoResult } from "@/components/promo-input"
import { CREDIT_PURCHASES_ENABLED } from "@/lib/feature-flags"
import { Zap, Check, ArrowLeft } from "lucide-react"

type AuthUser = { id: string; name: string; email: string; role: string; diagnosticCredits: number }

export default function CreditsPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [selectedPkg, setSelectedPkg] = useState<(typeof CREDIT_PACKAGES)[number] | null>(null)
  const [cgvAccepted, setCgvAccepted] = useState(true)
  const [cgvChecked, setCgvChecked] = useState(false)

  // Promo code state
  const [promoApplied, setPromoApplied] = useState<PromoResult | null>(null)
  const [promoCodeStr, setPromoCodeStr] = useState<string | null>(null)
  const [finalAmount, setFinalAmount] = useState<number | null>(null)
  const [discountLabel, setDiscountLabel] = useState<string | null>(null)

  const refreshUser = () => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          setUser({ ...data.user, diagnosticCredits: data.user.diagnosticCredits ?? 0 })
        }
      })
      .catch(() => null)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    // Nouveau flux (PaymentIntent redirect) ou ancien flux (success=1)
    if (params.get("redirect_status") === "succeeded" || params.get("success") === "1") {
      setSuccess(true)
      window.history.replaceState({}, "", "/credits")
    }

    refreshUser()
    setCgvAccepted(hasAcceptedCgv())
  }, [])

  useEffect(() => {
    const syncCgv = () => setCgvAccepted(hasAcceptedCgv())
    window.addEventListener("storage", syncCgv)
    window.addEventListener("pitstop-cgv-consent-changed", syncCgv)
    return () => {
      window.removeEventListener("storage", syncCgv)
      window.removeEventListener("pitstop-cgv-consent-changed", syncCgv)
    }
  }, [])

  // Rafraîchir le solde après affichage du succès
  useEffect(() => {
    if (!success) return
    // Petit délai pour laisser le webhook traiter le paiement
    const timer = setTimeout(refreshUser, 2000)
    return () => clearTimeout(timer)
  }, [success])

  function closeModal() {
    setClientSecret(null)
    setLoadingPkg(null)
    setSelectedPkg(null)
    setFinalAmount(null)
    setDiscountLabel(null)
  }

  const handleBuy = async (packageId: string) => {
    if (!CREDIT_PURCHASES_ENABLED) return
    if (!user) {
      router.push("/connexion?redirect=/credits")
      return
    }
    setLoadingPkg(packageId)
    try {
      const res = await fetch("/api/credits/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          intent: "credit_purchase",
          promoCode: promoCodeStr ?? undefined,
        }),
      })
      const data = await res.json().catch(() => null)
      if (data?.ok && data?.clientSecret) {
        setSelectedPkg(CREDIT_PACKAGES.find((p) => p.id === packageId) ?? null)
        setClientSecret(data.clientSecret)
        setCgvChecked(cgvAccepted)
        if (data.finalAmount) setFinalAmount(data.finalAmount)
        if (data.appliedDiscountLabel) setDiscountLabel(data.appliedDiscountLabel)
      } else {
        alert(data?.error ?? "Erreur lors du paiement.")
        setLoadingPkg(null)
      }
    } catch {
      setLoadingPkg(null)
    }
  }

  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/credits`
      : ""

  // Build modal price label
  function modalPriceLabel() {
    if (!selectedPkg) return ""
    if (finalAmount != null && discountLabel) {
      const discounted = `${(finalAmount / 100).toFixed(2).replace(".", ",")} €`
      return (
        <>
          <span className="line-through text-muted-foreground mr-1">{selectedPkg.priceLabel}</span>
          <span className="text-green-600 dark:text-green-400 font-semibold">{discounted}</span>
          <span className="ml-1 text-xs text-green-600 dark:text-green-400">({discountLabel})</span>
        </>
      )
    }
    return selectedPkg.priceLabel
  }

  const paymentModal = CREDIT_PURCHASES_ENABLED && clientSecret && selectedPkg && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeModal}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#c8d8f0] p-6 shadow-2xl" style={{ backgroundColor: "#E8EEF8" }}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-base font-semibold" style={{ color: "#0D1B3E" }}>Achat de crédits</p>
            <p className="text-sm mt-0.5" style={{ color: "#1a2d5a" }}>
              {selectedPkg.label} : {modalPriceLabel()}
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-full p-1.5 transition-colors hover:bg-[#c8d8f0]"
            style={{ color: "#1a2d5a" }}
            aria-label="Fermer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
        {cgvAccepted ? (
          <StripePaymentForm
            clientSecret={clientSecret}
            returnUrl={returnUrl}
            buttonLabel={`Payer ${finalAmount != null ? `${(finalAmount / 100).toFixed(2).replace(".", ",")} €` : selectedPkg.priceLabel}`}
          />
        ) : (
          <div className="rounded-lg border border-[#c8d8f0] bg-white/60 p-3 text-xs" style={{ color: "#1a2d5a" }}>
            Veuillez accepter les CGV pour continuer le paiement.
          </div>
        )}
        {!cgvAccepted && (
          <label className="mt-3 flex items-start gap-2 text-xs leading-relaxed" style={{ color: "#1a2d5a" }}>
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-green-600"
              checked={cgvChecked}
              onChange={(e) => {
                const checked = e.target.checked
                setCgvChecked(checked)
                if (checked) {
                  saveCgvConsent("accepted")
                  setCgvAccepted(true)
                }
              }}
            />
            <span>
              En cochant cette case, vous acceptez nos{" "}
              <Link href="/conditions-generales-vente" className="text-primary underline" target="_blank">
                conditions générales de vente
              </Link>
              .
            </span>
          </label>
        )}
        <p className="mt-3 text-xs font-medium" style={{ color: "#7a2e2e" }}>
          Les crédits achetés et non utilisés ne peuvent pas être remboursés.
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* En-tête */}
        <div className="space-y-2">
          <Link href="/diagnostic" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Retour au diagnostic
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Crédits PitStop</h1>
          <p className="text-muted-foreground">
            1 crédit = 1 diagnostic automobile complet par IA. Les questions de suivi sont incluses.
          </p>
        </div>

        {/* Bannière succès */}
        {success && (
          <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
            <Check className="h-5 w-5 text-green-500 shrink-0" />
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Paiement confirmé ! Vos crédits ont bien été ajoutés à votre compte.
            </p>
          </div>
        )}

        {/* Solde actuel */}
        {user && (
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-5 py-4">
            <div>
              <p className="text-sm text-muted-foreground">Solde actuel</p>
              <p className="text-lg font-semibold">{user.name}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-orange-500">{user.diagnosticCredits}</p>
              <p className="text-xs text-muted-foreground">crédit{user.diagnosticCredits !== 1 ? "s" : ""}</p>
            </div>
          </div>
        )}

        {!user && (
          <div className="rounded-xl border border-border/60 bg-muted/30 px-5 py-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              {CREDIT_PURCHASES_ENABLED
                ? "Connectez-vous pour acheter des crédits et retrouver votre solde."
                : "Connectez-vous pour consulter votre solde de crédits."}
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => router.push("/connexion?redirect=/credits")}>Se connecter</Button>
              <Button variant="outline" onClick={() => router.push("/inscription")}>Créer un compte</Button>
            </div>
          </div>
        )}

        {/* Code promo + offres : uniquement si la vente est activée (`lib/feature-flags.ts`) */}
        {CREDIT_PURCHASES_ENABLED ? (
          <>
            {user && (
              <div className="max-w-xs">
                <PromoInput
                  applied={promoApplied}
                  onApply={(result) => {
                    setPromoApplied(result)
                    setPromoCodeStr(result.code)
                  }}
                  onClear={() => {
                    setPromoApplied(null)
                    setPromoCodeStr(null)
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              {CREDIT_PACKAGES.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`flex flex-col ${
                    pkg.highlight
                      ? "border-orange-400 ring-2 ring-orange-400/30 shadow-md"
                      : "border-border/60"
                  }`}
                >
                  <div className="flex h-6 items-center justify-center">
                    {pkg.highlight && (
                      <span className="-mt-3 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        Meilleure offre
                      </span>
                    )}
                  </div>

                  <CardHeader className="pb-2 pt-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-orange-500 shrink-0" />
                      <CardTitle className="text-base font-semibold">{pkg.label}</CardTitle>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-col flex-1 gap-4">
                    <div>
                      {pkg.originalPrice && (
                        <p className="text-xs text-muted-foreground line-through">{pkg.originalPrice}</p>
                      )}
                      <p className="text-2xl font-bold">{pkg.priceLabel}</p>
                      {pkg.saving && (
                        <p className="text-xs font-medium text-green-600 dark:text-green-400">{pkg.saving}</p>
                      )}
                      {pkg.badge && (
                        <span className="inline-block mt-1 bg-green-500/10 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {pkg.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground flex-1">
                      {(pkg.amountCents / pkg.credits / 100).toFixed(2).replace(".", ",")} € / diagnostic
                    </p>

                    <Button
                      className={`w-full ${pkg.highlight ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
                      variant={pkg.highlight ? "default" : "outline"}
                      onClick={() => handleBuy(pkg.id)}
                      disabled={loadingPkg !== null || !user}
                    >
                      {loadingPkg === pkg.id ? "Préparation…" : "Acheter"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              Paiement sécurisé par Stripe. Les crédits sont crédités instantanément après paiement.
              Pas d&apos;abonnement : achetez uniquement ce dont vous avez besoin.
            </p>
            <p className="text-[11px] font-medium text-amber-300/90 text-center">
              Important : les crédits achetés et non utilisés ne sont pas remboursables.
            </p>
          </>
        ) : (
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-5 py-5 space-y-3">
            <p className="text-sm font-semibold text-foreground">Achat de crédits temporairement indisponible</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tant que la structure juridique de PitStop n&apos;est pas constituée, aucune vente de crédits ne peut être proposée en ligne, conformément aux conditions affichées sur le site. Vous pouvez continuer à utiliser les crédits déjà présents sur votre compte.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild variant="outline" size="sm">
                <Link href="/diagnostic">Retour au diagnostic</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/profil">Mon profil</Link>
              </Button>
            </div>
          </div>
        )}
      </main>

      {paymentModal}
    </div>
  )
}
