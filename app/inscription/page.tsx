"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function InscriptionPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null) // email en attente de vérification
  const [error, setError] = useState<string | null>(null)
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle")

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
      // Inscription réussie → afficher l'écran "vérifiez votre email"
      setPendingEmail(email.toLowerCase())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.")
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
          <Card className="border-border/60 bg-card">
            <CardHeader>
              <CardTitle>Créer un compte</CardTitle>
              <CardDescription>
                Créez votre compte PitStop pour retrouver vos diagnostics et accéder aux prochaines fonctionnalités.
              </CardDescription>
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
                    <p className="font-semibold text-foreground">Vérifiez votre boîte mail</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Un email de confirmation a été envoyé à{" "}
                      <span className="font-medium text-foreground">{pendingEmail}</span>.
                      Cliquez sur le lien dans cet email pour activer votre compte.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Le lien est valable 24 heures. Pensez à vérifier vos spams.
                    </p>
                  </div>

                  {/* Renvoi de l'email */}
                  <div className="w-full space-y-2 pt-2">
                    {resendState === "sent" ? (
                      <p className="text-sm text-center text-green-600 dark:text-green-400">
                        Email renvoyé ! Vérifiez votre boîte de réception.
                      </p>
                    ) : resendState === "error" ? (
                      <p className="text-sm text-center text-red-400">
                        Impossible d'envoyer l'email. Réessayez dans quelques instants.
                      </p>
                    ) : null}

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleResend}
                      disabled={resendState === "sending" || resendState === "sent"}
                    >
                      {resendState === "sending" ? "Envoi en cours…" : "Renvoyer l'email de confirmation"}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Mauvais email ?{" "}
                      <button
                        className="text-primary hover:underline"
                        onClick={() => { setPendingEmail(null); setResendState("idle") }}
                      >
                        Recommencer l'inscription
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

                    {error && <p className="text-sm text-red-400">{error}</p>}

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Envoi en cours…" : "Créer mon compte"}
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
                </>
              )}
            </CardContent>
          </Card>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/connexion" className="text-primary hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
