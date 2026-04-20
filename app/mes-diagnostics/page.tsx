"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Car, Calendar, Gauge, Search, RotateCcw, Eye, AlertTriangle } from "lucide-react"
import { getDiagnosticEntryHref } from "@/lib/diagnostic-entry-href"
import { buildLoginUrl } from "@/lib/login-redirect"
import { formatCarburantOptionLabel } from "@/lib/format-carburant-label"
import { formatTransmissionOptionLabel } from "@/lib/format-transmission-label"
import { useTranslation } from "@/lib/i18n/locale-context"

type DiagnosticStatus = "in_progress" | "completed" | "abandoned"

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
  status: DiagnosticStatus
  disputableReservationId: string | null
}

function truncate(text: string, max = 120) {
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text
}

function StatusBadge({ status }: { status: DiagnosticStatus }) {
  const { t } = useTranslation()
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[11px] font-medium text-green-400 border border-green-500/25">
        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
        {t("mesDiagnostics.statusCompleted")}
      </span>
    )
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/25">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
        {t("profilePage.statusInProgress")}
      </span>
    )
  }
  if (status === "abandoned") {
    return (
      <span className="inline-flex items-center rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/40">
        {t("profilePage.statusAbandoned")}
      </span>
    )
  }
  return null
}

export default function MesDiagnosticsPage() {
  const { t, locale } = useTranslation()
  const numberLocale = locale === "en" ? "en-GB" : locale === "nl" ? "nl-BE" : "fr-BE"
  const router = useRouter()
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([])
  const [me, setMe] = useState<{ role: string; diagnosticCredits?: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resumingId, setResumingId] = useState<string | null>(null)
  const [resumeError, setResumeError] = useState<string | null>(null)

  function formatDate(iso: string) {
    try {
      return new Intl.DateTimeFormat(numberLocale, {
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

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setMe(data?.user ?? null))
      .catch(() => setMe(null))
  }, [])

  useEffect(() => {
    fetch("/api/mes-diagnostics")
      .then(async (r) => {
        if (r.status === 401) {
          router.replace(buildLoginUrl("/mes-diagnostics"))
          return null
        }
        if (!r.ok) throw new Error(t("mesDiagnostics.serverError"))
        return r.json()
      })
      .then((data) => {
        if (data) setDiagnostics(data.diagnostics ?? [])
      })
      .catch(() => setError(t("mesDiagnostics.loadListError")))
      .finally(() => setLoading(false))
  }, [router, t])

  const handleResume = async (d: Diagnostic) => {
    setResumingId(d.id)
    setResumeError(null)
    try {
      const response = await fetch(`/api/diagnostic/${d.id}`)
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? t("mesDiagnostics.serverError"))

      sessionStorage.setItem("diagnostic", JSON.stringify(data.diagnostic))
      sessionStorage.setItem("vehicleInfo", JSON.stringify(data.vehicleInfo))
      if (data.followUps) {
        sessionStorage.setItem("followUps", data.followUps)
      } else {
        sessionStorage.removeItem("followUps")
      }
      router.push(`/resultat?diagnosticId=${encodeURIComponent(d.id)}`)
    } catch {
      setResumeError(t("mesDiagnostics.resumeError"))
    } finally {
      setResumingId(null)
    }
  }

  const diagnosticHref = getDiagnosticEntryHref(me)

  const canOpenStoredResult = (d: Diagnostic) =>
    d.status === "completed" || d.status === "in_progress"

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link href="/" aria-label={t("mesDiagnostics.backHomeLabel")}>
          <Button variant="outline">{t("mesDiagnostics.backHomeLabel")}</Button>
        </Link>
      </div>

      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("mesDiagnostics.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("mesDiagnostics.subtitle")}</p>
        </div>
        <Link href={diagnosticHref}>
          <Button size="sm" className="gap-2">
            <Search className="h-4 w-4" />
            {t("mesDiagnostics.newDiagnostic")}
          </Button>
        </Link>
      </div>

      {resumeError && (
        <p className="text-destructive text-sm text-center mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          {resumeError}
        </p>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}

      {error && <p className="text-destructive text-sm text-center py-10">{error}</p>}

      {!loading && !error && diagnostics.length === 0 && (
        <div className="text-center py-16 space-y-4">
          <Car className="h-12 w-12 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground">{t("mesDiagnostics.empty")}</p>
          <Link href={diagnosticHref}>
            <Button variant="outline" className="mt-2">
              {t("mesDiagnostics.ctaFirst")}
            </Button>
          </Link>
        </div>
      )}

      {!loading && !error && diagnostics.length > 0 && (
        <div className="space-y-4">
          {diagnostics.map((d) => (
            <Card
              key={d.id}
              className={`border-border/50 bg-card transition-colors ${
                d.status === "abandoned"
                  ? "opacity-60"
                  : canOpenStoredResult(d)
                    ? "cursor-pointer hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    : "hover:border-border"
              }`}
              role={canOpenStoredResult(d) ? "link" : undefined}
              tabIndex={canOpenStoredResult(d) ? 0 : undefined}
              aria-label={
                canOpenStoredResult(d)
                  ? d.status === "completed"
                    ? t("mesDiagnostics.ariaSeeResults")
                    : t("mesDiagnostics.ariaResume")
                  : undefined
              }
              onClick={
                canOpenStoredResult(d)
                  ? () => {
                      void handleResume(d)
                    }
                  : undefined
              }
              onKeyDown={
                canOpenStoredResult(d)
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        void handleResume(d)
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
                          {formatCarburantOptionLabel(d.carburant, t)}
                        </span>
                      )}
                      {d.transmission && (
                        <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                          {formatTransmissionOptionLabel(d.transmission, t)}
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
                        {Number(d.kilometrage).toLocaleString(numberLocale)} km
                      </span>
                    </div>

                    <p className="text-sm text-foreground/80 leading-relaxed">{truncate(d.probleme)}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <time className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(d.createdAt)}</time>
                    {d.status === "completed" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1.5 h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          void handleResume(d)
                        }}
                        disabled={resumingId === d.id}
                      >
                        {resumingId === d.id ? (
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                        {resumingId === d.id ? t("mesDiagnostics.loading") : t("mesDiagnostics.seeResults")}
                      </Button>
                    )}
                    {d.status === "in_progress" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-7 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                        onClick={(e) => {
                          e.stopPropagation()
                          void handleResume(d)
                        }}
                        disabled={resumingId === d.id}
                      >
                        {resumingId === d.id ? (
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <RotateCcw className="h-3 w-3" />
                        )}
                        {resumingId === d.id ? t("mesDiagnostics.loading") : t("mesDiagnostics.resume")}
                      </Button>
                    )}
                    {d.disputableReservationId && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-7 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/litige/${d.disputableReservationId}`)
                        }}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Signaler un litige
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
