"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Car, Calendar, Gauge, Search } from "lucide-react"

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
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("fr-BE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function truncate(text: string, max = 120) {
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text
}

export default function MesDiagnosticsPage() {
  const router = useRouter()
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/mes-diagnostics")
      .then(async (r) => {
        if (r.status === 401) {
          router.replace("/connexion")
          return null
        }
        if (!r.ok) throw new Error("Erreur serveur")
        return r.json()
      })
      .then((data) => {
        if (data) setDiagnostics(data.diagnostics ?? [])
      })
      .catch(() => setError("Impossible de charger vos diagnostics."))
      .finally(() => setLoading(false))
  }, [router])

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link href="/" aria-label="Retour à l'accueil">
          <Button variant="outline">Retour à l'accueil</Button>
        </Link>
      </div>

      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mes diagnostics</h1>
          <p className="text-sm text-muted-foreground mt-1">Historique de vos analyses véhicule</p>
        </div>
        <Link href="/diagnostic">
          <Button size="sm" className="gap-2">
            <Search className="h-4 w-4" />
            Nouveau diagnostic
          </Button>
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}

      {error && (
        <p className="text-destructive text-sm text-center py-10">{error}</p>
      )}

      {!loading && !error && diagnostics.length === 0 && (
        <div className="text-center py-16 space-y-4">
          <Car className="h-12 w-12 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground">Vous n&apos;avez pas encore de diagnostic enregistré.</p>
          <Link href="/diagnostic">
            <Button variant="outline" className="mt-2">Lancer mon premier diagnostic</Button>
          </Link>
        </div>
      )}

      {!loading && !error && diagnostics.length > 0 && (
        <div className="space-y-4">
          {diagnostics.map((d) => (
            <Card key={d.id} className="border-border/50 bg-card hover:border-border transition-colors">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">
                        {d.marque} {d.modele}
                        {d.variante ? ` — ${d.variante}` : ""}
                      </span>
                      {d.carburant && (
                        <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                          {d.carburant}
                        </span>
                      )}
                      {d.transmission && (
                        <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                          {d.transmission}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {d.annee}
                      </span>
                      <span className="flex items-center gap-1">
                        <Gauge className="h-3.5 w-3.5" />
                        {Number(d.kilometrage).toLocaleString("fr-BE")} km
                      </span>
                    </div>

                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {truncate(d.probleme)}
                    </p>
                  </div>

                  <time className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                    {formatDate(d.createdAt)}
                  </time>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
