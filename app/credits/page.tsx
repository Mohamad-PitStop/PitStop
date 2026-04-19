"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CREDIT_PACKAGES } from "@/lib/credit-packages"
import { creditPackageLabel, creditPackageSaving } from "@/lib/credit-package-i18n"
import { StripePaymentForm } from "@/components/stripe-payment-form"
import { hasAcceptedCgv, saveCgvConsent } from "@/lib/cgv-consent"
import { PromoInput, type PromoResult } from "@/components/promo-input"
import { CREDIT_PURCHASES_ENABLED } from "@/lib/feature-flags"
import { buildLoginUrl } from "@/lib/login-redirect"
import { Input } from "@/components/ui/input"
import { Zap, Check, ArrowLeft, Gift } from "lucide-react"
import { useTranslation } from "@/lib/i18n/locale-context"

type AuthUser = { id: string; name: string; email: string; role: string; diagnosticCredits: number }

export default function CreditsPage() {
  const { t } = useTranslation()
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
  const merciAutoAppliedRef = useRef(false)

  const [giftCode, setGiftCode] = useState("")
  const [giftRedeeming, setGiftRedeeming] = useState(false)
  const [giftError, setGiftError] = useState<string | null>(null)
  const [giftSuccess, setGiftSuccess] = useState<string | null>(null)

  const refreshUser = () => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          setUser({ ...data.user, diagnosticCredits: data.user.diagnosticCredits ?? 0 })
        }
      })
      .catch(() => null)
  }

  async function redeemGiftCode() {
    setGiftError(null)
    setGiftSuccess(null)
    const raw = giftCode.trim()
    if (raw.length < 4) {
      setGiftError(t("creditsPage.giftCodeShort"))
      return
    }
    setGiftRedeeming(true)
    try {
      const res = await fetch("/api/credits/redeem-gift-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: raw }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || t("creditsPage.giftErrorGeneric"))
      }
      setUser((u) =>
        u ? { ...u, diagnosticCredits: data.newBalance ?? u.diagnosticCredits } : null
      )
      setGiftSuccess(
        t("creditsPage.giftSuccess", { count: data.creditsAdded, balance: data.newBalance })
      )
      setGiftCode("")
    } catch (e) {
      setGiftError(e instanceof Error ? e.message : t("creditsPage.giftErrorUnknown"))
    } finally {
      setGiftRedeeming(false)
    }
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

  // Rafraîchir le solde après retour Stripe (webhook souvent quelques secondes après le redirect)
  useEffect(() => {
    if (!success) return
    const delaysMs = [0, 2500, 6000, 12000, 20000]
    const timers = delaysMs.map((ms) => setTimeout(() => refreshUser(), ms))
    return () => timers.forEach(clearTimeout)
  }, [success])

  /** Code promo page Merci (-30 % premier achat) : appliqué une fois si encore valide. */
  useEffect(() => {
    if (!CREDIT_PURCHASES_ENABLED || !user || promoApplied || merciAutoAppliedRef.current) return
    let cancelled = false
    fetch("/api/credits/merci-promo")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d?.ok || d.exhausted || !d.code) return
        merciAutoAppliedRef.current = true
        setPromoApplied({
          promoId: d.promoId,
          code: d.code,
          discountLabel: d.discountLabel,
          discountType: d.discountType,
          discountValue: d.discountValue,
        })
        setPromoCodeStr(d.code)
      })
      .catch(() => null)
    return () => {
      cancelled = true
    }
  }, [CREDIT_PURCHASES_ENABLED, user, promoApplied])

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
      router.push(buildLoginUrl("/credits"))
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
        alert(data?.error ?? t("creditsPage.paymentAlertError"))
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
            <p className="text-base font-semibold" style={{ color: "#0D1B3E" }}>{t("creditsPage.purchaseTitle")}</p>
            <p className="text-sm mt-0.5" style={{ color: "#1a2d5a" }}>
              {creditPackageLabel(t, selectedPkg.id)} : {modalPriceLabel()}
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-full p-1.5 transition-colors hover:bg-[#c8d8f0]"
            style={{ color: "#1a2d5a" }}
            aria-label={t("creditsPage.closeAria")}
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
            buttonLabel={t("creditsPage.payButton", {
              amount:
                finalAmount != null
                  ? `${(finalAmount / 100).toFixed(2).replace(".", ",")} €`
                  : selectedPkg.priceLabel,
            })}
          />
        ) : (
          <div className="rounded-lg border border-[#c8d8f0] bg-white/60 p-3 text-xs" style={{ color: "#1a2d5a" }}>
            {t("creditsPage.cgvRequired")}
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
              {t("creditsPage.cgvCheckbox")}{" "}
              <Link href="/conditions-generales-vente" className="text-primary underline" target="_blank">
                {t("creditsPage.cgvLink")}
              </Link>
              .
            </span>
          </label>
        )}
        <p className="mt-3 text-xs font-medium" style={{ color: "#7a2e2e" }}>
          {t("creditsPage.nonRefundableNote")}
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* En-tête */}
        <div className="space-y-2">
          <Link href="/diagnostic" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t("creditsPage.backToDiagnostic")}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{t("creditsPage.pageTitle")}</h1>
          <p className="text-muted-foreground">
            {t("creditsPage.intro")}
          </p>
        </div>

        {/* Bannière succès */}
        {success && (
          <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
            <Check className="h-5 w-5 text-green-500 shrink-0" />
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              {t("creditsPage.paymentSuccess")}
            </p>
          </div>
        )}

        {/* Solde actuel */}
        {user && (
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-5 py-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("creditsPage.balanceLabel")}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-orange-500">{user.diagnosticCredits}</p>
              <p className="text-xs text-muted-foreground">
                {user.diagnosticCredits !== 1 ? t("creditsPage.creditPlural") : t("creditsPage.creditSingular")}
              </p>
            </div>
          </div>
        )}

        {user && (
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Gift className="h-4 w-4 text-primary shrink-0" aria-hidden />
              {t("creditsPage.giftTitle")}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("creditsPage.giftHelp")}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <Input
                value={giftCode}
                onChange={(e) => {
                  setGiftCode(e.target.value)
                  setGiftError(null)
                  setGiftSuccess(null)
                }}
                placeholder={t("creditsPage.giftPlaceholder")}
                className="h-10 font-sans sm:flex-1"
                maxLength={40}
                autoComplete="off"
                spellCheck={false}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void redeemGiftCode()
                }}
              />
              <Button
                type="button"
                variant="secondary"
                className="h-10 shrink-0 sm:min-w-[120px]"
                onClick={() => void redeemGiftCode()}
                disabled={giftRedeeming}
              >
                {giftRedeeming ? "…" : t("creditsPage.giftActivate")}
              </Button>
            </div>
            {giftError && <p className="text-xs text-destructive">{giftError}</p>}
            {giftSuccess && <p className="text-xs text-green-600 dark:text-green-400">{giftSuccess}</p>}
          </div>
        )}

        {!user && (
          <div className="rounded-xl border border-border/60 bg-muted/30 px-5 py-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              {CREDIT_PURCHASES_ENABLED
                ? t("creditsPage.loginPromptPurchase")
                : t("creditsPage.loginPromptBalance")}
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => router.push(buildLoginUrl("/credits"))}>{t("creditsPage.signIn")}</Button>
              <Button variant="outline" onClick={() => router.push("/inscription")}>{t("creditsPage.createAccount")}</Button>
            </div>
          </div>
        )}

        {/* Code promo + offres : uniquement si la vente est activée (`lib/feature-flags.ts`) */}
        {CREDIT_PURCHASES_ENABLED ? (
          <>
            {user && (
              <div className="max-w-md">
                <PromoInput
                  applied={promoApplied}
                  dismissible={false}
                  showInputWhenApplied
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

            {user?.role === "user_friend" && (
              <div className="flex items-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/10 px-4 py-2.5 text-sm text-violet-400 font-medium">
                <span>🎁</span>
                <span>Tarif ami appliqué : −50 % sur tous les packs</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              {CREDIT_PACKAGES.map((pkg) => {
                const savingLine = creditPackageSaving(t, pkg.id)
                const isFriendUser = user?.role === "user_friend"
                const friendAmountCents = Math.round(pkg.amountCents * 0.5)
                const friendPriceLabel = `${(friendAmountCents / 100).toFixed(2).replace(".", ",")} €`
                return (
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
                        {t("creditsPage.bestCompromise")}
                      </span>
                    )}
                  </div>

                  <CardHeader className="pb-2 pt-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-orange-500 shrink-0" />
                      <CardTitle className="text-base font-semibold">
                        {creditPackageLabel(t, pkg.id)}
                      </CardTitle>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-col flex-1 gap-4">
                    <div>
                      {isFriendUser ? (
                        <>
                          <p className="text-xs text-muted-foreground line-through">{pkg.priceLabel}</p>
                          <p className="text-2xl font-bold text-violet-400">{friendPriceLabel}</p>
                          <span className="inline-block mt-1 bg-violet-500/10 text-violet-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            −50 % tarif ami
                          </span>
                        </>
                      ) : (
                        <>
                          {pkg.originalPrice && (
                            <p className="text-xs text-muted-foreground line-through">{pkg.originalPrice}</p>
                          )}
                          <p className="text-2xl font-bold">{pkg.priceLabel}</p>
                          {savingLine ? (
                            <p className="text-xs font-medium text-green-600 dark:text-green-400">
                              {savingLine}
                            </p>
                          ) : null}
                          {pkg.badge && (
                            <span className="inline-block mt-1 bg-green-500/10 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {pkg.badge}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground flex-1">
                      {t("creditsPage.perDiagnostic", {
                        price: isFriendUser
                          ? (friendAmountCents / pkg.credits / 100).toFixed(2).replace(".", ",")
                          : (pkg.amountCents / pkg.credits / 100).toFixed(2).replace(".", ","),
                      })}
                    </p>

                    <Button
                      className={`w-full ${pkg.highlight ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
                      variant={pkg.highlight ? "default" : "outline"}
                      onClick={() => handleBuy(pkg.id)}
                      disabled={loadingPkg !== null || !user}
                    >
                      {loadingPkg === pkg.id ? t("creditsPage.preparing") : t("creditsPage.buy")}
                    </Button>
                  </CardContent>
                </Card>
                )
              })}
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              {t("creditsPage.footerStripe")}
            </p>
            <p className="text-[11px] font-medium text-amber-300/90 text-center">
              {t("creditsPage.footerNonRefundable")}
            </p>
          </>
        ) : (
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-5 py-5 space-y-3">
            <p className="text-sm font-semibold text-foreground">{t("creditsPage.purchaseDisabledTitle")}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("creditsPage.purchaseDisabledBody")}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild variant="outline" size="sm">
                <Link href="/diagnostic">{t("creditsPage.backToDiagnostic")}</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/profil">{t("creditsPage.myProfile")}</Link>
              </Button>
            </div>
          </div>
        )}
      </main>

      {paymentModal}
    </div>
  )
}
