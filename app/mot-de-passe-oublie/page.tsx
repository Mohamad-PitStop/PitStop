"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Erreur serveur.")
      setSent(true)
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
              <CardTitle>Mot de passe oublié</CardTitle>
              <CardDescription>
                Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className="space-y-4">
                  <p className="text-sm text-green-500">
                    Si un compte existe avec cet email, un lien de réinitialisation vous a été envoyé. Vérifiez votre boîte mail (et vos spams).
                  </p>
                  <Link href="/connexion" className="text-sm text-primary hover:underline">
                    Retour à la connexion
                  </Link>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      E-mail
                    </label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Envoi en cours..." : "Envoyer le lien"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    <Link href="/connexion" className="text-primary hover:underline">
                      Retour à la connexion
                    </Link>
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
