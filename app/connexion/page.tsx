"use client"

import { FormEvent, Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { dispatchAuthSessionChanged } from "@/lib/auth-client-events"
import { useTranslation } from "@/lib/i18n/locale-context"
import { SuspenseLoadingScreen } from "@/components/suspense-loading-screen"

function safeInternalPath(p: string | null): string | null {
  if (!p || !p.startsWith("/")) return null
  if (p.startsWith("//")) return null
  return p
}

/** Évite boucle /connexion → /connexion ou inscription → connexion. */
function sanitizePostLoginTarget(p: string | null): string | null {
  const s = safeInternalPath(p)
  if (!s) return null
  const base = s.split("?")[0]?.split("#")[0]
  if (base === "/connexion" || base === "/inscription") return null
  return s
}

function ConnexionForm() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const callbackUrl = safeInternalPath(searchParams.get("callbackUrl"))
  const redirectParam = safeInternalPath(searchParams.get("redirect"))
  /** `callbackUrl` (liens internes) ou `redirect` (anciens liens navbar / crédits / profil). */
  const returnTo = sanitizePostLoginTarget(callbackUrl ?? redirectParam)
  /** Tant qu’on n’a pas vérifié la session, on n’affiche pas le formulaire (évite flash + doubles soumissions). */
  const [sessionReady, setSessionReady] = useState(false)
  const fromDiagnosticFlow =
    searchParams.get("reason") === "diagnostic" ||
    returnTo === "/diagnostic" ||
    returnTo?.startsWith("/diagnostic") ||
    returnTo === "/resultat" ||
    returnTo?.startsWith("/resultat")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setSessionReady(false)
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data?.user) {
          // Déjà connecté : navigation complète pour que le proxy et le client voient le cookie.
          window.location.replace(returnTo ?? "/")
          return
        }
        setSessionReady(true)
      })
      .catch(() => {
        if (!cancelled) setSessionReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [searchParams, returnTo])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || t("auth.loginFail"))
      dispatchAuthSessionChanged()
      const dest = returnTo ?? "/"
      // Navigation document complète : le cookie HttpOnly est bien appliqué avant la prochaine requête
      // (évite de rester sur /connexion ou que le proxy ne voie pas encore la session sur /diagnostic).
      window.location.assign(dest)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.errorUnknown"))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!sessionReady) {
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
          <div className="mb-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                {t("common.backHome")}
              </Button>
            </Link>
          </div>
          {fromDiagnosticFlow ? (
            <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground leading-relaxed">
              {t("auth.diagnosticBanner")}
            </div>
          ) : null}
          <Card className="border-border/60 bg-card">
            <CardHeader>
              <CardTitle>{t("auth.connexionTitle")}</CardTitle>
              <CardDescription>{t("auth.connexionDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    {t("common.email")}
                  </label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-foreground">
                      {t("common.password")}
                    </label>
                    <Link href="/mot-de-passe-oublie" className="text-xs text-muted-foreground hover:text-primary hover:underline">
                      {t("auth.forgotPassword")}
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    minLength={8}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
                </Button>
              </form>

              <p className="mt-4 text-xs text-muted-foreground">
                {t("auth.noAccount")}{" "}
                <Link
                  href={
                    returnTo
                      ? `/inscription?callbackUrl=${encodeURIComponent(returnTo)}`
                      : "/inscription"
                  }
                  className="text-primary hover:underline"
                >
                  {t("auth.createAccount")}
                </Link>
              </p>
              <p className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                {t("auth.garagePartnerHint")}{" "}
                <Link href="/inscription-garage" className="text-primary hover:underline">
                  {t("auth.garagePartnerCta")}
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={<SuspenseLoadingScreen />}>
      <ConnexionForm />
    </Suspense>
  )
}
