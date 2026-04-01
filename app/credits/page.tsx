"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CREDIT_PACKAGES } from "@/lib/credit-packages"
import { Zap, Check, ArrowLeft } from "lucide-react"

type AuthUser = { id: string; name: string; email: string; role: string; diagnosticCredits: number }

export default function CreditsPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("success") === "1") {
      setSuccess(true)
      window.history.replaceState({}, "", "/credits")
    }

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          setUser({ ...data.user, diagnosticCredits: data.user.diagnosticCredits ?? 0 })
        }
      })
      .catch(() => null)
  }, [])

  const handleBuy = async (packageId: string) => {
    if (!user) {
      router.push("/connexion?redirect=/credits")
      return
    }
    setLoadingPkg(packageId)
    try {
      const res = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          intent: "credit_purchase",
          returnPath: "/credits",
        }),
      })
      const data = await res.json().catch(() => null)
      if (data?.ok && data?.url) {
        window.location.href = data.url
      } else {
        setLoadingPkg(null)
      }
    } catch {
      setLoadingPkg(null)
    }
  }

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
            <p className="text-sm text-muted-foreground">Connectez-vous pour acheter des crédits et retrouver votre solde.</p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => router.push("/connexion?redirect=/credits")}>Se connecter</Button>
              <Button variant="outline" onClick={() => router.push("/inscription")}>Créer un compte</Button>
            </div>
          </div>
        )}

        {/* Grille des offres */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative flex flex-col ${
                pkg.highlight
                  ? "border-orange-400 ring-2 ring-orange-400/30 shadow-md"
                  : "border-border/60"
              }`}
            >
              {pkg.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Meilleure offre
                  </span>
                </div>
              )}

              <CardHeader className="pb-2 pt-6">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-500 shrink-0" />
                  <CardTitle className="text-base font-semibold">{pkg.label}</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col flex-1 gap-4">
                {/* Prix */}
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

                {/* Détail */}
                <p className="text-xs text-muted-foreground flex-1">
                  {(pkg.amountCents / pkg.credits / 100).toFixed(2).replace(".", ",")} € / diagnostic
                </p>

                {/* Bouton */}
                <Button
                  className={`w-full ${pkg.highlight ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
                  variant={pkg.highlight ? "default" : "outline"}
                  onClick={() => handleBuy(pkg.id)}
                  disabled={loadingPkg !== null || !user}
                >
                  {loadingPkg === pkg.id ? "Redirection…" : "Acheter"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground text-center">
          Paiement sécurisé par Stripe. Les crédits sont crédités instantanément après paiement.
          Pas d&apos;abonnement — achetez uniquement ce dont vous avez besoin.
        </p>
      </main>
    </div>
  )
}
