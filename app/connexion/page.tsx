"use client"

import { FormEvent, Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { dispatchAuthSessionChanged } from "@/lib/auth-client-events"

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = safeInternalPath(searchParams.get("callbackUrl"))
  const redirectParam = safeInternalPath(searchParams.get("redirect"))
  /** `callbackUrl` (liens internes) ou `redirect` (anciens liens navbar / crédits / profil). */
  const returnTo = sanitizePostLoginTarget(callbackUrl ?? redirectParam)
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

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Impossible de se connecter.")
      dispatchAuthSessionChanged()
      const dest = returnTo ?? "/"
      // Ne pas appeler router.refresh() avant la navigation : sur la route /connexion,
      // ça peut empêcher router.push/replace d’aller vers l’accueil (Next.js App Router).
      router.replace(dest)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-14">
        <div className="container mx-auto max-w-xl px-4">
          <div className="mb-4">
            <Link href="/">
              <Button variant="outline" size="sm">Retour à l&apos;accueil</Button>
            </Link>
          </div>
          {fromDiagnosticFlow ? (
            <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground leading-relaxed">
              Connectez-vous pour lancer un diagnostic ou consulter une analyse déjà enregistrée. Pas encore de compte ? Utilisez le lien ci-dessous.
            </div>
          ) : null}
          <Card className="border-border/60 bg-card">
            <CardHeader>
              <CardTitle>Connexion</CardTitle>
              <CardDescription>
                Connectez-vous pour accéder au diagnostic, à votre historique et à votre solde de crédits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    E-mail
                  </label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-foreground">
                      Mot de passe
                    </label>
                    <Link href="/mot-de-passe-oublie" className="text-xs text-muted-foreground hover:text-primary hover:underline">
                      Mot de passe oublié ?
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
                  {isSubmitting ? "Connexion..." : "Se connecter"}
                </Button>
              </form>

              <p className="mt-4 text-xs text-muted-foreground">
                Pas encore de compte ?{" "}
                <Link
                  href={
                    returnTo
                      ? `/inscription?callbackUrl=${encodeURIComponent(returnTo)}`
                      : "/inscription"
                  }
                  className="text-primary hover:underline"
                >
                  Créer un compte
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Chargement…</span>
        </div>
      }
    >
      <ConnexionForm />
    </Suspense>
  )
}
