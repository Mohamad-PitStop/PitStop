"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { postVehicleOptions } from "@/lib/vehicle-options-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Car,
  FileText,
  Fuel,
  Settings2,
  Calendar,
  Gauge,
  Search,
  TrendingUp,
  CircleDollarSign,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  X,
  Loader2,
} from "lucide-react"
import { carBrands, carModels } from "@/lib/vehicle-model-catalog"
import { getAvailableYearsForModel } from "@/lib/vehicle-year-catalog"
import {
  getAvailableFuelTypesForSelection,
  getAvailableTransmissionTypesForSelection,
} from "@/lib/vehicle-compatibility-catalog"
import { useCarsApi } from "@/hooks/use-cars-api"
import { isExceptionBrand, MESSAGE_MARQUE_EXCEPTION } from "@/lib/exception-brands"
import { formatCarburantOptionLabel } from "@/lib/format-carburant-label"
import { dedupeModelsByVariantBase, filterFrenchModelLabels } from "@/lib/merge-verified-models"

type FormState = {
  marque: string
  modele: string
  variante: string
  annee: string
  kilometrage: string
  carburant: string
  transmission: string
  etat: string
  entretien: string
  proprietaires: string
  prixNeuf: string
  demarre: boolean
  accidente: boolean
  controleTechnique: boolean
  description: string
  cylindree: string
  puissance: string
  nombrePortes: string
  typeCarrosserie: string
}

type Estimate = {
  low: number
  mid: number
  high: number
}

const etatOptions = ["Excellent", "Bon", "Correct", "À prévoir"]
const entretienOptions = ["Complet (factures)", "Partiel", "Inconnu"]
const MAX_PHOTOS = 4
const MAX_PHOTO_BYTES = 2 * 1024 * 1024 // 2 MB

const selectClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-[#0a1628] [&>option]:text-foreground"

const MANUAL_PLACEHOLDER = "Saisir manuellement"

function sortYearsDesc(years: string[]): string[] {
  return [...years].sort((a, b) => Number(b) - Number(a))
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function roundToHundred(value: number): number {
  return Math.round(value / 100) * 100
}

function estimateVehicleValue(form: FormState): Estimate {
  const currentYear = new Date().getFullYear()
  const year = Number(form.annee)
  const km = Number(form.kilometrage)
  const owners = Number(form.proprietaires || "1")

  const age = clamp(currentYear - year, 0, 35)
  const ageFactor = clamp(1 - age * 0.055, 0.18, 1)

  const fallbackBasePrice = 24000
  const baseFromUser = Number(form.prixNeuf)
  const basePrice = Number.isFinite(baseFromUser) && baseFromUser > 0 ? baseFromUser : fallbackBasePrice

  const expectedKm = age * 15000 + 30000
  const kmDelta = km - expectedKm
  const kmAdjustment = clamp(-(kmDelta / 20000) * 0.02, -0.25, 0.12)

  let qualityMultiplier = 1

  if (form.transmission === "Automatique" || form.transmission === "Semi-automatique (robotisée)") {
    qualityMultiplier += 0.03
  }

  if (form.carburant === "Hybride" || form.carburant === "Hybride rechargeable") qualityMultiplier += 0.04
  if (form.carburant === "Électrique") qualityMultiplier += age <= 8 ? 0.06 : -0.03
  if (form.carburant === "Diesel" && age >= 9) qualityMultiplier -= 0.06

  if (form.etat === "Excellent") qualityMultiplier += 0.12
  else if (form.etat === "Bon") qualityMultiplier += 0.05
  else if (form.etat === "Correct") qualityMultiplier -= 0.04
  else qualityMultiplier -= 0.12

  if (form.entretien === "Complet (factures)") qualityMultiplier += 0.06
  else if (form.entretien === "Inconnu") qualityMultiplier -= 0.08

  if (owners > 1) qualityMultiplier -= clamp((owners - 1) * 0.02, 0, 0.14)
  if (!form.demarre) qualityMultiplier -= 0.08
  if (form.accidente) qualityMultiplier -= 0.12
  if (form.controleTechnique) qualityMultiplier += 0.03

  qualityMultiplier += kmAdjustment
  qualityMultiplier = clamp(qualityMultiplier, 0.55, 1.35)

  // Prix marché (ordre de grandeur) puis coefficient rachat garage partenaire (marge du garage)
  const RACHAT_GARAGE_FACTOR = 0.72
  const midMarket = roundToHundred(basePrice * ageFactor * qualityMultiplier)
  const spread = clamp(midMarket * 0.08, 700, 3500)
  const mid = roundToHundred(midMarket * RACHAT_GARAGE_FACTOR)
  const spreadRachat = roundToHundred(spread * RACHAT_GARAGE_FACTOR)

  return {
    low: Math.max(500, roundToHundred(mid - spreadRachat)),
    mid,
    high: roundToHundred(mid + spreadRachat),
  }
}

export function SaleEstimator() {
  const { makes: apiMakes, models: apiModels, loadingMakes, loadingModels, fetchModels } = useCarsApi()
  const [form, setForm] = useState<FormState>({
    marque: "",
    modele: "",
    variante: "",
    annee: "",
    kilometrage: "",
    carburant: "",
    transmission: "",
    etat: "",
    entretien: "",
    proprietaires: "1",
    prixNeuf: "",
    demarre: true,
    accidente: false,
    controleTechnique: false,
    description: "",
    cylindree: "",
    puissance: "",
    nombrePortes: "",
    typeCarrosserie: "",
  })
  const [extraOpen, setExtraOpen] = useState(false)
  const [puissanceUnite, setPuissanceUnite] = useState<"ch" | "kW">("ch")
  const [submitted, setSubmitted] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [analyzeLoading, setAnalyzeLoading] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cascadeGen = useRef(0)
  const [variantList, setVariantList] = useState<string[]>([])
  const [yearList, setYearList] = useState<string[]>([])
  const [fuelList, setFuelList] = useState<string[]>([])
  const [transList, setTransList] = useState<string[]>([])
  const [loadingVariant, setLoadingVariant] = useState(false)
  const [loadingYear, setLoadingYear] = useState(false)
  const [loadingFuel, setLoadingFuel] = useState(false)
  const [loadingTrans, setLoadingTrans] = useState(false)
  const [fallbackVariant, setFallbackVariant] = useState(false)
  const [fallbackYear, setFallbackYear] = useState(false)
  const [fallbackFuel, setFallbackFuel] = useState(false)
  const [fallbackTrans, setFallbackTrans] = useState(false)
  const [variantUiSkipped, setVariantUiSkipped] = useState(true)
  const [fuelLocked, setFuelLocked] = useState(false)
  const [transLocked, setTransLocked] = useState(false)

  const loadYears = useCallback(
    async (ctx: { marque: string; modele: string; variante: string }, gen: number) => {
      setLoadingYear(true)
      setFallbackYear(false)
      try {
        const r = await postVehicleOptions({
          marque: ctx.marque,
          modele: ctx.modele,
          variante: ctx.variante,
        })
        if (gen !== cascadeGen.current) return
        if (r.error) {
          setFallbackYear(true)
          setYearList(sortYearsDesc(getAvailableYearsForModel(ctx.marque, ctx.modele, "", "")))
          return
        }
        const opts = sortYearsDesc(r.options)
        setYearList(opts)
        if (opts.length === 1) {
          setForm((prev) => ({ ...prev, annee: opts[0] }))
        }
      } finally {
        if (gen === cascadeGen.current) setLoadingYear(false)
      }
    },
    []
  )

  const loadFuels = useCallback(
    async (ctx: { marque: string; modele: string; variante: string; annee: string }, gen: number) => {
      setLoadingFuel(true)
      setFallbackFuel(false)
      setFuelLocked(false)
      try {
        const r = await postVehicleOptions({
          marque: ctx.marque,
          modele: ctx.modele,
          variante: ctx.variante,
          annee: ctx.annee,
        })
        if (gen !== cascadeGen.current) return
        if (r.error) {
          setFallbackFuel(true)
          setFuelList(getAvailableFuelTypesForSelection(ctx.marque, ctx.modele))
          return
        }
        setFuelList(r.options)
        if (r.options.length === 1) {
          setForm((prev) => ({ ...prev, carburant: r.options[0] }))
          setFuelLocked(true)
        }
      } finally {
        if (gen === cascadeGen.current) setLoadingFuel(false)
      }
    },
    []
  )

  const loadTransmissions = useCallback(
    async (
      ctx: { marque: string; modele: string; variante: string; annee: string; carburant: string },
      gen: number
    ) => {
      setLoadingTrans(true)
      setFallbackTrans(false)
      setTransLocked(false)
      try {
        const r = await postVehicleOptions({
          marque: ctx.marque,
          modele: ctx.modele,
          variante: ctx.variante,
          annee: ctx.annee,
          carburant: ctx.carburant,
        })
        if (gen !== cascadeGen.current) return
        if (r.error) {
          setFallbackTrans(true)
          setTransList(getAvailableTransmissionTypesForSelection(ctx.marque, ctx.modele, ctx.carburant))
          return
        }
        setTransList(r.options)
        if (r.options.length === 1) {
          setForm((prev) => ({ ...prev, transmission: r.options[0] }))
          setTransLocked(true)
        }
      } finally {
        if (gen === cascadeGen.current) setLoadingTrans(false)
      }
    },
    []
  )

  const availableMakes = apiMakes.length > 0 ? apiMakes : carBrands
  const baseModels = apiModels.length > 0 ? apiModels : form.marque ? carModels[form.marque] ?? [] : []
  const availableModels = dedupeModelsByVariantBase(filterFrenchModelLabels(baseModels))

  useEffect(() => {
    fetchModels(form.marque)
  }, [form.marque, fetchModels])

  /** Dès le modèle : variantes puis années (identique au diagnostic) */
  useEffect(() => {
    if (!form.marque || !form.modele || isExceptionBrand(form.marque)) {
      setVariantList([])
      setYearList([])
      setFuelList([])
      setTransList([])
      return
    }

    const gen = ++cascadeGen.current
    let cancelled = false

    void (async () => {
      setLoadingVariant(true)
      setFallbackVariant(false)
      setVariantUiSkipped(true)
      setForm((prev) => ({
        ...prev,
        variante: "",
        annee: "",
        carburant: "",
        transmission: "",
        kilometrage: "",
      }))
      setFuelLocked(false)
      setTransLocked(false)

      const r = await postVehicleOptions({
        marque: form.marque,
        modele: form.modele,
      })

      if (cancelled || gen !== cascadeGen.current) return
      setLoadingVariant(false)

      if (r.error) {
        console.error("variantes (vente): saisie manuelle")
        setFallbackVariant(true)
        setVariantUiSkipped(false)
        setVariantList([])
        return
      }

      if (r.options.length === 0) {
        setVariantUiSkipped(true)
        setForm((prev) => ({ ...prev, variante: "" }))
        await loadYears({ marque: form.marque, modele: form.modele, variante: "" }, gen)
        return
      }

      if (r.options.length === 1) {
        setVariantUiSkipped(true)
        const v = r.options[0]
        setForm((prev) => ({ ...prev, variante: v }))
        await loadYears({ marque: form.marque, modele: form.modele, variante: v }, gen)
        return
      }

      setVariantList(r.options)
      setVariantUiSkipped(false)
      setForm((prev) => ({ ...prev, variante: "" }))
      await loadYears({ marque: form.marque, modele: form.modele, variante: "" }, gen)
    })()

    return () => {
      cancelled = true
    }
  }, [form.marque, form.modele, loadYears])

  /** Année → carburants */
  useEffect(() => {
    if (!form.annee?.trim() || !form.marque || !form.modele) return
    const gen = ++cascadeGen.current
    void loadFuels(
      {
        marque: form.marque,
        modele: form.modele,
        variante: form.variante,
        annee: form.annee,
      },
      gen
    )
  }, [form.annee, form.marque, form.modele, form.variante, loadFuels])

  /** Carburant → transmissions */
  useEffect(() => {
    if (!form.carburant?.trim() || !form.annee?.trim() || !form.marque || !form.modele) return
    const gen = ++cascadeGen.current
    void loadTransmissions(
      {
        marque: form.marque,
        modele: form.modele,
        variante: form.variante,
        annee: form.annee,
        carburant: form.carburant,
      },
      gen
    )
  }, [form.carburant, form.annee, form.marque, form.modele, form.variante, loadTransmissions])

  const isMarqueDone = !!form.marque
  const isModeleDone = isMarqueDone && !!form.modele
  const isAnneeDone = isModeleDone && !!form.annee
  const isCarburantDone = isAnneeDone && (!!form.carburant || fuelLocked)
  const isTransmissionDone = isCarburantDone && (!!form.transmission || transLocked)

  useEffect(() => {
    if (form.modele && availableModels.length > 0 && !availableModels.includes(form.modele)) {
      setForm((prev) => ({
        ...prev,
        modele: "",
        variante: "",
        carburant: "",
        transmission: "",
        annee: "",
      }))
    }
  }, [form.marque, form.modele, availableModels])

  useEffect(() => {
    if (fallbackFuel) return
    if (form.carburant && fuelList.length > 0 && !fuelList.includes(form.carburant)) {
      setForm((prev) => ({ ...prev, carburant: "" }))
    }
  }, [form.marque, form.modele, fuelList, form.carburant, fallbackFuel])

  useEffect(() => {
    if (fallbackTrans) return
    if (form.transmission && transList.length > 0 && !transList.includes(form.transmission)) {
      setForm((prev) => ({ ...prev, transmission: "" }))
    }
  }, [form.marque, form.modele, form.carburant, transList, form.transmission, fallbackTrans])

  useEffect(() => {
    if (fallbackYear) return
    if (form.annee && yearList.length > 0 && !yearList.includes(form.annee)) {
      setForm((prev) => ({ ...prev, annee: "" }))
    }
  }, [form.marque, form.modele, form.variante, yearList, form.annee, fallbackYear])

  /** Variante textuelle si plusieurs variantes API ou erreur — comme le diagnostic */
  const showVariantField =
    isModeleDone && (fallbackVariant || (!variantUiSkipped && variantList.length > 1))
  const yearSelectDisabled = !isModeleDone || loadingVariant || loadingYear
  const yearOptionsForSelect = yearList
  const showYearFallbackInput = fallbackYear && !loadingYear

  const isException = isExceptionBrand(form.marque)

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhotoError(null)
    const files = Array.from(e.target.files ?? [])
    const images = files.filter((f) => f.type.startsWith("image/"))
    const valid: File[] = []
    for (const f of images) {
      if (valid.length >= MAX_PHOTOS) break
      if (f.size <= MAX_PHOTO_BYTES) valid.push(f)
    }
    if (images.some((f) => f.size > MAX_PHOTO_BYTES))
      setPhotoError(`Max ${MAX_PHOTOS} photos, 2 Mo chacune. Les trop volumineuses sont ignorées.`)
    setPhotoFiles((prev) => [...prev, ...valid].slice(0, MAX_PHOTOS))
    e.target.value = ""
  }
  function removePhoto(index: number) {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index))
    setPhotoError(null)
  }

  const photoPreviewUrls = useMemo(() => photoFiles.map((f) => URL.createObjectURL(f)), [photoFiles])
  useEffect(() => {
    return () => {
      photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [photoPreviewUrls])

  const isReady =
    !isException &&
    form.marque.trim().length > 0 &&
    form.modele.trim().length > 0 &&
    form.annee.trim().length > 0 &&
    form.kilometrage.trim().length > 0 &&
    form.carburant.trim().length > 0 &&
    form.transmission.trim().length > 0 &&
    form.etat.trim().length > 0 &&
    form.entretien.trim().length > 0

  const estimate = useMemo(() => {
    if (!isReady) return null
    const year = Number(form.annee)
    const km = Number(form.kilometrage)
    if (!Number.isFinite(year) || year < 1900 || year > new Date().getFullYear()) return null
    if (!Number.isFinite(km) || km < 0 || km > 600000) return null
    return estimateVehicleValue(form)
  }, [form, isReady])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const MAX_EXTRA = 80
  const trim = (s: string) => (s || "").trim()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAnalyzeError(null)
    setAnalysis(null)
    if (isExceptionBrand(form.marque)) return
    if (!estimate) return

    const cylindree = trim(form.cylindree)
    const puissanceVal = trim(form.puissance)
    const puissance = puissanceVal ? `${puissanceVal} ${puissanceUnite}` : ""
    const nombrePortes = trim(form.nombrePortes)
    const typeCarrosserie = trim(form.typeCarrosserie)
    if (cylindree.length > MAX_EXTRA || (puissanceVal && puissance.length > MAX_EXTRA) || nombrePortes.length > MAX_EXTRA || typeCarrosserie.length > MAX_EXTRA) {
      setAnalyzeError("Les informations complémentaires ne doivent pas dépasser 80 caractères par champ.")
      return
    }
    if (nombrePortes.length > 0) {
      const onlyNum = /^\d+$/.test(nombrePortes)
      const num = parseInt(nombrePortes, 10)
      if (onlyNum && (Number.isNaN(num) || num < 2 || num > 6)) {
        setAnalyzeError("Nombre de portes : indiquez un nombre entre 2 et 6 (ex. 3 ou 5).")
        return
      }
    }

    setAnalyzeLoading(true)
    try {
      const photosBase64: string[] = []
      for (const file of photoFiles) {
        const b64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader()
          r.onload = () => {
            const dataUrl = r.result as string
            const base64 = dataUrl.split(",")[1]
            resolve(base64 ?? "")
          }
          r.onerror = () => reject(new Error("Lecture impossible"))
          r.readAsDataURL(file)
        })
        if (b64) photosBase64.push(b64)
      }

      const res = await fetch("/api/vente/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marque: form.marque,
          modele: form.modele,
          variante: form.variante || undefined,
          carburant: form.carburant,
          transmission: form.transmission,
          annee: form.annee,
          kilometrage: form.kilometrage,
          etat: form.etat,
          entretien: form.entretien,
          proprietaires: form.proprietaires,
          prixNeuf: form.prixNeuf || undefined,
          demarre: form.demarre,
          accidente: form.accidente,
          controleTechnique: form.controleTechnique,
          description: form.description.trim(),
          cylindree: trim(form.cylindree) || undefined,
          puissance: form.puissance.trim() ? `${form.puissance.trim()} ${puissanceUnite}` : undefined,
          nombrePortes: trim(form.nombrePortes) || undefined,
          typeCarrosserie: trim(form.typeCarrosserie) || undefined,
          photos: photosBase64.length > 0 ? photosBase64 : undefined,
          estimate: { low: estimate.low, mid: estimate.mid, high: estimate.high },
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setAnalyzeError(data?.error ?? "Erreur lors de l'analyse.")
        return
      }
      if (data?.ok && typeof data.analysis === "string") {
        setAnalysis(data.analysis.replace(/\*\*/g, "").replace(/__/g, ""))
      }
    } catch {
      setAnalyzeError("Erreur lors de l'analyse. Veuillez réessayer.")
    } finally {
      setAnalyzeLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-2xl mx-auto border-border/50 bg-card shadow-xl pt-3">
        <CardContent className="pt-3">
          <form onSubmit={onSubmit} className="space-y-5">
            <p className="text-sm font-medium text-foreground text-left">Informations du véhicule</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="marque" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Car className="h-4 w-4 text-primary" />
                  Marque
                </label>
                <select
                  id="marque"
                  value={form.marque}
                  onChange={(e) => {
                    const v = e.target.value
                    cascadeGen.current += 1
                    setForm((prev) => ({
                      ...prev,
                      marque: v,
                      modele: "",
                      variante: "",
                      carburant: "",
                      transmission: "",
                      annee: "",
                      kilometrage: "",
                    }))
                    setVariantList([])
                    setYearList([])
                    setFuelList([])
                    setTransList([])
                    setFallbackVariant(false)
                    setFallbackYear(false)
                    setFallbackFuel(false)
                    setFallbackTrans(false)
                    setFuelLocked(false)
                    setTransLocked(false)
                  }}
                  required
                  className={selectClass}
                >
                  <option value="" className="bg-[#0a1628]">{loadingMakes ? "Chargement…" : "Sélectionnez une marque"}</option>
                  {availableMakes.map((brand) => (
                    <option key={brand} value={brand} className="bg-[#0a1628]">{brand}</option>
                  ))}
                </select>
              </div>
              {!isException && (
              <div className="space-y-2">
                <label htmlFor="modele" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Modèle
                  {loadingModels && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
                  )}
                </label>
                <select
                  id="modele"
                  value={form.modele}
                  onChange={(e) => {
                    const v = e.target.value
                    cascadeGen.current += 1
                    setForm((prev) => ({
                      ...prev,
                      modele: v,
                      variante: "",
                      carburant: "",
                      transmission: "",
                      annee: "",
                      kilometrage: "",
                    }))
                  }}
                  required
                  disabled={!isMarqueDone}
                  className={selectClass}
                >
                  <option value="" className="bg-[#0a1628]">
                    {!isMarqueDone
                      ? "Choisissez d'abord une marque"
                      : loadingModels
                        ? "Chargement…"
                        : "Sélectionnez un modèle"}
                  </option>
                  {availableModels.map((model) => (
                    <option key={model} value={model} className="bg-[#0a1628]">{model}</option>
                  ))}
                </select>
              </div>
              )}
            </div>

            {isException && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-foreground">
                <p className="text-sm font-medium text-amber-200/90 mb-1">Concession spécialisée requise</p>
                <p className="text-sm text-muted-foreground">{MESSAGE_MARQUE_EXCEPTION}</p>
              </div>
            )}

            {!isException && (
            <>

            {showVariantField && (
              <div className="space-y-2">
                <label htmlFor="variante" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-primary" />
                  Variante / Finition
                  <span className="text-xs text-muted-foreground">(optionnel)</span>
                  {loadingVariant && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />}
                </label>
                <Input
                  id="variante"
                  name="variante"
                  placeholder={MANUAL_PLACEHOLDER}
                  value={form.variante}
                  onChange={(e) => {
                    cascadeGen.current += 1
                    setForm((prev) => ({
                      ...prev,
                      variante: e.target.value,
                      annee: "",
                      carburant: "",
                      transmission: "",
                      kilometrage: "",
                    }))
                    setFuelLocked(false)
                    setTransLocked(false)
                  }}
                  disabled={loadingVariant}
                  onBlur={() => {
                    if (!form.marque || !form.modele) return
                    const gen = ++cascadeGen.current
                    void loadYears(
                      {
                        marque: form.marque,
                        modele: form.modele,
                        variante: form.variante,
                      },
                      gen
                    )
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      ;(e.target as HTMLInputElement).blur()
                    }
                  }}
                  className="h-11 bg-background border-input focus:border-primary disabled:opacity-50"
                />
              </div>
            )}

            {/* Année + Kilométrage (avant carburant/transmission pour proposer les bons choix) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="annee" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Année
                  {(loadingVariant || loadingYear) && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
                  )}
                </label>
                {showYearFallbackInput ? (
                  <Input
                    id="annee"
                    name="annee"
                    type="number"
                    placeholder={MANUAL_PLACEHOLDER}
                    min={1980}
                    max={new Date().getFullYear()}
                    value={form.annee}
                    onChange={(e) => {
                      cascadeGen.current += 1
                      setForm((prev) => ({
                        ...prev,
                        annee: e.target.value,
                        carburant: "",
                        transmission: "",
                      }))
                      setFuelLocked(false)
                      setTransLocked(false)
                    }}
                    required
                    disabled={yearSelectDisabled}
                    className="h-11 bg-secondary/50 border-input focus:border-primary disabled:opacity-50"
                  />
                ) : (
                  <select
                    id="annee"
                    name="annee"
                    value={form.annee}
                    onChange={(e) => {
                      cascadeGen.current += 1
                      setForm((prev) => ({
                        ...prev,
                        annee: e.target.value,
                        carburant: "",
                        transmission: "",
                      }))
                      setFuelLocked(false)
                      setTransLocked(false)
                    }}
                    required
                    disabled={yearSelectDisabled || yearOptionsForSelect.length === 0}
                    className={selectClass}
                  >
                    <option value="" className="bg-[#0a1628]">
                      {loadingYear || loadingVariant
                        ? "Chargement…"
                        : yearOptionsForSelect.length > 0
                          ? "Sélectionnez l'année"
                          : "Aucune année disponible"}
                    </option>
                    {yearOptionsForSelect.map((year) => (
                      <option key={year} value={year} className="bg-[#0a1628]">
                        {year}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="kilometrage" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-primary" />
                  Kilométrage
                </label>
                <Input
                  id="kilometrage"
                  type="number"
                  placeholder="Ex: 85000"
                  min={0}
                  max={600000}
                  value={form.kilometrage}
                  onChange={(e) => updateField("kilometrage", e.target.value)}
                  required
                  disabled={!isAnneeDone}
                  className="h-11 bg-secondary/50 border-input focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Carburant + Transmission */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="carburant" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-primary" />
                  Carburant / Énergie
                  {loadingFuel && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />}
                </label>
                {fuelLocked ? (
                  <Input
                    readOnly
                    name="carburant"
                    id="carburant"
                    value={formatCarburantOptionLabel(form.carburant)}
                    className="h-11 bg-muted/50 border-input text-foreground"
                  />
                ) : fallbackFuel ? (
                  <Input
                    id="carburant"
                    name="carburant"
                    value={form.carburant}
                    onChange={(e) => {
                      cascadeGen.current += 1
                      setForm((prev) => ({
                        ...prev,
                        carburant: e.target.value,
                        transmission: "",
                      }))
                      setTransLocked(false)
                    }}
                    required
                    placeholder={MANUAL_PLACEHOLDER}
                    disabled={!isAnneeDone || loadingFuel}
                    className="h-11 bg-background border-input focus:border-primary disabled:opacity-50"
                  />
                ) : (
                  <select
                    id="carburant"
                    name="carburant"
                    value={form.carburant}
                    onChange={(e) => {
                      cascadeGen.current += 1
                      setForm((prev) => ({
                        ...prev,
                        carburant: e.target.value,
                        transmission: "",
                      }))
                      setTransLocked(false)
                    }}
                    required
                    disabled={!isAnneeDone || loadingFuel}
                    className={selectClass}
                  >
                    <option value="" className="bg-[#0a1628]">
                      {isAnneeDone ? (loadingFuel ? "Chargement…" : "Sélectionnez le carburant") : "Choisissez d'abord l'année"}
                    </option>
                    {fuelList.map((fuel) => (
                      <option key={fuel} value={fuel} className="bg-[#0a1628]">
                        {formatCarburantOptionLabel(fuel)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="transmission" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-primary" />
                  Transmission
                  {loadingTrans && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />}
                </label>
                {transLocked ? (
                  <Input
                    readOnly
                    name="transmission"
                    id="transmission"
                    value={form.transmission}
                    className="h-11 bg-muted/50 border-input text-foreground"
                  />
                ) : fallbackTrans ? (
                  <Input
                    id="transmission"
                    name="transmission"
                    value={form.transmission}
                    onChange={(e) => updateField("transmission", e.target.value)}
                    required
                    placeholder={MANUAL_PLACEHOLDER}
                    disabled={!isCarburantDone || loadingTrans}
                    className="h-11 bg-background border-input focus:border-primary disabled:opacity-50"
                  />
                ) : (
                  <select
                    id="transmission"
                    name="transmission"
                    value={form.transmission}
                    onChange={(e) => updateField("transmission", e.target.value)}
                    required
                    disabled={!isCarburantDone || loadingTrans}
                    className={selectClass}
                  >
                    <option value="" className="bg-[#0a1628]">
                      {isCarburantDone ? (loadingTrans ? "Chargement…" : "Sélectionnez la transmission") : "Choisissez d'abord le carburant"}
                    </option>
                    {transList.map((trans) => (
                      <option key={trans} value={trans} className="bg-[#0a1628]">
                        {trans}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Champs spécifiques Vente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="etat" className="text-sm font-medium text-foreground">État général</label>
                <select
                  id="etat"
                  value={form.etat}
                  onChange={(e) => updateField("etat", e.target.value)}
                  required
                  className={selectClass}
                >
                  <option value="" className="bg-[#0a1628]">Sélectionnez</option>
                  {etatOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#0a1628]">{opt}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="entretien" className="text-sm font-medium text-foreground">Historique d'entretien</label>
                <select
                  id="entretien"
                  value={form.entretien}
                  onChange={(e) => updateField("entretien", e.target.value)}
                  required
                  className={selectClass}
                >
                  <option value="" className="bg-[#0a1628]">Sélectionnez</option>
                  {entretienOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#0a1628]">{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="proprietaires" className="text-sm font-medium text-foreground">Nombre de propriétaires</label>
                <Input
                  id="proprietaires"
                  type="number"
                  min={1}
                  max={12}
                  value={form.proprietaires}
                  onChange={(e) => updateField("proprietaires", e.target.value)}
                  className="h-11 bg-background border-input"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="prixNeuf" className="text-sm font-medium text-foreground">Prix neuf (optionnel)</label>
                <Input
                  id="prixNeuf"
                  type="number"
                  min={1000}
                  max={500000}
                  value={form.prixNeuf}
                  onChange={(e) => updateField("prixNeuf", e.target.value)}
                  placeholder="Ex: 32900"
                  className="h-11 bg-background border-input"
                />
              </div>
            </div>

            {/* Photos du véhicule */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground text-left">Photos du véhicule</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={onPhotoChange}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoFiles.length >= MAX_PHOTOS}
                  className="gap-2"
                >
                  <ImagePlus className="h-4 w-4" />
                  {photoFiles.length >= MAX_PHOTOS
                    ? "Maximum atteint"
                    : "Ajouter des photos ou prendre une photo"}
                </Button>
                {photoFiles.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {photoFiles.length} / {MAX_PHOTOS} photo(s)
                  </span>
                )}
              </div>
              {photoError && (
                <p className="text-xs text-amber-600 dark:text-amber-400">{photoError}</p>
              )}
              {photoFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {photoPreviewUrls.map((url, i) => (
                    <div
                      key={i}
                      className="relative w-20 h-20 rounded-lg border border-input bg-muted/30 overflow-hidden"
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-foreground hover:bg-background"
                        aria-label="Supprimer la photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Le véhicule démarre / accidenté / CT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Le véhicule démarre</p>
                <div className="flex rounded-lg border border-input overflow-hidden">
                  <button
                    type="button"
                    onClick={() => updateField("demarre", true)}
                    className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${form.demarre ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                  >
                    Oui
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("demarre", false)}
                    className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${!form.demarre ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                  >
                    Non
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-3 rounded-lg border border-input bg-secondary/30 px-3 py-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.accidente}
                  onChange={(e) => updateField("accidente", e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Le véhicule est (ou a été) accidenté
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-input bg-secondary/30 px-3 py-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.controleTechnique}
                  onChange={(e) => updateField("controleTechnique", e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Contrôle technique récent OK
              </label>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/20 overflow-hidden">
              <button
                type="button"
                onClick={() => setExtraOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
              >
                <span>Informations complémentaires</span>
                {extraOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {extraOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-4 pt-1">
                  <div className="space-y-2">
                    <label htmlFor="cylindree-vente" className="text-xs font-medium text-muted-foreground">Cylindrée</label>
                    <Input
                      id="cylindree-vente"
                      placeholder="Ex: 1.6, 2.0 TDI"
                      value={form.cylindree}
                      onChange={(e) => updateField("cylindree", e.target.value)}
                      maxLength={80}
                      className="h-10 bg-background text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="puissance-vente" className="text-xs font-medium text-muted-foreground">Puissance</label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="puissance-vente"
                        type="text"
                        inputMode="numeric"
                        placeholder="Ex: 110"
                        value={form.puissance}
                        onChange={(e) => updateField("puissance", e.target.value.replace(/\D/g, ""))}
                        maxLength={6}
                        className="h-10 bg-background text-sm flex-1"
                      />
                      <div className="flex rounded-lg border border-input overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setPuissanceUnite("ch")}
                          className={`px-3 py-2 text-sm font-medium transition-colors ${puissanceUnite === "ch" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                        >
                          ch
                        </button>
                        <button
                          type="button"
                          onClick={() => setPuissanceUnite("kW")}
                          className={`px-3 py-2 text-sm font-medium transition-colors ${puissanceUnite === "kW" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                        >
                          kW
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="nombrePortes-vente" className="text-xs font-medium text-muted-foreground">Nombre de portes</label>
                    <Input
                      id="nombrePortes-vente"
                      type="text"
                      inputMode="numeric"
                      placeholder="Ex: 3, 5"
                      value={form.nombrePortes}
                      onChange={(e) => updateField("nombrePortes", e.target.value.replace(/\D/g, ""))}
                      maxLength={2}
                      className="h-10 bg-background text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="typeCarrosserie-vente" className="text-xs font-medium text-muted-foreground">Type de carrosserie</label>
                    <Input
                      id="typeCarrosserie-vente"
                      placeholder="Ex: Berline, SUV, Break"
                      value={form.typeCarrosserie}
                      onChange={(e) => updateField("typeCarrosserie", e.target.value)}
                      maxLength={80}
                      className="h-10 bg-background text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Description détaillée — envoyée à Claude */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                Description détaillée du véhicule
                <span className="text-xs text-muted-foreground">(optionnel)</span>
              </label>
              <textarea
                id="description"
                lang="fr"
                spellCheck
                placeholder="Décrivez les options, les éventuels défauts, l'état intérieur et extérieur, l'historique... Tout ce qui peut influencer la valeur de revente."
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-3 text-sm text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none placeholder:text-muted-foreground"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={!isReady || analyzeLoading}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
            >
              {analyzeLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyse en cours...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Obtenir une estimation
                </span>
              )}
            </Button>
            </>
            )}
          </form>

          {analyzeError && (
            <p className="mt-3 text-sm text-destructive">{analyzeError}</p>
          )}
        </CardContent>
      </Card>

      {submitted && estimate && !analyzeLoading && (
        <Card className="w-full max-w-2xl mx-auto border-primary/40 bg-gradient-to-b from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5 text-primary" />
              Prix de rachat (garage partenaire)
            </CardTitle>
            <CardDescription>
              Fourchette indicative de reprise par un garage partenaire (en dessous du marché, marge garage comprise).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Prix bas (rachat)</p>
                <p className="text-2xl font-bold text-foreground">{estimate.low.toLocaleString("fr-BE")} €</p>
              </div>
              <div className="rounded-lg border border-primary/40 bg-primary/10 p-4">
                <p className="text-xs uppercase tracking-wide text-primary">Prix conseillé (rachat)</p>
                <p className="text-3xl font-bold text-foreground">{estimate.mid.toLocaleString("fr-BE")} €</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Prix haut (rachat)</p>
                <p className="text-2xl font-bold text-foreground">{estimate.high.toLocaleString("fr-BE")} €</p>
              </div>
            </div>

            {analysis && (
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground space-y-2">
                <p className="flex items-center gap-2 text-foreground font-medium">
                  <Search className="h-4 w-4 text-primary" />
                  Analyse pour la reprise (garage partenaire)
                </p>
                <div className="whitespace-pre-wrap text-foreground/90">{analysis}</div>
              </div>
            )}

            <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground space-y-2">
              <p className="flex items-center gap-2 text-foreground font-medium">
                <CircleDollarSign className="h-4 w-4 text-primary" />
                Rachat par un garage partenaire
              </p>
              <p>
                Un garage partenaire peut proposer une reprise entre <span className="text-foreground font-semibold">{estimate.low.toLocaleString("fr-BE")} €</span> et <span className="text-foreground font-semibold">{estimate.high.toLocaleString("fr-BE")} €</span>, avec un prix cible autour de <span className="text-foreground font-semibold">{estimate.mid.toLocaleString("fr-BE")} €</span> (marge du garage incluse).
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Estimation indicative; une expertise physique du véhicule peut ajuster l’offre.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
