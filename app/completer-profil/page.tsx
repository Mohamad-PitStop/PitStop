"use client"

import { FormEvent, Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useBelgianPostalCityPrefill } from "@/hooks/use-belgian-postal-city-prefill"
import { useTranslation } from "@/lib/i18n/locale-context"
import { SuspenseLoadingScreen } from "@/components/suspense-loading-screen"
import { dispatchAuthSessionChanged } from "@/lib/auth-client-events"

function safeInternalPath(p: string | null): string | null {
  if (!p || !p.startsWith("/") || p.startsWith("//")) return null
  if (p.startsWith("/completer-profil")) return null
  return p
}

function CompleteProfileForm() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const next = safeInternalPath(searchParams.get("next")) ?? "/"

  const [sessionReady, setSessionReady] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [postalCode, setPostalCode] = useState("")
  const [city, setCity] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { markCityEditedByUser, lookupLoading, showBelgiumOnlyLocation } = useBelgianPostalCityPrefill(
    postalCode,
    city,
    setCity
  )

  useEffect(() => {
    let cancelled = false
    // Retry jusqu'à 3 fois avec délai croissant : le cookie vient d'être posé par le
    // callback OAuth et peut nécessiter un instant avant d'être reconnu (cold start Vercel).
    const attempt = async (tries: number) => {
      try {
        const r = await fetch("/api/auth/me", { credentials: "include" })
        const data = await r.json()
        if (cancelled) return
        if (!data?.user) {
          if (tries > 1) {
            await new Promise((res) => setTimeout(res, 600))
            if (!cancelled) await attempt(tries - 1)
          } else {
            // Vraiment pas connecté après plusieurs essais → /connexion.
            // On renvoie directement vers la destination finale (`next`) plutôt que
            // d'imbriquer /completer-profil dans le callbackUrl, sinon le paramètre
            // `next` est perdu au re-parsing et on boucle sur la page de connexion.
            const fallbackUrl = new URL("/connexion", window.location.origin)
            fallbackUrl.searchParams.set("callbackUrl", next)
            window.location.replace(fallbackUrl.toString())
          }
          return
        }
        if (data.user.signupPostalCode) setPostalCode(String(data.user.signupPostalCode))
        setIsSignedIn(true)
        setSessionReady(true)
      } catch {
        if (!cancelled) setSessionReady(true)
      }
    }
    void attempt(3)
    return () => {
      cancelled = true
    }
  }, [])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (showBelgiumOnlyLocation) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ postalCode, city }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || t("complete.saveError"))
      dispatchAuthSessionChanged()
      window.location.assign(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.errorUnknown"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSkip = () => {
    window.location.assign(next)
  }

  if (!sessionReady || !isSignedIn) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="py-14">
          <div className="container mx-auto max-w-xl px-4 flex justify-center py-16">
            <span className="text-sm text-muted-foreground">{t("auth.sessionCheck")}</span>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-14">
        <div className="container mx-auto max-w-xl px-4">
          <Card className="border-border/60 bg-card">
            <CardHeader>
              <CardTitle>{t("complete.title")}</CardTitle>
              <CardDescription>{t("complete.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
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

                {error && <p className="text-sm text-red-400">{error}</p>}

                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? t("complete.saving") : t("complete.save")}
                  </Button>
                  <Button type="button" variant="outline" onClick={onSkip} disabled={isSubmitting}>
                    {t("complete.skip")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<SuspenseLoadingScreen />}>
      <CompleteProfileForm />
    </Suspense>
  )
}
