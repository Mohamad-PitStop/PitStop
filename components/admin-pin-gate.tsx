"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

const LIMIT = 100

type Diagnostic = {
  id: string
  createdAt: string
  marque: string
  modele: string
  variante: string | null
  carburant: string | null
  transmission: string | null
  annee: string
  kilometrage: string
  probleme: string
  followUps: string | null
  promptText: string
}

export function AdminPinGate({ onAuthenticated }: { onAuthenticated?: () => void } = {}) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [diagnostics, setDiagnostics] = useState<Diagnostic[] | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (pin.length < 6 || !/^\d+$/.test(pin)) {
      setError("Entrez le code admin (6 chiffres minimum).")
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/diagnostics?limit=${LIMIT}`, {
        cache: "no-store",
        headers: { "X-Admin-Pin": pin },
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || "Code incorrect.")
        setIsSubmitting(false)
        return
      }
      if (onAuthenticated) {
        onAuthenticated()
      } else if (data?.ok && Array.isArray(data.diagnostics)) {
        setDiagnostics(data.diagnostics)
      } else {
        setDiagnostics([])
      }
    } catch {
      setError("Erreur de connexion.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (diagnostics !== null && !onAuthenticated) {
    return (
      <Card className="border-primary/30 bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Prompts diagnostic (clients)</CardTitle>
          <CardDescription>
            Dernières demandes de diagnostic : véhicule, problème saisi et prompt envoyé à l’IA. Max {LIMIT} entrées. Rechargez la page pour devoir ressaisir le code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {diagnostics.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune demande enregistrée pour l’instant.</p>
          ) : (
            <ul className="space-y-4">
              {diagnostics.map((d) => (
                <li key={d.id} className="rounded-lg border border-border/50 bg-secondary/20 p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {new Date(d.createdAt).toLocaleString("fr-BE", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {d.marque} {d.modele}
                    {d.variante ? ` – ${d.variante}` : ""}
                    {d.annee ? ` (${d.annee})` : ""}
                    {d.kilometrage ? ` – ${d.kilometrage} km` : ""}
                  </p>
                  <p className="text-sm text-foreground">
                    <span className="text-muted-foreground">Problème : </span>
                    &quot;{d.probleme}&quot;
                  </p>
                  {d.followUps ? (
                    <p className="text-xs text-muted-foreground">
                      Compléments Q/R : {d.followUps}
                    </p>
                  ) : null}
                  <details className="mt-2">
                    <summary className="text-sm cursor-pointer text-primary hover:underline">
                      Voir le prompt complet envoyé à l’IA
                    </summary>
                    <pre className="mt-2 p-3 rounded bg-muted/50 text-xs overflow-x-auto whitespace-pre-wrap break-words">
                      {d.promptText}
                    </pre>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/30 bg-card max-w-md">
      <CardHeader>
        <CardTitle className="text-foreground">Accès admin</CardTitle>
        <CardDescription>
          Entrez le code admin. Le code est demandé à chaque visite (aucun cookie).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="admin-pin" className="text-sm font-medium text-foreground sr-only">
              Code admin
            </label>
            <Input
              id="admin-pin"
              type="password"
              inputMode="numeric"
              maxLength={32}
              placeholder="••••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="text-center text-lg tracking-[0.5em]"
              autoComplete="one-time-code"
              disabled={isSubmitting}
            />
          </div>
          {error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Vérification…" : "Accéder"}
          </Button>
        </form>
        <p className="mt-4 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Retour à l&apos;accueil
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
