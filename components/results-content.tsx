"use client"

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Wrench,
  Building2,
  ArrowLeft,
  Clock,
  Euro,
  Info,
  Star,
  Sparkles,
  X,
  Download,
  Calendar,
} from "lucide-react"
import { DiagnosticLoader } from "@/components/diagnostic-loader"
import { useTranslation } from "@/lib/i18n/locale-context"
import { buildLoginUrl } from "@/lib/login-redirect"
import { SS_GUEST_ACTIVE, SS_GUEST_DIAG_ID, SS_POST_VERIFY_REDIRECT } from "@/lib/guest-diagnostic"

/** Rendu léger de markdown : **gras**, sauts de ligne, puces (• ou - en début de ligne) */
function RichText({ text, className }: { text: string; className?: string }) {
  // Découpe le texte en blocs (lignes séparées par \n)
  const lines = text.split(/\n/)

  const renderInline = (str: string): React.ReactNode[] => {
    const parts = str.split(/(\*\*[^*]+\*\*)/)
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  // Regrouper les lignes de puce consécutives en listes
  type Block = { type: "bullet"; items: string[] } | { type: "text"; content: string }
  const blocks: Block[] = []
  for (const line of lines) {
    const bulletMatch = line.match(/^[\u2022\-]\s*(.+)/)
    if (bulletMatch) {
      const last = blocks[blocks.length - 1]
      if (last?.type === "bullet") {
        last.items.push(bulletMatch[1])
      } else {
        blocks.push({ type: "bullet", items: [bulletMatch[1]] })
      }
    } else {
      blocks.push({ type: "text", content: line })
    }
  }

  return (
    <div className={className}>
      {blocks.map((block, bi) => {
        if (block.type === "bullet") {
          return (
            <ul key={bi} className="mt-2 space-y-1 list-none pl-0">
              {block.items.map((item, ii) => (
                <li key={ii} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-current shrink-0 opacity-60" />
                  <span>{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          )
        }
        if (!block.content.trim()) return <div key={bi} className="h-2" />
        return <p key={bi} className="mt-1 first:mt-0">{renderInline(block.content)}</p>
      })}
    </div>
  )
}

type SeverityLevel = "low" | "medium" | "high"

interface DiagnosticResult {
  diagnosticRequestId?: string | null
  creditRefunded?: boolean
  serviceRecommendation?: {
    type: "none" | "lavage-auto"
    title?: string | null
    description?: string | null
  } | null
  concessionOnly?: {
    required: boolean
    brand: string
    explanation: string
    ctaLabel: string
    mapsQuery: string
  } | null
  needsMoreInfo?: boolean
  missingInfo?: {
    needsVariante: boolean
    needsCarburant: boolean
    question: string | null
    answerType?: "yes_no" | "choice"
    options?: Array<{ id: string; label: string; value: string }> | null
    help?: string | null
    requestsGearboxPhoto?: boolean
  } | null
  obdScanFirst?: {
    required: boolean
    scanPrice: number
    explanation: string
    optionA: string
    optionB: string
  } | null
  severity: SeverityLevel
  severityLabel: string
  problem: string
  description: string
  priceRange: {
    min: number
    max: number
  } | null
  diy: {
    possible: boolean
    difficulty: string
    estimatedTime: string
    costRange: {
      min: number
      max: number
    }
    steps: string[]
    tools: string[]
  } | null
  garage: {
    estimatedTime: string
    costRange: {
      min: number
      max: number
    }
    includes: string[]
  } | null
  mechanicReport?: {
    engineCode?: string | null
    gearboxReference?: string | null
    engineIdentificationNotRequired?: boolean
    suspectedFaultCodes?: { code: string; description: string }[]
    partReferences?: { label: string; reference: string }[]
    technicalNotes?: string[]
  } | null
}

interface VehicleInfo {
  marque: string
  modele: string
  variante?: string
  carburant?: string
  transmission?: string
  annee: string
  kilometrage: string
  probleme: string
}

/** Rien à réparer / pas de devis : pas de carte grise tarifaire ni DIY / garage. */
function isNoInterventionResult(d: DiagnosticResult): boolean {
  if (d.needsMoreInfo) return false
  if (d.concessionOnly?.required) return false
  if (d.obdScanFirst?.required) return false
  if (d.serviceRecommendation?.type === "lavage-auto") return false

  const pr = d.priceRange
  const priceClear = pr === null || (pr.min === 0 && pr.max === 0)
  if (!priceClear) return false

  const noGarageWorkRe =
    /\b(aucune intervention|pas d['’]intervention|rien à faire|tout va bien|aucune réparation nécessaire|aucun travail à prévoir|véhicule en bon état|no repair needed|nothing to repair|no work required|vehicle (is )?fine|geen reparatie nodig|niets te repareren)\b/i

  const g = d.garage
  if (g) {
    if (g.costRange.min !== 0 || g.costRange.max !== 0) return false
    const block = `${g.estimatedTime}\n${(g.includes ?? []).join("\n")}`
    if (noGarageWorkRe.test(block)) {
      return true
    }
  }

  const diy = d.diy
  if (
    !g &&
    diy &&
    !diy.possible &&
    diy.costRange.min === 0 &&
    diy.costRange.max === 0
  ) {
    const blob = [diy.difficulty, diy.estimatedTime, ...diy.steps].join(" ")
    if (
      /\b(pas applicable|n'est pas applicable|non applicable|not applicable|niet van toepassing|aucune intervention)\b/i.test(
        blob
      )
    ) {
      return true
    }
  }

  return false
}

function GuestBookingButton({
  href,
  className,
  variant = "default",
  children,
  diagnosticId,
  comingSoon = false,
}: {
  href: string
  className?: string
  variant?: "default" | "outline"
  children: ReactNode
  diagnosticId?: string | null
  comingSoon?: boolean
}) {
  const { t } = useTranslation()
  const [isGuest, setIsGuest] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      setIsGuest(sessionStorage.getItem(SS_GUEST_ACTIVE) === "1")
    } catch {
      setIsGuest(false)
    }
  }, [])

  // ── Mode "coming soon" : modale identique pour tous les utilisateurs ──────
  if (comingSoon) {
    return (
      <>
        <Button type="button" variant={variant} size="lg" className={className} onClick={() => setOpen(true)}>
          {children}
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary shrink-0" />
                Bientôt disponible
              </DialogTitle>
              <DialogDescription className="pt-1 leading-relaxed">
                Merci d&apos;avoir utilisé PitStop ! 🎉
                <br /><br />
                La prise de rendez-vous avec nos garages partenaires sera disponible très prochainement. Nous travaillons activement à l&apos;intégration de nouveaux partenaires en Belgique.
                <br /><br />
                En attendant, vous pouvez consulter votre rapport de diagnostic et le télécharger en PDF pour le présenter à votre garage.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setOpen(false)} className="w-full">
                Compris, merci !
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // ── Comportement existant (invité vs connecté) ────────────────────────────
  function armGuestFlow() {
    try {
      sessionStorage.setItem(SS_POST_VERIFY_REDIRECT, href)
      if (diagnosticId) sessionStorage.setItem(SS_GUEST_DIAG_ID, diagnosticId)
    } catch {
      /* ignore */
    }
  }

  if (!isGuest) {
    return (
      <Button asChild variant={variant} size="lg" className={className}>
        <Link href={href}>{children}</Link>
      </Button>
    )
  }

  const loginHref = buildLoginUrl(href, { reason: "diagnostic" })
  const signupHref = `/inscription?callbackUrl=${encodeURIComponent(href)}`

  return (
    <>
      <Button type="button" variant={variant} size="lg" className={className} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("guestDiag.rdvTitle")}</DialogTitle>
            <DialogDescription>{t("guestDiag.rdvBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button asChild className="w-full">
              <Link href={signupHref} onClick={armGuestFlow}>
                {t("guestDiag.rdvSignup")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={loginHref} onClick={armGuestFlow}>
                {t("guestDiag.rdvLogin")}
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

const severityConfig = {
  low: {
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    icon: CheckCircle,
    bgGradient: "from-green-500/10"
  },
  medium: {
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    icon: AlertCircle,
    bgGradient: "from-yellow-500/10"
  },
  high: {
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: AlertTriangle,
    bgGradient: "from-red-500/10"
  }
}

export function ResultsContent() {
  const { t, locale } = useTranslation()
  const numberLocale = locale === "en" ? "en-GB" : locale === "nl" ? "nl-BE" : "fr-BE"
  const router = useRouter()
  const searchParams = useSearchParams()
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null)
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false)
  const [isTransitioningToFinal, setIsTransitioningToFinal] = useState(false)
  const [isAbandoning, setIsAbandoning] = useState(false)
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false)
  const [followUps, setFollowUps] = useState<Array<{ question: string; answer: string }>>([])
  const [pendingChoices, setPendingChoices] = useState<string[]>([])
  const [pendingDetails, setPendingDetails] = useState("")
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null) // base64
  const [isMobile, setIsMobile] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [isRetranslating, setIsRetranslating] = useState(false)
  const prevLocaleRef = useRef<string | null>(null)
  /** Cache en mémoire des diagnostics déjà générés par locale (évite les re-calls inutiles) */
  const localeCacheRef = useRef<Map<string, DiagnosticResult>>(new Map())

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    setIsMobile(navigator.maxTouchPoints > 0)
  }, [])

  useEffect(() => {
    let cancelled = false

    const applyStoredFollowUps = (raw: string | null) => {
      if (!raw) {
        setFollowUps([])
        return
      }
      try {
        const parsed = JSON.parse(raw) as unknown
        setFollowUps(Array.isArray(parsed) ? parsed : [])
      } catch {
        setFollowUps([])
      }
    }

    const run = async () => {
      const storedDiagnostic = sessionStorage.getItem("diagnostic")
      const storedVehicle = sessionStorage.getItem("vehicleInfo")
      const storedFollowUps = sessionStorage.getItem("followUps")

      if (storedDiagnostic && storedVehicle) {
        const parsed = JSON.parse(storedDiagnostic) as DiagnosticResult
        // Peupler le cache avec la locale courante (locale du diagnostic initial)
        localeCacheRef.current.set(locale, parsed)
        setDiagnostic(parsed)
        setVehicleInfo(JSON.parse(storedVehicle))
        applyStoredFollowUps(storedFollowUps)
        setIsLoading(false)
        return
      }

      const id = searchParams.get("diagnosticId") ?? searchParams.get("id")
      if (id) {
        try {
          const response = await fetch(`/api/diagnostic/${encodeURIComponent(id)}`, {
            credentials: "include",
          })
          const data = await response.json().catch(() => null)
          if (!response.ok || !data?.diagnostic || !data?.vehicleInfo) {
            throw new Error(t("results.loadError"))
          }
          if (cancelled) return
          const diagStr = JSON.stringify(data.diagnostic)
          const vehStr = JSON.stringify(data.vehicleInfo)
          sessionStorage.setItem("diagnostic", diagStr)
          sessionStorage.setItem("vehicleInfo", vehStr)
          if (data.followUps) sessionStorage.setItem("followUps", data.followUps)
          else sessionStorage.removeItem("followUps")
          localeCacheRef.current.set(locale, data.diagnostic)
          setDiagnostic(data.diagnostic)
          setVehicleInfo(data.vehicleInfo)
          applyStoredFollowUps(data.followUps ?? null)
        } catch {
          if (!cancelled) router.push("/")
        } finally {
          if (!cancelled) setIsLoading(false)
        }
        return
      }

      if (!cancelled) router.push("/")
      if (!cancelled) setIsLoading(false)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [router, searchParams, t])

  const submitFollowUpAnswer = async (answer: string) => {
    if (!vehicleInfo || !diagnostic?.missingInfo?.question) return

    const nextFollowUps = [...followUps, { question: diagnostic.missingInfo.question, answer }]
    setIsFollowUpLoading(true)

    try {
      const response = await fetch("/api/diagnostic", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...vehicleInfo,
          followUps: nextFollowUps,
          diagnosticRequestId: diagnostic?.diagnosticRequestId,
          locale,
        }),
      })

      if (!response.ok) {
        throw new Error(t("results.analysisError"))
      }

      const nextDiagnostic = await response.json()

      if (!nextDiagnostic.needsMoreInfo) {
        setIsTransitioningToFinal(true)
        await new Promise<void>((resolve) => setTimeout(resolve, 1800))
      }

      setDiagnostic(nextDiagnostic)
      setFollowUps(nextFollowUps)
      sessionStorage.setItem("diagnostic", JSON.stringify(nextDiagnostic))
      sessionStorage.setItem("followUps", JSON.stringify(nextFollowUps))
    } catch (error) {
      console.error("Erreur:", error)
      alert(t("results.alertError"))
    } finally {
      setIsFollowUpLoading(false)
      setIsTransitioningToFinal(false)
    }
  }

  const submitFollowUp = async () => {
    if (!vehicleInfo || !diagnostic?.missingInfo?.question) return

    const answerType = diagnostic.missingInfo.answerType
    const options = diagnostic.missingInfo.options
    const hasChoiceOptions = answerType === "choice" && Array.isArray(options) && options.length >= 2

    let answer: string
    if (hasChoiceOptions) {
      const uniq = Array.from(new Set(pendingChoices))
      const choicesPart = uniq.length > 0
        ? `${t("results.followupChoicePrefix")} ${uniq.join(", ")}`
        : `${t("results.followupChoicePrefix")} ${t("results.followupChoiceUnspecified")}`
      const detailsPart = pendingDetails.trim()
        ? `${t("results.followupDetailsPrefix")} ${pendingDetails.trim()}`
        : `${t("results.followupDetailsPrefix")} ${t("results.followupDetailsNone")}`
      answer = `${choicesPart}\n${detailsPart}`
    } else {
      const yn = pendingChoices[0] ?? ""
      const ynPart = yn
        ? `${t("results.followupAnswerPrefix")} ${yn}`
        : `${t("results.followupAnswerPrefix")} ${t("results.followupAnswerUnspecified")}`
      const detailsPart = pendingDetails.trim()
        ? `${t("results.followupDetailsPrefix")} ${pendingDetails.trim()}`
        : `${t("results.followupDetailsPrefix")} ${t("results.followupDetailsNone")}`
      answer = `${ynPart}\n${detailsPart}`
    }

    const nextFollowUps = [...followUps, { question: diagnostic.missingInfo.question, answer }]
    setIsFollowUpLoading(true)

    try {
      const response = await fetch("/api/diagnostic", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...vehicleInfo,
          followUps: nextFollowUps,
          diagnosticRequestId: diagnostic?.diagnosticRequestId,
          ...(pendingPhoto ? { photoLevier: pendingPhoto } : {}),
          locale,
        }),
      })

      if (!response.ok) {
        throw new Error(t("results.analysisError"))
      }

      const nextDiagnostic = await response.json()

      if (!nextDiagnostic.needsMoreInfo) {
        setIsTransitioningToFinal(true)
        await new Promise<void>((resolve) => setTimeout(resolve, 1800))
      }

      setDiagnostic(nextDiagnostic)
      setFollowUps(nextFollowUps)
      sessionStorage.setItem("diagnostic", JSON.stringify(nextDiagnostic))
      sessionStorage.setItem("followUps", JSON.stringify(nextFollowUps))
      setPendingChoices([])
      setPendingDetails("")
      setPendingPhoto(null)
    } catch (error) {
      console.error("Erreur:", error)
      alert(t("results.alertError"))
    } finally {
      setIsFollowUpLoading(false)
      setIsTransitioningToFinal(false)
    }
  }

  const handleAbandon = async () => {
    const diagId = diagnostic?.diagnosticRequestId
    const isGuest = typeof window !== "undefined" && sessionStorage.getItem(SS_GUEST_ACTIVE) === "1"
    setIsAbandoning(true)
    try {
      if (diagId) {
        await fetch(`/api/diagnostic/${diagId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "abandoned" }),
        })
      }
    } catch {
      // on continue même en cas d'erreur réseau
    } finally {
      sessionStorage.removeItem("diagnostic")
      sessionStorage.removeItem("vehicleInfo")
      sessionStorage.removeItem("followUps")
      sessionStorage.removeItem(SS_GUEST_ACTIVE)
      sessionStorage.removeItem(SS_GUEST_DIAG_ID)
      router.push(isGuest ? "/" : "/mes-diagnostics")
    }
  }

  const toggleChoice = (value: string) => {
    setPendingChoices((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  const handleDownloadPdf = async () => {
    if (!diagnostic || !vehicleInfo) return
    setPdfLoading(true)
    try {
      // Le rapport garagiste est généré à la demande pour ne pas ralentir
      // l'affichage du diagnostic. Cache DB côté serveur : un re-téléchargement
      // est instantané.
      let mechanicReport = diagnostic.mechanicReport ?? null
      const diagId = diagnostic.diagnosticRequestId
      if (!mechanicReport && diagId) {
        try {
          let extras: { cylindree?: string; puissance?: string; typeBoiteAuto?: string } = {}
          try {
            const raw = sessionStorage.getItem("pendingFormData")
            if (raw) {
              const parsed = JSON.parse(raw) as Record<string, unknown>
              extras = {
                cylindree: typeof parsed.cylindree === "string" ? parsed.cylindree : "",
                puissance: typeof parsed.puissance === "string" ? parsed.puissance : "",
                typeBoiteAuto: typeof parsed.typeBoiteAuto === "string" ? parsed.typeBoiteAuto : "",
              }
            }
          } catch {
            // sessionStorage vidé : on continue sans ces champs (best effort)
          }
          const r = await fetch(`/api/diagnostic/${encodeURIComponent(diagId)}/mechanic-report`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locale, ...extras }),
          })
          if (r.ok) {
            const data = await r.json().catch(() => null)
            mechanicReport = data?.mechanicReport ?? null
          }
        } catch (err) {
          console.error("Mechanic report fetch failed (PDF will be generated without it):", err)
        }
      }
      const enrichedDiagnostic = mechanicReport ? { ...diagnostic, mechanicReport } : diagnostic
      const { generateDiagnosticPdf } = await import("@/lib/generate-diagnostic-pdf")
      generateDiagnosticPdf(enrichedDiagnostic, vehicleInfo, locale)
    } catch (err) {
      console.error("PDF generation error:", err)
    } finally {
      setPdfLoading(false)
    }
  }

  // ── Re-génération du diagnostic lors d'un changement de langue ────────────
  useEffect(() => {
    if (prevLocaleRef.current === null) {
      prevLocaleRef.current = locale
      return
    }
    if (prevLocaleRef.current === locale) return
    prevLocaleRef.current = locale

    // Ne re-génère pas si on est encore en mode questions ou en chargement initial
    if (!diagnostic || !vehicleInfo || diagnostic.needsMoreInfo || isLoading) return

    const retranslate = async () => {
      // Vérifier le cache en mémoire d'abord
      const cached = localeCacheRef.current.get(locale)
      if (cached) {
        setDiagnostic(cached)
        sessionStorage.setItem("diagnostic", JSON.stringify(cached))
        return
      }

      setIsRetranslating(true)
      try {
        const response = await fetch("/api/diagnostic", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...vehicleInfo,
            diagnosticRequestId: diagnostic.diagnosticRequestId,
            locale,
          }),
        })
        if (!response.ok) return
        const data = await response.json()
        if (data?.error) return
        // Mettre en cache pour cette locale
        localeCacheRef.current.set(locale, data)
        setDiagnostic(data)
        setFollowUps([])
        sessionStorage.setItem("diagnostic", JSON.stringify(data))
        sessionStorage.removeItem("followUps")
      } catch {
        // garde le diagnostic existant en cas d'erreur réseau
      } finally {
        setIsRetranslating(false)
      }
    }

    void retranslate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  if (isLoading || !diagnostic || !vehicleInfo) {
    return (
      <div className="container mx-auto px-4 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-muted-foreground">{t("results.loading")}</p>
        </div>
      </div>
    )
  }

  const SeverityIcon = severityConfig[diagnostic.severity].icon
  const isObdScanFirst = !!diagnostic.obdScanFirst?.required
  const isConcessionOnly = !!diagnostic.concessionOnly?.required
  const isCarWashOnlyRequest = diagnostic.serviceRecommendation?.type === "lavage-auto"
  const noInterventionNeeded =
    !isConcessionOnly && !isObdScanFirst && !isCarWashOnlyRequest && isNoInterventionResult(diagnostic)

  return (
    <div className="container mx-auto px-4">
      {isTransitioningToFinal && (
        <DiagnosticLoader
          mode="followup"
          vehicle={`${vehicleInfo.marque} ${vehicleInfo.modele}`}
        />
      )}

      {isRetranslating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-center px-6">
            <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm text-muted-foreground">{t("results.loading")}</p>
          </div>
        </div>
      )}

      {/* Back button + Abandon */}
      <div className="flex items-center justify-between mb-6 gap-3 animate-in fade-in duration-300">
        <Link href="/diagnostic" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {t("results.newAnalysis")}
        </Link>
        {diagnostic?.diagnosticRequestId && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
            onClick={() => setShowAbandonConfirm(true)}
            disabled={isAbandoning}
          >
            <X className="h-3.5 w-3.5" />
            {isAbandoning ? t("results.abandoning") : t("results.abandon")}
          </Button>
        )}
      </div>

      <Dialog open={showAbandonConfirm} onOpenChange={setShowAbandonConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              {t("results.abandonTitle")}
            </DialogTitle>
            <DialogDescription className="pt-1 leading-relaxed">
              {t("results.abandonIntro")}{" "}
              <span className="font-semibold text-foreground">{t("results.abandonNotRefunded")}</span>.
              <br /><br />
              {t("results.abandonSure")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setShowAbandonConfirm(false)}
              disabled={isAbandoning}
            >
              {t("results.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() => { setShowAbandonConfirm(false); handleAbandon() }}
              disabled={isAbandoning}
            >
              {isAbandoning ? t("results.abandoning") : t("results.confirmAbandon")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vehicle summary */}
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-400" style={{ animationDelay: "60ms", animationFillMode: "both" }}>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="font-medium text-foreground">{vehicleInfo.marque} {vehicleInfo.modele}</span>
          <span>•</span>
          <span>{vehicleInfo.annee}</span>
          <span>•</span>
          <span>{parseInt(vehicleInfo.kilometrage, 10).toLocaleString(numberLocale)} km</span>
        </div>
        <p className="text-muted-foreground text-sm italic">&quot;{vehicleInfo.probleme}&quot;</p>
      </div>

      {/* Severity Badge & Problem */}
      <div className={`relative rounded-xl border border-border/50 bg-gradient-to-r ${severityConfig[diagnostic.severity].bgGradient} to-transparent p-6 mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500`} style={{ animationDelay: "130ms", animationFillMode: "both" }}>
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${severityConfig[diagnostic.severity].color} text-sm font-medium w-fit`}>
            <SeverityIcon className="h-4 w-4" />
            {diagnostic.severityLabel}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              {diagnostic.problem}
            </h1>
            <RichText text={diagnostic.description} className="text-foreground/85 text-sm md:text-base leading-relaxed" />
          </div>
        </div>
      </div>

      {/* Concession only (exception vehicles) */}
      {isConcessionOnly && diagnostic.concessionOnly && (
        <Card className="mb-8 border-primary/30 bg-card animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: "220ms", animationFillMode: "both" }}>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {t("results.concessionTitle", { brand: diagnostic.concessionOnly.brand })}
            </CardTitle>
            <CardDescription>{diagnostic.concessionOnly.explanation}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild size="lg" className="w-full">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  diagnostic.concessionOnly.mapsQuery
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {diagnostic.concessionOnly.ctaLabel}
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Follow-up (discussion mode) */}
      {!isConcessionOnly && diagnostic.needsMoreInfo && diagnostic.missingInfo?.question && (
        <Card key={diagnostic.missingInfo.question} className="mb-8 border-primary/30 bg-card animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              {t("results.followupTitle")}
            </CardTitle>
            <CardDescription>
              {t("results.followupDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/50 bg-secondary/30 p-4 text-foreground">
              {diagnostic.missingInfo.question}
            </div>

            {diagnostic.missingInfo.help ? (
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground whitespace-pre-line">
                {diagnostic.missingInfo.help}
              </div>
            ) : null}

            {/* Mode photo levier de vitesses */}
            {diagnostic.missingInfo.requestsGearboxPhoto ? (
              <div className="space-y-3 w-full">
                <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 cursor-pointer hover:bg-primary/10 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    {...(isMobile ? { capture: "environment" as const } : {})}
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = (ev) => {
                        const result = ev.target?.result as string
                        // Extraire uniquement la partie base64 (sans le préfixe data:...)
                        const base64 = result.split(",")[1]
                        setPendingPhoto(base64 ?? null)
                      }
                      reader.readAsDataURL(file)
                    }}
                  />
                  {pendingPhoto ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="h-8 w-8 text-green-400" />
                      <p className="text-sm font-medium text-foreground">{t("results.photoOk")}</p>
                      <p className="text-xs text-muted-foreground">{t("results.changePhoto")}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {isMobile ? t("results.takePhoto") : t("results.uploadPhoto")}
                      </p>
                      <p className="text-xs text-muted-foreground">{t("results.gearboxHint")}</p>
                    </div>
                  )}
                </label>
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  disabled={isFollowUpLoading || !pendingPhoto}
                  onClick={submitFollowUp}
                >
                  {isFollowUpLoading ? t("results.analyzingPhoto") : t("results.sendPhoto")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  disabled={isFollowUpLoading}
                  onClick={() => {
                    setPendingPhoto(null)
                    submitFollowUp()
                  }}
                >
                  {t("results.skipStep")}
                </Button>
              </div>
            ) : null}

            <div className={`flex w-full flex-wrap gap-3 ${diagnostic.missingInfo.requestsGearboxPhoto ? "hidden" : ""}`}>
              {diagnostic.missingInfo.answerType === "choice" &&
              Array.isArray(diagnostic.missingInfo.options) &&
              diagnostic.missingInfo.options.length >= 2 ? (
                diagnostic.missingInfo.options.map((opt, idx) => (
                  <Button
                    key={opt.id || opt.value || String(idx)}
                    type="button"
                    variant={pendingChoices.includes(opt.value) ? "default" : "secondary"}
                    disabled={isFollowUpLoading}
                    onClick={() => toggleChoice(opt.value)}
                    className="h-auto min-h-11 max-w-full min-w-0 shrink flex-[1_1_12rem] !whitespace-normal text-balance px-3 py-2.5 text-left sm:text-center"
                  >
                    {isFollowUpLoading ? "..." : opt.label}
                  </Button>
                ))
              ) : (
                <>
                  <Button
                    type="button"
                    disabled={isFollowUpLoading}
                    variant={pendingChoices[0] === "Oui" ? "default" : "secondary"}
                    onClick={() => setPendingChoices(["Oui"])}
                    className="h-auto min-h-11 max-w-full min-w-0 shrink flex-[1_1_12rem] !whitespace-normal px-3 py-2.5"
                  >
                    {isFollowUpLoading ? "..." : t("results.yes")}
                  </Button>
                  <Button
                    type="button"
                    disabled={isFollowUpLoading}
                    variant={pendingChoices[0] === "Non" ? "default" : "secondary"}
                    onClick={() => setPendingChoices(["Non"])}
                    className="h-auto min-h-11 max-w-full min-w-0 shrink flex-[1_1_12rem] !whitespace-normal px-3 py-2.5"
                  >
                    {isFollowUpLoading ? "..." : t("results.no")}
                  </Button>
                </>
              )}
            </div>

            {!diagnostic.missingInfo.requestsGearboxPhoto && (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{t("results.detailsOptional")}</p>
                  <textarea
                    value={pendingDetails}
                    onChange={(e) => setPendingDetails(e.target.value)}
                    placeholder={t("results.detailsPlaceholder")}
                    className="min-h-[96px] w-full rounded-lg border border-border/50 bg-secondary/20 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={isFollowUpLoading}
                  />
                </div>

                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  disabled={isFollowUpLoading || (pendingChoices.length === 0 && !pendingDetails.trim())}
                  onClick={submitFollowUp}
                >
                  {isFollowUpLoading ? t("results.analyzing") : t("results.sendAnswer")}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* OBD Scan First */}
      {!isConcessionOnly && isObdScanFirst && diagnostic.obdScanFirst && (
        <Card className="mb-8 border-primary/30 bg-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {t("results.obdTitle")}
            </CardTitle>
            <CardDescription>
              {t("results.obdIntro")}{" "}
              {diagnostic.obdScanFirst.explanation}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/50 bg-secondary/30 p-4 text-sm text-muted-foreground">
              {t("results.obdScenarios")}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
                <p className="text-sm font-medium text-foreground mb-1">{t("results.optionA")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("results.optionADesc")}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-foreground">
                  <Euro className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{diagnostic.obdScanFirst.scanPrice}€</span>
                  <span className="text-sm text-muted-foreground">{t("results.obdTenMin")}</span>
                </div>
              </div>
              <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
                <p className="text-sm font-medium text-foreground mb-1">{t("results.optionB")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("results.optionBDesc")}
                </p>
              </div>
            </div>

            <GuestBookingButton
              href={`/rendez-vous?type=obd-scan${diagnostic.obdScanFirst?.scanPrice ? `&priceMin=${diagnostic.obdScanFirst.scanPrice}` : ""}`}
              className="w-full"
              diagnosticId={diagnostic.diagnosticRequestId ?? null}
              comingSoon
            >
              {t("results.planObd")}
            </GuestBookingButton>
          </CardContent>
        </Card>
      )}

      {/* Rien à faire mécaniquement : message positif (pas de devis / DIY / garage) */}
      {noInterventionNeeded && (
        <Card className="mb-8 overflow-hidden border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-card to-sky-500/10 shadow-lg">
          <CardContent className="px-6 py-10 text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20"
              aria-hidden
            >
              <Sparkles className="h-9 w-9 text-emerald-400" strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-xl font-semibold text-foreground md:text-2xl mb-2">
              {t("results.allGoodTitle")}
            </h2>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
              {t("results.allGoodLead")}{" "}
              <span className="font-medium text-foreground">{t("results.allGoodMid")}</span> {t("results.allGoodTail")}
            </p>
            {diagnostic.creditRefunded && (
              <p className="mx-auto mt-5 max-w-lg rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm leading-relaxed text-foreground">
                <span className="font-medium">{t("results.creditRefundedLead")}</span> {t("results.creditRefundedMid")}{" "}
                <span className="font-semibold">{t("results.creditRefundedBold")}</span>
                {t("results.creditRefundedTail")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Car wash partner CTA */}
      {!isConcessionOnly && !isObdScanFirst && isCarWashOnlyRequest && (
        <Card className="mb-8 border-primary/30 bg-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {diagnostic.serviceRecommendation?.title || t("results.carWashDefaultTitle")}
            </CardTitle>
            <CardDescription>
              {diagnostic.serviceRecommendation?.description || t("results.carWashDefaultDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GuestBookingButton
              href="/rendez-vous?type=lavage-auto"
              className="w-full"
              diagnosticId={diagnostic.diagnosticRequestId ?? null}
              comingSoon
            >
              {t("results.bookWash")}
            </GuestBookingButton>
          </CardContent>
        </Card>
      )}

      {/* Price Range */}
      {!isConcessionOnly && !isObdScanFirst && !noInterventionNeeded && diagnostic.priceRange && (
        <Card className="mb-8 border-border/50 bg-card animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: "280ms", animationFillMode: "both" }}>
          <CardContent className="pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Euro className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("results.priceRange")}</p>
                  <p className="text-2xl font-bold text-foreground">
                    {diagnostic.priceRange.min}€ - {diagnostic.priceRange.max}€
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>{t("results.priceHint")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DIY vs Garage Cards : chaque carte si l’API renvoie les données (souvent l’une sans l’autre) */}
      {!isConcessionOnly && !isObdScanFirst && !noInterventionNeeded && (diagnostic.diy || diagnostic.garage) && (
        <div
          className={`grid grid-cols-1 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500 ${
            diagnostic.diy && ["facile", "easy", "makkelijk"].includes(diagnostic.diy.difficulty.trim().toLowerCase()) && diagnostic.garage ? "lg:grid-cols-2" : ""
          }`}
          style={{ animationDelay: "360ms", animationFillMode: "both" }}
        >
        {/* DIY Card : affiche uniquement si difficulte Facile */}
        {diagnostic.diy && ["facile", "easy", "makkelijk"].includes(diagnostic.diy.difficulty.trim().toLowerCase()) && (
        <Card className={`border-border/50 bg-card ${!diagnostic.diy.possible ? 'opacity-75' : ''}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-foreground">{t("results.diyTitle")}</CardTitle>
                  <CardDescription>
                    {diagnostic.diy.possible ? t("results.diyRec") : t("results.diyNoRec")}
                  </CardDescription>
                </div>
              </div>
              {diagnostic.diy.possible && (
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <Star className="h-3 w-3 fill-current" />
                  {t("results.economic")}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("results.estTime")}</p>
                  <p className="text-sm font-medium text-foreground">{diagnostic.diy.estimatedTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("results.partsCost")}</p>
                  <p className="text-sm font-medium text-foreground">{diagnostic.diy.costRange.min}€ - {diagnostic.diy.costRange.max}€</p>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
                {t("results.difficultyPrefix")} {diagnostic.diy.difficulty}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t("results.mainSteps")}</p>
              <ul className="space-y-1">
                {diagnostic.diy.steps.map((step, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary font-medium">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground mb-2">{t("results.tools")}</p>
              <div className="flex flex-wrap gap-2">
                {diagnostic.diy.tools.map((tool, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-md bg-secondary/50 text-muted-foreground">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Garage Card */}
        {diagnostic.garage && (
        <Card className="border-primary/50 bg-gradient-to-br from-primary/8 via-card to-card shadow-md shadow-primary/10 ring-1 ring-primary/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/20 flex items-center justify-center shadow-sm shadow-primary/20">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-foreground">{t("results.garageTitle")}</CardTitle>
                  <CardDescription>{t("results.garageSubtitle")}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/30">
                <CheckCircle className="h-3 w-3" />
                {t("results.recommended")}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("results.estTime")}</p>
                  <p className="text-sm font-medium text-foreground">{diagnostic.garage.estimatedTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("results.totalCost")}</p>
                  <p className="text-sm font-medium text-foreground">{diagnostic.garage.costRange.min}€ - {diagnostic.garage.costRange.max}€</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t("results.includes")}</p>
              <ul className="space-y-1">
                {diagnostic.garage.includes.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <GuestBookingButton
                href={`/rendez-vous${diagnostic.priceRange?.min ? `?priceMin=${diagnostic.priceRange.min}${diagnostic.priceRange?.max ? `&priceMax=${diagnostic.priceRange.max}` : ""}` : ""}`}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/25 font-semibold"
                diagnosticId={diagnostic.diagnosticRequestId ?? null}
                comingSoon
              >
                {t("results.bookRdV")}
              </GuestBookingButton>
              <Button asChild variant="outline" className="flex-1 border-primary/40">
                <Link href="/garages">{t("results.findGarage")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        )}
        </div>
      )}

      {/* CTA garage si fourchette affichée mais pas de bloc garage (API sans objet garage) */}
      {!isConcessionOnly &&
        !isObdScanFirst &&
        !noInterventionNeeded &&
        !isCarWashOnlyRequest &&
        diagnostic.priceRange &&
        !diagnostic.garage && (
          <Card className="mb-8 border-primary/30 bg-card animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: "440ms", animationFillMode: "both" }}>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {t("results.partnerCardTitle")}
              </CardTitle>
              <CardDescription>
                {t("results.partnerCardDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              <GuestBookingButton
                href={`/rendez-vous${diagnostic.priceRange?.min ? `?priceMin=${diagnostic.priceRange.min}${diagnostic.priceRange?.max ? `&priceMax=${diagnostic.priceRange.max}` : ""}` : ""}`}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                diagnosticId={diagnostic.diagnosticRequestId ?? null}
                comingSoon
              >
                {t("results.bookRdV")}
              </GuestBookingButton>
              <Button asChild size="lg" variant="outline" className="flex-1 border-primary/40">
                <Link href="/garages">{t("results.findGarage")}</Link>
              </Button>
            </CardContent>
          </Card>
        )}

      {/* Télécharger le rapport PDF */}
      {!diagnostic.needsMoreInfo && (
        <div className="mt-2 mb-4 flex justify-center animate-in fade-in duration-500" style={{ animationDelay: "500ms", animationFillMode: "both" }}>
          <Button
            size="lg"
            className="gap-2 px-8 py-6 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] transition-all"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
          >
            <Download className="h-5 w-5" />
            {pdfLoading ? "Génération en cours…" : "Télécharger le rapport PDF"}
          </Button>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30 border border-border/50 animate-in fade-in duration-500" style={{ animationDelay: "600ms", animationFillMode: "both" }}>
        <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">{t("results.warningTitle")}</p>
          {noInterventionNeeded ? (
            <p>
              {t("results.warningNoIntervention")}
            </p>
          ) : (
            <p>
              {t("results.warningDefault")}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
