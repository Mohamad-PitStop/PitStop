"use client"

import { FormEvent, useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <p className="text-sm text-red-400">
        Lien invalide. <Link href="/mot-de-passe-oublie" className="text-primary hover:underline">Faire une nouvelle demande</Link>.
      </p>
    )
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Erreur serveur.")
      setSuccess(true)
      setTimeout(() => router.push("/connexion"), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <p className="text-sm text-green-500">
        Mot de passe modifié avec succès. Redirection vers la connexion…
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Nouveau mot de passe
        </label>
        <Input
          id="password"
          type="password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="confirm" className="text-sm font-medium text-foreground">
          Confirmer le mot de passe
        </label>
        <Input
          id="confirm"
          type="password"
          minLength={8}
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Enregistrement..." : "Changer le mot de passe"}
      </Button>
    </form>
  )
}

export default function ReinitialisationPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="py-14">
        <div className="container mx-auto max-w-xl px-4">
          <Card className="border-border/60 bg-card">
            <CardHeader>
              <CardTitle>Nouveau mot de passe</CardTitle>
              <CardDescription>Choisissez un nouveau mot de passe pour votre compte.</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
                <ResetForm />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
