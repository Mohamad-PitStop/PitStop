"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function InscriptionPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Impossible de créer le compte.")
      setSuccess(true)
      setTimeout(() => {
        router.push("/")
        router.refresh()
      }, 2000)
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
          <Card className="border-border/60 bg-card">
            <CardHeader>
              <CardTitle>Créer un compte</CardTitle>
              <CardDescription>
                Créez votre compte PitStop pour retrouver vos diagnostics et accéder aux prochaines fonctionnalités.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success && (
                <div className="flex flex-col items-center justify-center gap-4 py-6 animate-in fade-in duration-500">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/15">
                    <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path className="animate-[dash_0.5s_ease-in-out_forwards]" d="M5 13l4 4L19 7" strokeDasharray="24" strokeDashoffset="24" style={{ animation: "dash 0.4s ease-out 0.1s forwards" }} />
                    </svg>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-semibold text-foreground">Compte créé avec succès !</p>
                    <p className="text-sm text-muted-foreground">Redirection vers l&apos;accueil en cours…</p>
                  </div>
                  <div className="w-40 h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full animate-[progress_2s_linear_forwards]" />
                  </div>
                </div>
              )}
              {!success && (<><form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">
                    Nom complet
                  </label>
                  <Input
                    id="name"
                    placeholder="Ex : Marc Dupont"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    E-mail
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.be"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Mot de passe
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="8 caractères minimum"
                    minLength={8}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Création en cours..." : "Créer mon compte"}
                </Button>
              </form>

              <p className="mt-4 text-xs text-muted-foreground">
                En créant un compte, vous acceptez nos{" "}
                <Link href="/mentions-legales" className="text-primary hover:underline">
                  mentions légales
                </Link>{" "}
                et notre{" "}
                <Link href="/confidentialite" className="text-primary hover:underline">
                  politique de confidentialité
                </Link>
                .
              </p>
              </>)}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
