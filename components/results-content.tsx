"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"

type SeverityLevel = "low" | "medium" | "high"

interface DiagnosticResult {
  diagnosticRequestId?: string | null
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

  const g = d.garage
  if (g) {
    if (g.costRange.min !== 0 || g.costRange.max !== 0) return false
    const block = `${g.estimatedTime}\n${(g.includes ?? []).join("\n")}`.toLowerCase()
    if (
      /aucune intervention|pas d.intervention|non nécessaire|sans intervention|rien à faire|aucune prestation|pas de prestation|aucun frais|pas de frais|tout va bien|rien à prévoir/.test(
        block
      )
    ) {
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
    const blob = [diy.difficulty, diy.estimatedTime, ...diy.steps].join(" ").toLowerCase()
    if (/pas applicable|n'est pas applicable|impossible|aucune intervention|non applicable/.test(blob)) {
      return true
    }
  }

  return false
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
  const router = useRouter()
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null)
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false)
  const [followUps, setFollowUps] = useState<Array<{ question: string; answer: string }>>([])
  const [pendingChoices, setPendingChoices] = useState<string[]>([])
  const [pendingDetails, setPendingDetails] = useState("")

  useEffect(() => {
    const storedDiagnostic = sessionStorage.getItem("diagnostic")
    const storedVehicle = sessionStorage.getItem("vehicleInfo")
    const storedFollowUps = sessionStorage.getItem("followUps")
    
    if (storedDiagnostic && storedVehicle) {
      setDiagnostic(JSON.parse(storedDiagnostic))
      setVehicleInfo(JSON.parse(storedVehicle))
      if (storedFollowUps) {
        setFollowUps(JSON.parse(storedFollowUps))
      }
      setIsLoading(false)
    } else {
      router.push("/")
    }
  }, [router])

  const submitFollowUpAnswer = async (answer: string) => {
    if (!vehicleInfo || !diagnostic?.missingInfo?.question) return

    const nextFollowUps = [...followUps, { question: diagnostic.missingInfo.question, answer }]
    setIsFollowUpLoading(true)

    try {
      const response = await fetch("/api/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...vehicleInfo,
          followUps: nextFollowUps,
          diagnosticRequestId: diagnostic?.diagnosticRequestId,
        })
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'analyse")
      }

      const nextDiagnostic = await response.json()
      setDiagnostic(nextDiagnostic)
      setFollowUps(nextFollowUps)
      sessionStorage.setItem("diagnostic", JSON.stringify(nextDiagnostic))
      sessionStorage.setItem("followUps", JSON.stringify(nextFollowUps))
    } catch (error) {
      console.error("Erreur:", error)
      alert("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsFollowUpLoading(false)
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
      const choicesPart = uniq.length > 0 ? `Choix: ${uniq.join(", ")}` : "Choix: (non précisé)"
      const detailsPart = pendingDetails.trim() ? `Détails: ${pendingDetails.trim()}` : "Détails: (aucun)"
      answer = `${choicesPart}\n${detailsPart}`
    } else {
      const yn = pendingChoices[0] ?? ""
      const ynPart = yn ? `Réponse: ${yn}` : "Réponse: (non précisée)"
      const detailsPart = pendingDetails.trim() ? `Détails: ${pendingDetails.trim()}` : "Détails: (aucun)"
      answer = `${ynPart}\n${detailsPart}`
    }

    const nextFollowUps = [...followUps, { question: diagnostic.missingInfo.question, answer }]
    setIsFollowUpLoading(true)

    try {
      const response = await fetch("/api/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...vehicleInfo,
          followUps: nextFollowUps,
          diagnosticRequestId: diagnostic?.diagnosticRequestId,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'analyse")
      }

      const nextDiagnostic = await response.json()
      setDiagnostic(nextDiagnostic)
      setFollowUps(nextFollowUps)
      sessionStorage.setItem("diagnostic", JSON.stringify(nextDiagnostic))
      sessionStorage.setItem("followUps", JSON.stringify(nextFollowUps))
      setPendingChoices([])
      setPendingDetails("")
    } catch (error) {
      console.error("Erreur:", error)
      alert("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsFollowUpLoading(false)
    }
  }

  const toggleChoice = (value: string) => {
    setPendingChoices((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  if (isLoading || !diagnostic || !vehicleInfo) {
    return (
      <div className="container mx-auto px-4 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-muted-foreground">Chargement des résultats...</p>
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
      {/* Back button */}
      <Link href="/diagnostic" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" />
        Nouvelle analyse
      </Link>

      {/* Vehicle summary */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="font-medium text-foreground">{vehicleInfo.marque} {vehicleInfo.modele}</span>
          <span>•</span>
          <span>{vehicleInfo.annee}</span>
          <span>•</span>
          <span>{parseInt(vehicleInfo.kilometrage).toLocaleString('fr-FR')} km</span>
        </div>
        <p className="text-muted-foreground text-sm italic">&quot;{vehicleInfo.probleme}&quot;</p>
      </div>

      {/* Severity Badge & Problem */}
      <div className={`relative rounded-xl border border-border/50 bg-gradient-to-r ${severityConfig[diagnostic.severity].bgGradient} to-transparent p-6 mb-8`}>
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${severityConfig[diagnostic.severity].color} text-sm font-medium w-fit`}>
            <SeverityIcon className="h-4 w-4" />
            {diagnostic.severityLabel}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              {diagnostic.problem}
            </h1>
            <p className="text-muted-foreground">{diagnostic.description}</p>
          </div>
        </div>
      </div>

      {/* Concession only (exception vehicles) */}
      {isConcessionOnly && diagnostic.concessionOnly && (
        <Card className="mb-8 border-primary/30 bg-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Concession {diagnostic.concessionOnly.brand} recommandée
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
              Question pour affiner le diagnostic
            </CardTitle>
            <CardDescription>
              Répondez pour que PitStop ajuste la recommandation et les prix.
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

            <div className="flex w-full flex-wrap gap-3">
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
                    {isFollowUpLoading ? "..." : "Oui"}
                  </Button>
                  <Button
                    type="button"
                    disabled={isFollowUpLoading}
                    variant={pendingChoices[0] === "Non" ? "default" : "secondary"}
                    onClick={() => setPendingChoices(["Non"])}
                    className="h-auto min-h-11 max-w-full min-w-0 shrink flex-[1_1_12rem] !whitespace-normal px-3 py-2.5"
                  >
                    {isFollowUpLoading ? "..." : "Non"}
                  </Button>
                </>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Détails (optionnel)</p>
              <textarea
                value={pendingDetails}
                onChange={(e) => setPendingDetails(e.target.value)}
                placeholder="Ajoutez un détail utile (ex: ce que vous observez, depuis quand, si ça arrive souvent, et tout élément qui peut aider)."
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
              {isFollowUpLoading ? "Analyse en cours…" : "Envoyer ma réponse"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* OBD Scan First */}
      {!isConcessionOnly && isObdScanFirst && diagnostic.obdScanFirst && (
        <Card className="mb-8 border-primary/30 bg-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Scan OBD obligatoire en garage
            </CardTitle>
            <CardDescription>
              Un passage au garage est nécessaire pour réaliser un scan OBD avec un outil professionnel, afin d&apos;identifier précisément l&apos;origine du problème.{" "}
              {diagnostic.obdScanFirst.explanation}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/50 bg-secondary/30 p-4 text-sm text-muted-foreground">
              Deux scénarios sont possibles après le scan OBD : soit il s&apos;agit uniquement d&apos;un code défaut à effacer, soit le diagnostic met en évidence une cause nécessitant une intervention sur le véhicule.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
                <p className="text-sm font-medium text-foreground mb-1">Option A</p>
                <p className="text-sm text-muted-foreground">
                  Le scan indique uniquement un code défaut à supprimer. Le garagiste efface le code.
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-foreground">
                  <Euro className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{diagnostic.obdScanFirst.scanPrice}€</span>
                  <span className="text-sm text-muted-foreground">• 10 min</span>
                </div>
              </div>
              <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
                <p className="text-sm font-medium text-foreground mb-1">Option B</p>
                <p className="text-sm text-muted-foreground">
                  Le scan identifie la cause du problème et une intervention est nécessaire. Le garagiste établit une estimation, propose un devis sur place et fixe un rendez-vous avec vous.
                </p>
              </div>
            </div>

            <Button asChild size="lg" className="w-full">
              <Link href="/rendez-vous?type=obd-scan">
                Planifier un rendez-vous pour le scan OBD
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Rien à faire mécaniquement — message positif (pas de devis / DIY / garage) */}
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
              Tout roule !
            </h2>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
              D&apos;après cette analyse,{" "}
              <span className="font-medium text-foreground">aucune intervention n&apos;est nécessaire</span> pour ce que
              vous avez décrit (pas de devis ni de passage garage pour ça). Profitez de la route !
            </p>
            <p className="mx-auto mt-5 max-w-lg rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm leading-relaxed text-foreground">
              <span className="font-medium">Cadeau PitStop :</span> étant donné qu'aucune intervention n'est nécessaire, <span className="font-semibold">votre prochain diagnostic vous est offert</span>. <br />(Ne s&apos;applique pas aux autres résultats d&apos;analyse).
            </p>
          </CardContent>
        </Card>
      )}

      {/* Car wash partner CTA */}
      {!isConcessionOnly && !isObdScanFirst && isCarWashOnlyRequest && (
        <Card className="mb-8 border-primary/30 bg-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {diagnostic.serviceRecommendation?.title || "Lavage auto partenaire"}
            </CardTitle>
            <CardDescription>
              {diagnostic.serviceRecommendation?.description ||
                "Pour cette demande, vous pouvez réserver un créneau dans une station de lavage partenaire (intérieur, extérieur ou complet)."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full">
              <Link href="/rendez-vous?type=lavage-auto">Prendre rendez-vous en station partenaire</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Price Range */}
      {!isConcessionOnly && !isObdScanFirst && !noInterventionNeeded && diagnostic.priceRange && (
        <Card className="mb-8 border-border/50 bg-card">
          <CardContent className="pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Euro className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fourchette de prix estimée</p>
                  <p className="text-2xl font-bold text-foreground">
                    {diagnostic.priceRange.min}€ - {diagnostic.priceRange.max}€
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>Prix indicatifs basés sur les tarifs du marché</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DIY vs Garage Cards — chaque carte si l’API renvoie les données (souvent l’une sans l’autre) */}
      {!isConcessionOnly && !isObdScanFirst && !noInterventionNeeded && (diagnostic.diy || diagnostic.garage) && (
        <div
          className={`grid grid-cols-1 gap-6 mb-8 ${
            diagnostic.diy && diagnostic.garage ? "lg:grid-cols-2" : ""
          }`}
        >
        {/* DIY Card */}
        {diagnostic.diy && (
        <Card className={`border-border/50 bg-card ${!diagnostic.diy.possible ? 'opacity-75' : ''}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Faire soi-même (DIY)</CardTitle>
                  <CardDescription>
                    {diagnostic.diy.possible ? 'Option recommandée pour les bricoleurs' : 'Non recommandé sans expérience'}
                  </CardDescription>
                </div>
              </div>
              {diagnostic.diy.possible && (
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <Star className="h-3 w-3 fill-current" />
                  Économique
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Temps estimé</p>
                  <p className="text-sm font-medium text-foreground">{diagnostic.diy.estimatedTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Coût pièces</p>
                  <p className="text-sm font-medium text-foreground">{diagnostic.diy.costRange.min}€ - {diagnostic.diy.costRange.max}€</p>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
                Difficulté: {diagnostic.diy.difficulty}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Étapes principales:</p>
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
              <p className="text-sm font-medium text-foreground mb-2">Outils nécessaires:</p>
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
        <Card className="border-border/50 bg-card border-primary/30">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Confier à un garage</CardTitle>
                  <CardDescription>Réparation professionnelle avec garantie</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary border border-primary/30">
                <CheckCircle className="h-3 w-3" />
                Recommandé
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Temps estimé</p>
                  <p className="text-sm font-medium text-foreground">{diagnostic.garage.estimatedTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Coût total</p>
                  <p className="text-sm font-medium text-foreground">{diagnostic.garage.costRange.min}€ - {diagnostic.garage.costRange.max}€</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Le service inclut:</p>
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
              <Button asChild className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/rendez-vous">Prendre rendez-vous</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 border-primary/40">
                <Link href="/garages">Trouver un garage proche</Link>
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
          <Card className="mb-8 border-primary/30 bg-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Passer par un garage partenaire
              </CardTitle>
              <CardDescription>
                Même pour une intervention à planifier dans les prochains mois, vous pouvez dès maintenant réserver un créneau ou trouver un garage près de chez vous.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/rendez-vous">Prendre rendez-vous</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="flex-1 border-primary/40">
                <Link href="/garages">Trouver un garage proche</Link>
              </Button>
            </CardContent>
          </Card>
        )}

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30 border border-border/50">
        <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Avertissement</p>
          {noInterventionNeeded ? (
            <p>
              Les analyses PitStop sont indicatives. En cas de doute, d&apos;un voyant ou d&apos;un bruit nouveau, procédez à une nouvelle analyse ou faites
              contrôler le véhicule par un professionnel.
            </p>
          ) : (
            <p>
              Ces estimations sont construites pour vous fournir un diagnostic fiable et un devis cohérent avec les
              standards du marché belge. Les garages partenaires PitStop s&apos;engagent à s&apos;aligner sur les
              montants annoncés, sauf découverte technique majeure lors du contrôle physique du véhicule.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
