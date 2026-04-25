"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Calendar,
  Gauge,
  Eye,
  Coins,
  ShieldAlert,
} from "lucide-react"
import { formatBrusselsDateTime } from "@/lib/format-brussels-date"

type UserRole = "admin" | "tester" | "user_friend" | "user" | "garagiste"

type DiagnosticStatus = "in_progress" | "completed" | "abandoned"

type AdminUser = {
  id: string
  name: string
  email: string
  role: UserRole
  diagnosticCredits: number
  createdAt: string | null
}

type AdminDiagnostic = {
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
  status: DiagnosticStatus
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  tester: "Testeur officiel",
  user_friend: "Ami (−50%)",
  user: "Utilisateur",
  garagiste: "Garagiste",
}

const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  admin: "border-amber-500/50 text-amber-400",
  tester: "border-primary/50 text-primary",
  user_friend: "border-violet-500/50 text-violet-400",
  user: "border-border text-muted-foreground",
  garagiste: "border-blue-500/50 text-blue-400",
}

function truncate(text: string, max = 140) {
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text
}

/**
 * Toutes les dates affichées ici proviennent du serveur (UTC) et doivent être
 * rendues à l'heure de Bruxelles. Le helper gère le décalage UTC→Europe/Brussels.
 */
const formatDateTime = formatBrusselsDateTime

function StatusBadge({ status }: { status: DiagnosticStatus }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[11px] font-medium text-green-400 border border-green-500/25">
        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
        Terminé
      </span>
    )
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/25">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
        En cours
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/40">
      Abandonné
    </span>
  )
}

export default function AdminUserDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const userId = params?.id ?? ""

  const [user, setUser] = useState<AdminUser | null>(null)
  const [diagnostics, setDiagnostics] = useState<AdminDiagnostic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [openError, setOpenError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    fetch(`/api/admin/users/${encodeURIComponent(userId)}`)
      .then(async (r) => {
        if (r.status === 403) {
          router.replace("/")
          return null
        }
        if (r.status === 404) {
          setError("Compte introuvable.")
          return null
        }
        if (!r.ok) throw new Error("Erreur serveur.")
        return r.json()
      })
      .then((data) => {
        if (!data) return
        setUser(data.user ?? null)
        setDiagnostics(Array.isArray(data.diagnostics) ? data.diagnostics : [])
      })
      .catch(() => setError("Erreur lors du chargement."))
      .finally(() => setLoading(false))
  }, [userId, router])

  const openDiagnostic = async (d: AdminDiagnostic) => {
    setOpeningId(d.id)
    setOpenError(null)
    try {
      const res = await fetch(`/api/diagnostic/${encodeURIComponent(d.id)}`)
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? "Erreur serveur.")
      sessionStorage.setItem("diagnostic", JSON.stringify(data.diagnostic))
      sessionStorage.setItem("vehicleInfo", JSON.stringify(data.vehicleInfo))
      if (data.followUps) {
        sessionStorage.setItem("followUps", data.followUps)
      } else {
        sessionStorage.removeItem("followUps")
      }
      router.push(`/resultat?diagnosticId=${encodeURIComponent(d.id)}&adminView=1`)
    } catch {
      setOpenError("Impossible d'ouvrir ce diagnostic.")
    } finally {
      setOpeningId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  if (error || !user) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-10 space-y-6">
        <Link href="/admin/users">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour à la liste
          </Button>
        </Link>
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="pt-6 pb-6">
            <p className="text-sm text-destructive">{error ?? "Compte introuvable."}</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-10 space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/users">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="flex items-center gap-2 text-xs text-amber-400/80">
          <ShieldAlert className="h-4 w-4" />
          <span>Vue admin — lecture seule des données client.</span>
        </div>
      </div>

      {/* Profil */}
      <Card className="border-border/50">
        <CardContent className="pt-5 pb-5 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
            <Badge variant="outline" className={`text-xs ${ROLE_BADGE_CLASS[user.role] ?? ROLE_BADGE_CLASS.user}`}>
              {ROLE_LABELS[user.role] ?? user.role}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6 text-sm">
            <div className="text-muted-foreground">
              E-mail :{" "}
              <span className="text-foreground font-mono">{user.email}</span>
            </div>
            <div className="text-muted-foreground">
              Inscrit le : <span className="text-foreground">{formatDateTime(user.createdAt)}</span>
            </div>
            <div className="text-muted-foreground flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              Crédits diagnostics : <span className="text-foreground font-semibold">{user.diagnosticCredits}</span>
            </div>
            <div className="text-muted-foreground">
              ID : <span className="text-foreground font-mono text-xs">{user.id}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique diagnostics */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Historique des diagnostics ({diagnostics.length})
          </h2>
        </div>

        {openError && (
          <p className="text-destructive text-sm rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
            {openError}
          </p>
        )}

        {diagnostics.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            Aucun diagnostic réalisé par ce compte.
          </p>
        ) : (
          <div className="space-y-3">
            {diagnostics.map((d) => {
              const canOpen = d.status === "completed" || d.status === "in_progress"
              return (
                <Card
                  key={d.id}
                  className={`border-border/50 bg-card transition-colors ${
                    canOpen
                      ? "cursor-pointer hover:border-primary/40"
                      : "opacity-70"
                  }`}
                  role={canOpen ? "link" : undefined}
                  tabIndex={canOpen ? 0 : undefined}
                  aria-label={canOpen ? "Ouvrir le rapport de ce diagnostic" : undefined}
                  onClick={canOpen ? () => void openDiagnostic(d) : undefined}
                  onKeyDown={
                    canOpen
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            void openDiagnostic(d)
                          }
                        }
                      : undefined
                  }
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">
                            {d.marque} {d.modele}
                            {d.variante ? ` : ${d.variante}` : ""}
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
                          <StatusBadge status={d.status} />
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
                        <p className="text-sm text-foreground/80 leading-relaxed">{truncate(d.probleme)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <time className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(d.createdAt)}
                        </time>
                        {canOpen && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="gap-1.5 h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              void openDiagnostic(d)
                            }}
                            disabled={openingId === d.id}
                          >
                            {openingId === d.id ? (
                              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                            {openingId === d.id ? "Ouverture…" : "Voir le rapport"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
