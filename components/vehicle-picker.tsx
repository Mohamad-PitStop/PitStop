"use client"

/**
 * VehiclePicker — composant de sélection de véhicule réutilisable.
 * Même logique de cascade que VehicleForm (Haiku API) mais sans le formulaire de diagnostic.
 * Champs obligatoires : marque + modèle. Tous les autres sont optionnels.
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslation } from "@/lib/i18n/locale-context"
import { Input } from "@/components/ui/input"
import {
  Search,
  Car,
  Calendar,
  Gauge,
  FileText,
  Fuel,
  Settings2,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
} from "lucide-react"
import { getAvailableYearsForModel } from "@/lib/vehicle-year-catalog"
import { carBrands, carModels } from "@/lib/vehicle-model-catalog"
import {
  getAvailableFuelTypesForSelection,
  getAvailableTransmissionTypesForSelection,
} from "@/lib/vehicle-compatibility-catalog"
import { useCarsApi } from "@/hooks/use-cars-api"
import { isExceptionBrand } from "@/lib/exception-brands"
import { formatCarburantOptionLabel } from "@/lib/format-carburant-label"
import { formatTransmissionOptionLabel } from "@/lib/format-transmission-label"
import { dedupeModelsByVariantBase, filterFrenchModelLabels } from "@/lib/merge-verified-models"
import { postVehicleOptions } from "@/lib/vehicle-options-client"

export type VehiclePickerData = {
  marque: string
  modele: string
  variante: string
  carburant: string
  transmission: string
  annee: string
  kilometrage: string
  cylindree: string
  puissance: string
  nombrePortes: string
  typeCarrosserie: string
  typeBoiteAuto: string
}

function sortYearsDesc(years: string[]): string[] {
  return [...years].sort((a, b) => Number(b) - Number(a))
}

const EMPTY: VehiclePickerData = {
  marque: "", modele: "", variante: "", carburant: "", transmission: "", annee: "", kilometrage: "",
  cylindree: "", puissance: "", nombrePortes: "", typeCarrosserie: "", typeBoiteAuto: "",
}

export function VehiclePicker({
  onChange,
  initialData,
}: {
  onChange: (data: VehiclePickerData) => void
  initialData?: VehiclePickerData
}) {
  const { t } = useTranslation()
  const { makes: apiMakes, models: apiModels, loadingMakes, loadingModels, fetchModels } = useCarsApi()

  const [data, setData] = useState<VehiclePickerData>(() => initialData ?? EMPTY)

  const [variantList, setVariantList] = useState<string[]>([])
  const [yearList, setYearList] = useState<string[]>(() => initialData?.annee ? [initialData.annee] : [])
  const [fuelList, setFuelList] = useState<string[]>(() => initialData?.carburant ? [initialData.carburant] : [])
  const [transList, setTransList] = useState<string[]>(() => initialData?.transmission ? [initialData.transmission] : [])

  const [loadingVariant, setLoadingVariant] = useState(false)
  const [loadingYear, setLoadingYear] = useState(false)
  const [loadingFuel, setLoadingFuel] = useState(false)
  const [loadingTrans, setLoadingTrans] = useState(false)

  const [fallbackFuel, setFallbackFuel] = useState(false)
  const [fallbackTrans, setFallbackTrans] = useState(false)
  const [variantUiSkipped, setVariantUiSkipped] = useState(true)
  const [fuelLocked, setFuelLocked] = useState(() => !!initialData?.carburant)
  const [transLocked, setTransLocked] = useState(() => !!initialData?.transmission)

  const [hasMultipleAutoTypes, setHasMultipleAutoTypes] = useState(false)
  const [extraOpen, setExtraOpen] = useState(() =>
    !!(initialData?.cylindree || initialData?.puissance || initialData?.nombrePortes || initialData?.typeCarrosserie || initialData?.typeBoiteAuto)
  )
  const [puissanceUnite, setPuissanceUnite] = useState<"ch" | "kW">("ch")

  // Empêcher la cascade API au montage si des données initiales sont déjà présentes
  const skipCascadeRef = useRef(!!initialData?.marque)
  useEffect(() => {
    if (skipCascadeRef.current) {
      const id = setTimeout(() => { skipCascadeRef.current = false }, 0)
      return () => clearTimeout(id)
    }
  }, [])

  const [marqueOpen, setMarqueOpen] = useState(false)
  const [marqueSearch, setMarqueSearch] = useState("")
  const marqueRef = useRef<HTMLDivElement>(null)
  const marqueSearchRef = useRef<HTMLInputElement>(null)

  const [manualModelEntry, setManualModelEntry] = useState(false)
  const [modelDraft, setModelDraft] = useState("")

  const cascadeGen = useRef(0)

  const isMarqueDone = !!data.marque
  const isModeleDone = isMarqueDone && !!data.modele
  const isAnneeDone = isModeleDone && !!data.annee
  const isCarburantDone = isAnneeDone && (!!data.carburant || fuelLocked)
  const isTransmissionDone = isCarburantDone && (!!data.transmission || transLocked)
  const isKilometrageDone = isTransmissionDone && !!data.kilometrage

  const showVariantField = isModeleDone
  const isException = isExceptionBrand(data.marque)

  // Notify parent on every change
  useEffect(() => { onChange(data) }, [data, onChange])

  // Fetch models when brand changes
  useEffect(() => { fetchModels(data.marque) }, [data.marque, fetchModels])

  // Open marque dropdown → focus search
  useEffect(() => {
    if (marqueOpen) {
      const t = setTimeout(() => marqueSearchRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
  }, [marqueOpen])

  // Click-outside to close marque dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (marqueRef.current && !marqueRef.current.contains(e.target as Node)) {
        setMarqueOpen(false)
        setMarqueSearch("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const loadYears = useCallback(
    async (ctx: { marque: string; modele: string; variante: string }, gen: number) => {
      setLoadingYear(true)
      try {
        const r = await postVehicleOptions({ marque: ctx.marque, modele: ctx.modele, variante: ctx.variante })
        if (gen !== cascadeGen.current) return
        if (r.error) {
          setYearList(sortYearsDesc(getAvailableYearsForModel(ctx.marque, ctx.modele, "", "")))
          return
        }
        const opts = sortYearsDesc(r.options)
        setYearList(opts)
        if (opts.length === 1) setData((prev) => ({ ...prev, annee: opts[0] }))
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
        const r = await postVehicleOptions({ marque: ctx.marque, modele: ctx.modele, variante: ctx.variante, annee: ctx.annee })
        if (gen !== cascadeGen.current) return
        if (r.error) {
          setFallbackFuel(true)
          setFuelList(getAvailableFuelTypesForSelection(ctx.marque, ctx.modele))
          return
        }
        setFuelList(r.options)
        if (r.options.length === 1) {
          setData((prev) => ({ ...prev, carburant: r.options[0] }))
          setFuelLocked(true)
        }
      } finally {
        if (gen === cascadeGen.current) setLoadingFuel(false)
      }
    },
    []
  )

  const loadTransmissions = useCallback(
    async (ctx: { marque: string; modele: string; variante: string; annee: string; carburant: string }, gen: number) => {
      setLoadingTrans(true)
      setFallbackTrans(false)
      setTransLocked(false)
      try {
        const r = await postVehicleOptions({ marque: ctx.marque, modele: ctx.modele, variante: ctx.variante, annee: ctx.annee, carburant: ctx.carburant })
        if (gen !== cascadeGen.current) return
        if (r.error) {
          setFallbackTrans(true)
          setTransList(getAvailableTransmissionTypesForSelection(ctx.marque, ctx.modele, ctx.carburant))
          return
        }
        setTransList(r.options)
        setHasMultipleAutoTypes(r.hasMultipleAutoTypes ?? false)
        if (r.options.length === 1) {
          setData((prev) => ({ ...prev, transmission: r.options[0] }))
          setTransLocked(true)
        }
      } finally {
        if (gen === cascadeGen.current) setLoadingTrans(false)
      }
    },
    []
  )

  // Modele → cascade
  useEffect(() => {
    if (skipCascadeRef.current) return
    if (!data.marque || !data.modele || isExceptionBrand(data.marque)) {
      setVariantList([]); setYearList([]); setFuelList([]); setTransList([])
      return
    }
    const gen = ++cascadeGen.current
    let cancelled = false
    ;(async () => {
      setLoadingVariant(true)
      setVariantUiSkipped(true)
      setData((prev) => ({ ...prev, variante: "", annee: "", carburant: "", transmission: "", kilometrage: "", cylindree: "", puissance: "", nombrePortes: "", typeCarrosserie: "", typeBoiteAuto: "" }))
      setFuelLocked(false); setTransLocked(false); setHasMultipleAutoTypes(false)

      const r = await postVehicleOptions({ marque: data.marque, modele: data.modele })
      if (cancelled || gen !== cascadeGen.current) return
      setLoadingVariant(false)

      if (r.error || r.options.length === 0) {
        setVariantUiSkipped(true)
        await loadYears({ marque: data.marque, modele: data.modele, variante: "" }, gen)
        return
      }
      if (r.options.length === 1) {
        setVariantUiSkipped(true)
        const v = r.options[0]
        setData((prev) => ({ ...prev, variante: v }))
        await loadYears({ marque: data.marque, modele: data.modele, variante: v }, gen)
        return
      }
      setVariantList(r.options)
      setVariantUiSkipped(false)
      await loadYears({ marque: data.marque, modele: data.modele, variante: "" }, gen)
    })()
    return () => { cancelled = true }
  }, [data.marque, data.modele, loadYears])

  // Annee → carburants
  useEffect(() => {
    if (skipCascadeRef.current) return
    if (!data.annee?.trim() || !isModeleDone) return
    const gen = ++cascadeGen.current
    void loadFuels({ marque: data.marque, modele: data.modele, variante: data.variante, annee: data.annee }, gen)
  }, [data.annee, data.marque, data.modele, data.variante, isModeleDone, loadFuels])

  // Carburant → transmissions
  useEffect(() => {
    if (skipCascadeRef.current) return
    if (!data.carburant?.trim() || !data.annee?.trim() || !isModeleDone) return
    const gen = ++cascadeGen.current
    void loadTransmissions({ marque: data.marque, modele: data.modele, variante: data.variante, annee: data.annee, carburant: data.carburant }, gen)
  }, [data.carburant, data.annee, data.marque, data.modele, data.variante, isModeleDone, loadTransmissions])

  const handleMarqueSelect = (value: string) => {
    cascadeGen.current += 1
    setData({ ...EMPTY, marque: value })
    setVariantList([]); setYearList([]); setFuelList([]); setTransList([])
    setFallbackFuel(false); setFallbackTrans(false)
    setFuelLocked(false); setTransLocked(false)
    setHasMultipleAutoTypes(false)
    setManualModelEntry(false); setModelDraft("")
    setMarqueOpen(false); setMarqueSearch("")
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === "modele") {
      setManualModelEntry(false)
      cascadeGen.current += 1
      setData((prev) => ({ ...prev, modele: value, variante: "", carburant: "", transmission: "", annee: "", kilometrage: "" }))
      return
    }
    if (name === "variante") {
      cascadeGen.current += 1
      setData((prev) => ({ ...prev, variante: value, annee: "", carburant: "", transmission: "", kilometrage: "" }))
      setFuelLocked(false); setTransLocked(false)
      return
    }
    if (name === "annee") {
      cascadeGen.current += 1
      setData((prev) => ({ ...prev, annee: value, carburant: "", transmission: "" }))
      setFuelLocked(false); setTransLocked(false)
      return
    }
    if (name === "carburant") {
      cascadeGen.current += 1
      setData((prev) => ({ ...prev, carburant: value, transmission: "" }))
      setTransLocked(false)
      return
    }
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const commitManualModel = () => {
    if (!manualModelEntry) return
    const v = modelDraft.trim()
    if (!v || v === data.modele) return
    cascadeGen.current += 1
    setData((prev) => ({ ...prev, modele: v, variante: "", carburant: "", transmission: "", annee: "", kilometrage: "" }))
    setModelDraft(v)
  }

  // Auto-ouvrir le volet si plusieurs types de boîte auto
  useEffect(() => {
    if (hasMultipleAutoTypes && data.transmission === "Automatique") {
      setExtraOpen(true)
    }
  }, [hasMultipleAutoTypes, data.transmission])

  const baseModels = apiModels.length > 0 ? apiModels : (carModels[data.marque] ?? [])
  const availableMakes = apiMakes.length > 0 ? apiMakes : carBrands
  const availableModels = dedupeModelsByVariantBase(filterFrenchModelLabels(baseModels))
  const yearSelectDisabled = !isModeleDone || loadingVariant || loadingYear

  return (
    <div className="space-y-4">
      {/* Marque */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Car className="h-4 w-4 text-primary" />
            {t("vehicleForm.labelMarque")}
          </label>
          <div ref={marqueRef} className="relative">
            <button
              type="button"
              onClick={() => setMarqueOpen((o) => !o)}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 flex items-center justify-between gap-2"
            >
              <span className={data.marque ? "text-foreground" : "text-muted-foreground"}>
                {data.marque || (loadingMakes ? t("common.loading") : t("vehicleForm.selectMarque"))}
              </span>
              {data.marque ? (
                <X
                  className="h-3.5 w-3.5 text-muted-foreground shrink-0 hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); handleMarqueSelect(""); setTimeout(() => setMarqueOpen(true), 0) }}
                />
              ) : (
                <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${marqueOpen ? "rotate-180" : ""}`} />
              )}
            </button>

            {marqueOpen && (
              <div className="absolute z-[200] mt-1 w-full rounded-lg border border-border bg-background shadow-lg">
                <div className="border-b border-border p-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      ref={marqueSearchRef}
                      type="text"
                      value={marqueSearch}
                      onChange={(e) => setMarqueSearch(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Escape") { setMarqueOpen(false); setMarqueSearch("") } }}
                      placeholder={t("vehicleForm.searchMarquePlaceholder")}
                      className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto py-1">
                  {(() => {
                    const filtered = availableMakes.filter((b) => b.toLowerCase().includes(marqueSearch.toLowerCase()))
                    return filtered.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-muted-foreground">{t("vehicleForm.noResults")}</p>
                    ) : filtered.map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleMarqueSelect(brand)}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-primary/10 ${data.marque === brand ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                      >
                        {brand}
                      </button>
                    ))
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modèle */}
        {!isException && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {t("vehicleForm.labelModele")}
              {loadingModels && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </label>
            {manualModelEntry ? (
              <div className="space-y-1.5">
                <Input
                  value={modelDraft}
                  onChange={(e) => setModelDraft(e.target.value)}
                  onBlur={() => commitManualModel()}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur() } }}
                  placeholder={t("vehicleForm.modelManualPlaceholder")}
                  disabled={!isMarqueDone}
                  className="h-11 bg-background border-input focus:border-primary disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => {
                    cascadeGen.current += 1
                    setManualModelEntry(false); setModelDraft("")
                    setData((prev) => ({ ...prev, modele: "", variante: "", carburant: "", transmission: "", annee: "", kilometrage: "" }))
                    setVariantList([]); setYearList([]); setFuelList([]); setTransList([])
                    setFuelLocked(false); setTransLocked(false)
                  }}
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground/80 text-left cursor-pointer bg-transparent border-0 p-0"
                >
                  {t("vehicleForm.backToList")}
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <select
                  name="modele"
                  value={data.modele}
                  onChange={handleChange}
                  disabled={!isMarqueDone}
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-[#0a1628] [&>option]:text-foreground"
                >
                  <option value="">
                    {!isMarqueDone ? t("vehicleForm.chooseMarqueFirst") : loadingModels ? t("common.loading") : t("vehicleForm.selectModele")}
                  </option>
                  {availableModels.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
                {isMarqueDone && !loadingModels && (
                  <button
                    type="button"
                    onClick={() => { setManualModelEntry(true); setModelDraft(data.modele) }}
                    className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground/80 text-left cursor-pointer bg-transparent border-0 p-0"
                  >
                    {t("vehicleForm.modelNotListed")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {isException && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 animate-in fade-in duration-300">
          <p className="text-sm font-medium text-amber-200/90 mb-1">{t("exceptionBrand.title")}</p>
          <p className="text-sm text-muted-foreground">{t("exceptionBrand.message")}</p>
        </div>
      )}

      {!isException && (
        <>
          {/* Variante */}
          {showVariantField && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                {t("vehicleForm.labelVariante")}
                <span className="text-xs text-muted-foreground">{t("vehicleForm.optional")}</span>
              </label>
              <Input
                name="variante"
                placeholder={t("vehicleForm.variantePh")}
                value={data.variante}
                onChange={handleChange}
                maxLength={100}
                className="h-11 bg-background border-input focus:border-primary"
              />
            </div>
          )}

          {/* Année + Km */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                {t("vehicleForm.labelAnnee")}
                {(loadingVariant || loadingYear) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </label>
              <select
                name="annee"
                value={data.annee}
                onChange={handleChange}
                disabled={yearSelectDisabled || yearList.length === 0}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-[#0a1628] [&>option]:text-foreground"
              >
                <option value="">
                  {loadingYear || loadingVariant ? t("common.loading") : yearList.length > 0 ? t("vehicleForm.selectYear") : t("vehicleForm.noYearAvailable")}
                </option>
                {yearList.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Gauge className="h-4 w-4 text-primary" />
                {t("vehicleForm.labelKm")}
              </label>
              <Input
                name="kilometrage"
                type="number"
                placeholder={t("vehicleForm.kmPh")}
                min="0"
                max="2000000"
                value={data.kilometrage}
                onChange={handleChange}
                disabled={!isAnneeDone}
                className="h-11 bg-secondary/50 border-input focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Carburant + Transmission */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-200 ${loadingFuel || loadingTrans ? "opacity-60 pointer-events-none" : ""}`}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Fuel className="h-4 w-4 text-primary" />
                {t("vehicleForm.labelFuel")}
                {loadingFuel && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </label>
              {fuelLocked ? (
                <Input readOnly value={formatCarburantOptionLabel(data.carburant, t)} className="h-11 bg-muted/50 border-input text-foreground" />
              ) : fallbackFuel ? (
                <Input
                  name="carburant"
                  value={data.carburant}
                  onChange={handleChange}
                  placeholder={t("vehicleForm.manualPlaceholder")}
                  disabled={!isAnneeDone || loadingFuel}
                  className="h-11 bg-background border-input focus:border-primary disabled:opacity-50"
                />
              ) : (
                <select
                  name="carburant"
                  value={data.carburant}
                  onChange={handleChange}
                  disabled={!isAnneeDone || loadingFuel}
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-[#0a1628] [&>option]:text-foreground"
                >
                  <option value="">{isAnneeDone ? (loadingFuel ? t("common.loading") : t("vehicleForm.selectFuel")) : t("vehicleForm.chooseYearFirst")}</option>
                  {fuelList.map((fuel) => <option key={fuel} value={fuel}>{formatCarburantOptionLabel(fuel, t)}</option>)}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                {t("vehicleForm.labelTrans")}
                {loadingTrans && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </label>
              {transLocked ? (
                <Input readOnly value={formatTransmissionOptionLabel(data.transmission, t)} className="h-11 bg-muted/50 border-input text-foreground" />
              ) : fallbackTrans ? (
                <Input
                  name="transmission"
                  value={data.transmission}
                  onChange={handleChange}
                  placeholder={t("vehicleForm.manualPlaceholder")}
                  disabled={!isCarburantDone || loadingTrans}
                  className="h-11 bg-background border-input focus:border-primary disabled:opacity-50"
                />
              ) : (
                <select
                  name="transmission"
                  value={data.transmission}
                  onChange={handleChange}
                  disabled={!isCarburantDone || loadingTrans}
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-[#0a1628] [&>option]:text-foreground"
                >
                  <option value="">{isCarburantDone ? (loadingTrans ? t("common.loading") : t("vehicleForm.selectTrans")) : t("vehicleForm.chooseFuelFirst")}</option>
                  {transList.map((trans) => <option key={trans} value={trans}>{formatTransmissionOptionLabel(trans, t)}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Informations complémentaires */}
          <div className="rounded-lg border border-border/60 bg-muted/20 overflow-hidden">
            <button
              type="button"
              onClick={() => setExtraOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
            >
              <span>{t("vehicleForm.extraTitle")}</span>
              {extraOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {extraOpen && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-4 pt-1">
                {hasMultipleAutoTypes && data.transmission === "Automatique" && (
                  <div className="md:col-span-2 space-y-1.5 rounded-lg border border-primary/20 bg-primary/5 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Settings2 className="h-3.5 w-3.5 text-primary" />
                      {t("vehicleForm.typeBoiteLabel")}
                      <span className="text-muted-foreground">{t("vehicleForm.optional")}</span>
                    </label>
                    <Input
                      name="typeBoiteAuto"
                      placeholder={t("vehicleForm.typeBoitePh")}
                      value={data.typeBoiteAuto}
                      onChange={handleChange}
                      maxLength={100}
                      disabled={!isKilometrageDone}
                      className="h-10 bg-background text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground">{t("vehicleForm.typeBoiteHint")}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t("vehicleForm.cylindree")}</label>
                  <Input
                    name="cylindree"
                    placeholder={t("vehicleForm.cylindreePh")}
                    value={data.cylindree}
                    onChange={handleChange}
                    maxLength={80}
                    className="h-10 bg-background text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t("vehicleForm.puissance")}</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      name="puissance"
                      type="text"
                      inputMode="numeric"
                      placeholder={t("vehicleForm.puissancePh")}
                      value={data.puissance}
                      onChange={handleChange}
                      maxLength={10}
                      className="h-10 bg-background text-sm flex-1"
                    />
                    <div className="flex rounded-lg border border-input overflow-hidden shrink-0">
                      {(["ch", "kW"] as const).map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setPuissanceUnite(u)}
                          className={`px-2.5 h-10 text-xs font-medium transition-colors ${puissanceUnite === u ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t("vehicleForm.portes")}</label>
                  <Input
                    name="nombrePortes"
                    type="number"
                    min="2"
                    max="6"
                    placeholder={t("vehicleForm.portesPh")}
                    value={data.nombrePortes}
                    onChange={handleChange}
                    className="h-10 bg-background text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t("vehicleForm.carrosserie")}</label>
                  <Input
                    name="typeCarrosserie"
                    placeholder={t("vehicleForm.carrosseriePh")}
                    value={data.typeCarrosserie}
                    onChange={handleChange}
                    maxLength={80}
                    className="h-10 bg-background text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
