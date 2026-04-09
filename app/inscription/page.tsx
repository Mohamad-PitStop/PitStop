"use client"

import { FormEvent, useState, Suspense } from "react"
import { Loader2 } from "lucide-react"
import { useBelgianPostalCityPrefill } from "@/hooks/use-belgian-postal-city-prefill"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { buildLoginUrl } from "@/lib/login-redirect"
import { useTranslation } from "@/lib/i18n/locale-context"
import { SuspenseLoadingScreen } from "@/components/suspense-loading-screen"

function InscriptionForm() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl")
  const fromDiagnostic =
    searchParams.get("reason") === "diagnostic" || callbackUrl === "/diagnostic" || callbackUrl?.startsWith("/diagnostic")

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [city, setCity] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null) // email en attente de vérification
  const [error, setError] = useState<string | null>(null)
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle")

  const { markCityEditedByUser, lookupLoading, showBelgiumOnlyLocation } = useBelgianPostalCityPrefill(
    postalCode,
    city,
    setCity
  )

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (showBelgiumOnlyLocation) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, postalCode, city }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || t("auth.signupFail"))
      // Inscription réussie → afficher l'écran "vérifiez votre email"
      setPendingEmail(email.toLowerCase())
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.errorUnknown"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!pendingEmail || resendState === "sending") return
    setResendState("sending")
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail }),
      })
      setResendState(res.ok ? "sent" : "error")
    } catch {
      setResendState("error")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-14">
        <div className="container mx-auto max-w-xl px-4">
          {fromDiagnostic ? (
            <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground leading-relaxed">
              {t("auth.diagnosticNeedAccount")}
            </div>
          ) : null}
          <Card className="border-border/60 bg-card">
            <CardHeader>
              <CardTitle>{t("auth.signupTitle")}</CardTitle>
              <CardDescription>{t("auth.signupDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* ── État : email de vérification envoyé ── */}
              {pendingEmail ? (
                <div className="flex flex-col items-center gap-5 py-4 animate-in fade-in duration-500">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/15">
                    {/* Icône enveloppe */}
                    <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>

                  <div className="text-center space-y-2">
                    <p className="font-semibold text-foreground">{t("auth.verifyEmailTitle")}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t("auth.verifyEmailBody", { email: pendingEmail ?? "" })}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("auth.verifyEmailHint")}</p>
                  </div>

                  {/* Renvoi de l'email */}
                  <div className="w-full space-y-2 pt-2">
                    {resendState === "sent" ? (
                      <p className="text-sm text-center text-green-600 dark:text-green-400">
                        {t("auth.resendSent")}
                      </p>
                    ) : resendState === "error" ? (
                      <p className="text-sm text-center text-red-400">{t("auth.resendFail")}</p>
                    ) : null}

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleResend}
                      disabled={resendState === "sending" || resendState === "sent"}
                    >
                      {resendState === "sending" ? t("auth.resending") : t("auth.resendButton")}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      {t("auth.wrongEmail")}{" "}
                      <button
                        className="text-primary hover:underline"
                        onClick={() => { setPendingEmail(null); setResendState("idle") }}
                      >
                        {t("auth.restartSignup")}
                      </button>
                    </p>
                  </div>
                </div>
              ) : (
                /* ── Formulaire d'inscription ── */
                <>
                  <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium text-foreground">
                        {t("auth.fullName")}
                      </label>
                      <Input
                        id="name"
                        placeholder={t("auth.namePlaceholder")}
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-foreground">
                        {t("common.email")}
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("auth.emailPlaceholder")}
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                      <label
                        htmlFor="postalCode"
                        className="col-start-1 row-start-1 text-sm font-medium leading-snug text-foreground"
                      >
                        {t("auth.postalCode")}
                      </label>
                      <div className="col-start-1 row-start-3 flex items-center gap-2 sm:col-start-2 sm:row-start-1">
                        <label htmlFor="city" className="text-sm font-medium leading-snug text-foreground">
                          {t("auth.city")}
                        </label>
                        {lookupLoading ? (
                          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                        ) : null}
                      </div>
                      <Input
                        id="postalCode"
                        className="col-start-1 row-start-2 sm:row-start-2"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        placeholder="ex. 6000"
                        required
                        maxLength={4}
                        pattern="[0-9]{4}"
                        title={t("auth.postalTitle")}
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      />
                      <Input
                        id="city"
                        className="col-start-1 row-start-4 sm:col-start-2 sm:row-start-2"
                        autoComplete="address-level2"
                        placeholder={t("auth.cityPlaceholder")}
                        required
                        minLength={2}
                        maxLength={80}
                        value={city}
                        onChange={(e) => {
                          markCityEditedByUser()
                          setCity(e.target.value)
                        }}
                      />
                    </div>
                    {showBelgiumOnlyLocation ? (
                      <p
                        className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground leading-relaxed"
                        role="alert"
                      >
                        {t("auth.belgiumOnlyLocation")}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground leading-relaxed -mt-1">
                      {t("auth.signupStatsNote")}{" "}
                      <Link href="/confidentialite" className="text-primary hover:underline">
                        {t("auth.privacyLink")}
                      </Link>
                      {t("auth.signupStatsNoteEnd")}
                    </p>
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium text-foreground">
                        {t("common.password")}
                      </label>
                      <Input
                        id="password"
                        type="password"
                        placeholder={t("auth.passwordPlaceholder")}
                        minLength={8}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>

                    {error && <p className="text-sm text-red-400">{error}</p>}

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? t("auth.creating") : t("auth.createMyAccount")}
                    </Button>
                  </form>

                  <p className="mt-4 text-xs text-muted-foreground">
                    {t("auth.acceptTerms")}{" "}
                    <Link href="/mentions-legales" className="text-primary hover:underline">
                      {t("auth.legalLink")}
                    </Link>{" "}
                    {t("auth.andOur")}{" "}
                    <Link href="/confidentialite" className="text-primary hover:underline">
                      {t("auth.privacyLink")}
                    </Link>
                    .
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("auth.alreadyAccount")}{" "}
            <Link
              href={callbackUrl ? buildLoginUrl(callbackUrl) : "/connexion"}
              className="text-primary hover:underline font-medium"
            >
              {t("auth.signIn")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default function InscriptionPage() {
  return (
    <Suspense fallback={<SuspenseLoadingScreen />}>
      <InscriptionForm />
    </Suspense>
  )
}
