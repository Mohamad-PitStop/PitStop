"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslation } from "@/lib/i18n/locale-context"
import { flushSync } from "react-dom"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Car, Calendar, Gauge, FileText, Fuel, Settings2, ChevronDown, ChevronUp, Loader2, X, Mic, RefreshCw, Send } from "lucide-react"
import { getAvailableYearsForModel } from "@/lib/vehicle-year-catalog"
import { carBrands, carModels } from "@/lib/vehicle-model-catalog"
import {
  getAvailableFuelTypesForSelection,
  getAvailableTransmissionTypesForSelection,
} from "@/lib/vehicle-compatibility-catalog"
import { useCarsApi } from "@/hooks/use-cars-api"
import { isExceptionBrand } from "@/lib/exception-brands"
import { formatCarburantOptionLabel } from "@/lib/format-carburant-label"
import { dedupeModelsByVariantBase, filterFrenchModelLabels } from "@/lib/merge-verified-models"
import { postVehicleOptions } from "@/lib/vehicle-options-client"
import { DiagnosticLoader } from "@/components/diagnostic-loader"
import { CREDIT_PURCHASES_ENABLED } from "@/lib/feature-flags"
import { buildLoginUrl } from "@/lib/login-redirect"
import { SS_GUEST_ACTIVE, SS_GUEST_DIAG_ID } from "@/lib/guest-diagnostic"

function sortYearsDesc(years: string[]): string[] {
  return [...years].sort((a, b) => Number(b) - Number(a))
}

export function VehicleForm({ guestDiagnosticSession = false }: { guestDiagnosticSession?: boolean }) {
  const router = useRouter()
  const { t, locale } = useTranslation()
  const { makes: apiMakes, models: apiModels, loadingMakes, loadingModels, fetchModels } = useCarsApi()

  const [formData, setFormData] = useState({
    marque: "",
    modele: "",
    variante: "",
    carburant: "",
    transmission: "",
    annee: "",
    kilometrage: "",
    probleme: "",
    cylindree: "",
    puissance: "",
    nombrePortes: "",
    typeCarrosserie: "",
    typeBoiteAuto: "",
  })

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
  const [hasMultipleAutoTypes, setHasMultipleAutoTypes] = useState(false)

  const [extraOpen, setExtraOpen] = useState(false)
  const [puissanceUnite, setPuissanceUnite] = useState<"ch" | "kW">("ch")
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authUser, setAuthUser] = useState<{ id: string; email: string; name: string; role: string; diagnosticCredits: number } | null>(null)
  const [authSessionReady, setAuthSessionReady] = useState(false)

  // ── Reconnaissance vocale ────────────────────────────────────────────────────
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState("")
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  function launchRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    const recognition = new SpeechRecognition()
    recognition.lang = locale === "nl" ? "nl-BE" : locale === "en" ? "en-GB" : "fr-BE"
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event: any) => {
      let finalText = ""
      let interim = ""
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript + " "
        } else {
          interim += event.results[i][0].transcript
        }
      }
      setVoiceTranscript((finalText + interim).trimStart())
    }
    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setVoiceError(t("vehicleForm.voiceMicDenied"))
      } else if (event.error === "no-speech") {
        setVoiceError(t("vehicleForm.voiceNoSpeech"))
      } else {
        setVoiceError(t("vehicleForm.voiceErrorPrefix", { error: String(event.error) }))
      }
      setIsListening(false)
    }
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  async function startVoiceRecording() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    setIsVoiceActive(true)
    setVoiceTranscript("")
    setVoiceError(null)
    setIsListening(false)

    if (!SpeechRecognition) {
      setVoiceError(t("vehicleForm.voiceBrowserUnsupported"))
      return
    }

    // Demande explicite de permission micro : force le popup natif du navigateur
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop()) // libère le flux, la reconnaissance gérera le sien
    } catch (err: any) {
      const name = err?.name ?? ""
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setVoiceError("BLOCKED")
      } else if (name === "NotFoundError") {
        setVoiceError(t("vehicleForm.voiceNoMic"))
      } else {
        setVoiceError(t("vehicleForm.voiceMicGeneric"))
      }
      return
    }

    launchRecognition()
  }

  function retryVoiceRecording() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setVoiceTranscript("")
    setVoiceError(null)
    setIsListening(false)
    launchRecognition()
  }

  function sendVoiceTranscript() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
    setIsVoiceActive(false)
    const text = voiceTranscript.trim()
    if (text) {
      setFormData((prev) => ({ ...prev, probleme: text }))
    }
    setVoiceTranscript("")
    setVoiceError(null)
  }

  function cancelVoiceRecording() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
    setIsVoiceActive(false)
    setVoiceTranscript("")
    setVoiceError(null)
  }

  const cascadeGen = useRef(0)

  // ── Combobox marque ─────────────────────────────────────────────────────────
  const [marqueOpen, setMarqueOpen] = useState(false)
  const [marqueSearch, setMarqueSearch] = useState("")
  const marqueRef = useRef<HTMLDivElement>(null)
  const marqueSearchRef = useRef<HTMLInputElement>(null)

  /** Saisie libre volontaire (lien « Mon modèle n'apparaît pas ? »), distinct du fallback API */
  const [manualModelEntry, setManualModelEntry] = useState(false)
  const [modelDraft, setModelDraft] = useState("")

  const isMarqueDone = !!formData.marque
  const isModeleDone = isMarqueDone && !!formData.modele
  const isAnneeDone = isModeleDone && !!formData.annee
  const isCarburantDone = isAnneeDone && (!!formData.carburant || fuelLocked)
  const isTransmissionDone = isCarburantDone && (!!formData.transmission || transLocked)
  const isKilometrageDone = isTransmissionDone && !!formData.kilometrage

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
          setFormData((prev) => ({ ...prev, annee: opts[0] }))
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
          setFormData((prev) => ({ ...prev, carburant: r.options[0] }))
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
        setHasMultipleAutoTypes(r.hasMultipleAutoTypes ?? false)
        if (r.options.length === 1) {
          setFormData((prev) => ({ ...prev, transmission: r.options[0] }))
          setTransLocked(true)
        }
      } finally {
        if (gen === cascadeGen.current) setLoadingTrans(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchModels(formData.marque)
  }, [formData.marque, fetchModels])

  /** Dès le modèle : variantes puis chaîne années */
  useEffect(() => {
    if (!formData.marque || !formData.modele || isExceptionBrand(formData.marque)) {
      setVariantList([])
      setYearList([])
      setFuelList([])
      setTransList([])
      return
    }

    const gen = ++cascadeGen.current
    let cancelled = false

    ;(async () => {
      setLoadingVariant(true)
      setFallbackVariant(false)
      setVariantUiSkipped(true)
      setFormData((prev) => ({
        ...prev,
        variante: "",
        annee: "",
        carburant: "",
        transmission: "",
        kilometrage: "",
        probleme: "",
        typeBoiteAuto: "",
      }))
      setFuelLocked(false)
      setTransLocked(false)
      setHasMultipleAutoTypes(false)

      const r = await postVehicleOptions({
        marque: formData.marque,
        modele: formData.modele,
      })

      if (cancelled || gen !== cascadeGen.current) return
      setLoadingVariant(false)

      if (r.error) {
        console.error("variantes: saisie manuelle")
        setFallbackVariant(true)
        setVariantUiSkipped(false)
        setVariantList([])
        return
      }

      if (r.options.length === 0) {
        setVariantUiSkipped(true)
        setFormData((prev) => ({ ...prev, variante: "" }))
        await loadYears({ marque: formData.marque, modele: formData.modele, variante: "" }, gen)
        return
      }

      if (r.options.length === 1) {
        setVariantUiSkipped(true)
        const v = r.options[0]
        setFormData((prev) => ({ ...prev, variante: v }))
        await loadYears({ marque: formData.marque, modele: formData.modele, variante: v }, gen)
        return
      }

      setVariantList(r.options)
      setVariantUiSkipped(false)
      setFormData((prev) => ({ ...prev, variante: "" }))
      await loadYears({ marque: formData.marque, modele: formData.modele, variante: "" }, gen)
    })()

    return () => {
      cancelled = true
    }
  }, [formData.marque, formData.modele, loadYears])

  /** Année → carburants */
  useEffect(() => {
    if (!formData.annee?.trim() || !isModeleDone) return
    const gen = ++cascadeGen.current
    void loadFuels(
      {
        marque: formData.marque,
        modele: formData.modele,
        variante: formData.variante,
        annee: formData.annee,
      },
      gen
    )
  }, [formData.annee, formData.marque, formData.modele, formData.variante, isModeleDone, loadFuels])

  /** Carburant → transmissions */
  useEffect(() => {
    if (!formData.carburant?.trim() || !formData.annee?.trim() || !isModeleDone) return
    const gen = ++cascadeGen.current
    void loadTransmissions(
      {
        marque: formData.marque,
        modele: formData.modele,
        variante: formData.variante,
        annee: formData.annee,
        carburant: formData.carburant,
      },
      gen
    )
  }, [formData.carburant, formData.annee, formData.marque, formData.modele, formData.variante, isModeleDone, loadTransmissions])

  const applyModeleValue = (value: string) => {
    cascadeGen.current += 1
    setFormData((prev) => ({
      ...prev,
      modele: value,
      variante: "",
      carburant: "",
      transmission: "",
      annee: "",
      kilometrage: "",
      probleme: "",
    }))
  }

  const commitManualModel = () => {
    if (!manualModelEntry) return
    const v = modelDraft.trim()
    if (!v) return
    if (v === (formData.modele || "").trim()) return
    applyModeleValue(v)
    setModelDraft(v)
  }

  const backToModelList = () => {
    cascadeGen.current += 1
    setManualModelEntry(false)
    setModelDraft("")
    setFormData((prev) => ({
      ...prev,
      modele: "",
      variante: "",
      carburant: "",
      transmission: "",
      annee: "",
      kilometrage: "",
      probleme: "",
    }))
    setVariantList([])
    setYearList([])
    setFuelList([])
    setTransList([])
    setFuelLocked(false)
    setTransLocked(false)
  }

  const openAuthDialog = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    if (isExceptionBrand(formData.marque)) return

    if (manualModelEntry) {
      const v = modelDraft.trim()
      if (!v) {
        setAuthError(t("vehicleForm.errModelOrList"))
        return
      }
      if (v !== (formData.modele || "").trim()) {
        flushSync(() => {
          applyModeleValue(v)
        })
        setModelDraft(v)
      }
    }

    // ── Validation de tous les champs ───────────────────────────────────────
    if (!formData.marque.trim()) {
      setAuthError(t("vehicleForm.errMarque"))
      return
    }
    if (!formData.modele.trim()) {
      setAuthError(t("vehicleForm.errModele"))
      return
    }
    if (!formData.annee.trim()) {
      setAuthError(t("vehicleForm.errAnnee"))
      return
    }
    const anneeRaw = parseInt(formData.annee, 10)
    const currentYear = new Date().getFullYear()
    if (isNaN(anneeRaw) || anneeRaw < 1900 || anneeRaw > currentYear) {
      setAuthError(t("vehicleForm.yearInvalid", { max: currentYear }))
      return
    }
    if (!fuelLocked && !formData.carburant.trim()) {
      setAuthError(t("vehicleForm.errFuel"))
      return
    }
    if (!transLocked && !formData.transmission.trim()) {
      setAuthError(t("vehicleForm.errTrans"))
      return
    }
    const kmRaw = parseInt(formData.kilometrage, 10)
    if (!formData.kilometrage.trim() || isNaN(kmRaw) || kmRaw < 0) {
      setAuthError(t("vehicleForm.errKm"))
      return
    }
    if (kmRaw > 2_000_000) {
      setAuthError(t("vehicleForm.errKmMax"))
      return
    }
    if (!formData.probleme.trim()) {
      setAuthError(t("vehicleForm.errProbleme"))
      return
    }
    if (formData.probleme.trim().length < 10) {
      setAuthError(t("vehicleForm.errProblemeShort"))
      return
    }

    const MAX_EXTRA = 80
    const trim = (s: string) => (s || "").trim()
    const cylindree = trim(formData.cylindree)
    const puissanceVal = trim(formData.puissance)
    const puissance = puissanceVal ? `${puissanceVal} ${puissanceUnite}` : ""
    const nombrePortes = trim(formData.nombrePortes)
    const typeCarrosserie = trim(formData.typeCarrosserie)
    if (cylindree.length > MAX_EXTRA || (puissanceVal && puissance.length > MAX_EXTRA) || nombrePortes.length > MAX_EXTRA || typeCarrosserie.length > MAX_EXTRA) {
      setAuthError(t("vehicleForm.errExtraMax"))
      return
    }
    if (nombrePortes.length > 0) {
      const onlyNum = /^\d+$/.test(nombrePortes)
      const num = parseInt(nombrePortes, 10)
      if (onlyNum && (Number.isNaN(num) || num < 2 || num > 6)) {
        setAuthError(t("vehicleForm.errPortes"))
        return
      }
    }

    if (authUser) {
      const isPrivileged = authUser.role === "admin" || authUser.role === "tester"
      if (isPrivileged || authUser.diagnosticCredits > 0) {
        void runDiagnostic()
        return
      }
      if (CREDIT_PURCHASES_ENABLED) {
        router.push("/credits")
      } else {
        router.push("/merci?from=diagnostic")
      }
      return
    }

    if (guestDiagnosticSession) {
      void runDiagnostic()
      return
    }

    router.replace(buildLoginUrl("/diagnostic", { reason: "diagnostic" }))
  }

  // Fermer le combobox marque si clic en dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (marqueRef.current && !marqueRef.current.contains(e.target as Node)) {
        setMarqueOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Focus automatique sur la barre de recherche quand le combobox s'ouvre
  useEffect(() => {
    if (marqueOpen) {
      // Délai minimal pour que le DOM soit rendu
      const t = setTimeout(() => marqueSearchRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
  }, [marqueOpen])

  useEffect(() => {
    if (guestDiagnosticSession) {
      setAuthUser(null)
      setAuthSessionReady(true)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const meRes = await fetch("/api/auth/me", { credentials: "include" })
        const meData = await meRes.json().catch(() => null)
        if (cancelled) return
        if (!meData?.user) {
          router.replace(buildLoginUrl("/diagnostic", { reason: "diagnostic" }))
          return
        }
        setAuthUser({
          ...meData.user,
          diagnosticCredits: meData.user.diagnosticCredits ?? 0,
          role: meData.user.role ?? "user",
        })
        setAuthSessionReady(true)
      } catch {
        if (!cancelled) router.replace(buildLoginUrl("/diagnostic", { reason: "diagnostic" }))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router, guestDiagnosticSession])

  // Retour Stripe (achat de crédits connecté) : rafraîchir le solde et restaurer le formulaire
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentIntentId = params.get("payment_intent")
    const creditsAdded = params.get("credits_added")

    function refreshCreditsBalance() {
      fetch("/api/credits/balance")
        .then((r) => r.json())
        .then((data) => {
          if (data.ok) {
            setAuthUser((prev) => (prev ? { ...prev, diagnosticCredits: data.credits } : null))
          }
        })
        .catch(() => null)
    }

    if (paymentIntentId && params.get("redirect_status") === "succeeded") {
      window.history.replaceState({}, "", "/diagnostic")
      const savedDataStr = sessionStorage.getItem("pendingFormData")
      if (savedDataStr) {
        try {
          setFormData(JSON.parse(savedDataStr))
        } catch {
          /* ignore */
        }
        sessionStorage.removeItem("pendingFormData")
      }
      refreshCreditsBalance()
      const delaysMs = [2500, 6000, 12000, 20000]
      const timers = delaysMs.map((ms) => setTimeout(refreshCreditsBalance, ms))
      return () => timers.forEach(clearTimeout)
    }

    if (creditsAdded) {
      window.history.replaceState({}, "", "/diagnostic")
      const savedDataStr = sessionStorage.getItem("pendingFormData")
      if (savedDataStr) {
        try {
          setFormData(JSON.parse(savedDataStr))
        } catch {
          /* ignore */
        }
        sessionStorage.removeItem("pendingFormData")
      }
      refreshCreditsBalance()
      const delaysMs = [2500, 6000, 12000, 20000]
      const timers = delaysMs.map((ms) => setTimeout(refreshCreditsBalance, ms))
      return () => timers.forEach(clearTimeout)
    }
  }, [])

  const runDiagnostic = async () => {
    setAuthError(null)
    window.scrollTo(0, 0)
    setIsLoading(true)

    try {
      const payload = {
        ...formData,
        puissance: formData.puissance.trim() ? `${formData.puissance.trim()} ${puissanceUnite}` : formData.puissance,
      }
      const response = await fetch("/api/diagnostic", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const msg =
          typeof data?.message === "string"
            ? data.message
            : typeof data?.error === "string"
              ? data.error
              : t("vehicleForm.analysisError")
        setAuthError(msg)
        return
      }

      if (guestDiagnosticSession && data?.diagnosticRequestId) {
        sessionStorage.setItem(SS_GUEST_ACTIVE, "1")
        sessionStorage.setItem(SS_GUEST_DIAG_ID, String(data.diagnosticRequestId))
      }

      sessionStorage.setItem("diagnostic", JSON.stringify(data))
      sessionStorage.setItem("vehicleInfo", JSON.stringify(formData))
      sessionStorage.removeItem("followUps")

      window.scrollTo(0, 0)
      router.push("/resultat", { scroll: true })
    } catch (error) {
      console.error("Erreur:", error)
      setAuthError(t("vehicleForm.techError"))
    } finally {
      setIsLoading(false)
    }
  }

  /** Sélection d'une marque via le combobox (remplace le <select> natif). */
  const handleMarqueSelect = (value: string) => {
    cascadeGen.current += 1
    setHasMultipleAutoTypes(false)
    setFormData((prev) => ({
      ...prev,
      marque: value,
      modele: "",
      variante: "",
      carburant: "",
      transmission: "",
      annee: "",
      kilometrage: "",
      probleme: "",
      typeBoiteAuto: "",
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
    setManualModelEntry(false)
    setModelDraft("")
    setMarqueOpen(false)
    setMarqueSearch("")
  }

  const handleInvalid = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      const target = e.target
      if (
        target instanceof HTMLSelectElement ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        if (target.name === "marque") {
          target.setCustomValidity(t("vehicleForm.validMarque"))
        } else if (target.name === "modele") {
          target.setCustomValidity(t("vehicleForm.validModele"))
        } else if (target.name === "carburant") {
          target.setCustomValidity(t("vehicleForm.validFuel"))
        } else if (target.name === "transmission") {
          target.setCustomValidity(t("vehicleForm.validTrans"))
        } else if (target.name === "annee") {
          target.setCustomValidity(t("vehicleForm.validAnnee"))
        } else if (target.name === "kilometrage") {
          const v = parseInt((target as HTMLInputElement).value, 10)
          if (!isNaN(v) && v > 2_000_000) {
            target.setCustomValidity(t("vehicleForm.validKmMax"))
          } else {
            target.setCustomValidity(t("vehicleForm.validKm"))
          }
        } else if (target.name === "probleme") {
          target.setCustomValidity(t("vehicleForm.validProbleme"))
        } else {
          target.setCustomValidity(t("vehicleForm.validRequired"))
        }
      }
    },
    [t]
  )

  const clearValidity = (
    e: React.FormEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.currentTarget
    if (target instanceof HTMLSelectElement || target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      target.setCustomValidity("")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // La marque est gérée par handleMarqueSelect (combobox personnalisé)

    if (name === "modele") {
      setManualModelEntry(false)
      cascadeGen.current += 1
      setHasMultipleAutoTypes(false)
      setFormData((prev) => ({
        ...prev,
        modele: value,
        variante: "",
        carburant: "",
        transmission: "",
        annee: "",
        kilometrage: "",
        probleme: "",
        typeBoiteAuto: "",
      }))
      return
    }

    if (name === "variante") {
      cascadeGen.current += 1
      setFormData((prev) => ({
        ...prev,
        variante: value,
        annee: "",
        carburant: "",
        transmission: "",
        kilometrage: "",
        probleme: "",
      }))
      setFuelLocked(false)
      setTransLocked(false)
      return
    }

    if (name === "annee") {
      cascadeGen.current += 1
      setFormData((prev) => ({
        ...prev,
        annee: value,
        carburant: "",
        transmission: "",
      }))
      setFuelLocked(false)
      setTransLocked(false)
      return
    }

    if (name === "carburant") {
      cascadeGen.current += 1
      setFormData((prev) => ({
        ...prev,
        carburant: value,
        transmission: "",
      }))
      setTransLocked(false)
      return
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const availableMakes = apiMakes.length > 0 ? apiMakes : carBrands
  const baseModels = apiModels.length > 0 ? apiModels : formData.marque ? carModels[formData.marque] || [] : []
  const availableModels = dedupeModelsByVariantBase(filterFrenchModelLabels(baseModels))
  const isException = isExceptionBrand(formData.marque)

  /** Plusieurs variantes API ou saisie manuelle (erreur API) : toujours champ texte, pas de liste déroulante */
  const showVariantField =
    isModeleDone && (fallbackVariant || (!variantUiSkipped && variantList.length > 1))
  const yearSelectDisabled = !isModeleDone || loadingVariant || loadingYear
  const yearOptionsForSelect = yearList
  const showYearFallbackInput = fallbackYear && !loadingYear

  // Auto-ouvrir les infos complémentaires si plusieurs types de boîte auto existent
  useEffect(() => {
    if (hasMultipleAutoTypes && formData.transmission === "Automatique") {
      setExtraOpen(true)
    }
  }, [hasMultipleAutoTypes, formData.transmission])

  const vehicleLabel = [formData.marque, formData.modele, formData.annee].filter(Boolean).join(" ")

  if (!authSessionReady) {
    return (
      <div className="flex min-h-[240px] w-full max-w-2xl mx-auto items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <span className="sr-only">{t("common.loading")}</span>
      </div>
    )
  }

  return (
    <>
      {isLoading && <DiagnosticLoader vehicle={vehicleLabel || undefined} mode="initial" />}
    <Card className="w-full max-w-2xl mx-auto border-border/50 bg-card shadow-xl pt-3">
      <CardContent className="pt-3">
        <form onSubmit={openAuthDialog} onInvalid={handleInvalid} className="space-y-5">
          <p className="text-sm font-medium text-foreground text-left">{t("vehicleForm.sectionTitle")}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="marque-btn" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                {t("vehicleForm.labelMarque")}
              </label>

              {/* Input caché pour la validation HTML5 du formulaire */}
              <input
                type="text"
                name="marque"
                required
                readOnly
                tabIndex={-1}
                aria-hidden="true"
                value={formData.marque}
                className="sr-only"
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity(t("vehicleForm.validMarque"))}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
              />

              <div ref={marqueRef} className="relative">
                {/* Bouton déclencheur */}
                <button
                  id="marque-btn"
                  type="button"
                  onClick={() => setMarqueOpen((o) => !o)}
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 flex items-center justify-between gap-2"
                >
                  <span className={formData.marque ? "text-foreground" : "text-muted-foreground"}>
                    {formData.marque || (loadingMakes ? t("common.loading") : t("vehicleForm.selectMarque"))}
                  </span>
                  {formData.marque ? (
                    <X
                      className="h-3.5 w-3.5 text-muted-foreground shrink-0 hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarqueSelect("")
                        // Ré-ouvrir pour permettre une nouvelle sélection
                        setTimeout(() => setMarqueOpen(true), 0)
                      }}
                    />
                  ) : (
                    <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${marqueOpen ? "rotate-180" : ""}`} />
                  )}
                </button>

                {/* Panneau déroulant */}
                {marqueOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-lg">
                    {/* Barre de recherche */}
                    <div className="border-b border-border p-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <input
                          ref={marqueSearchRef}
                          type="text"
                          value={marqueSearch}
                          onChange={(e) => setMarqueSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              setMarqueOpen(false)
                              setMarqueSearch("")
                            }
                          }}
                          placeholder={t("vehicleForm.searchMarquePlaceholder")}
                          className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </div>
                    </div>

                    {/* Liste filtrée */}
                    <div className="max-h-52 overflow-y-auto py-1">
                      {(() => {
                        const filtered = availableMakes.filter((b) =>
                          b.toLowerCase().includes(marqueSearch.toLowerCase())
                        )
                        return filtered.length === 0 ? (
                          <p className="px-3 py-2 text-sm text-muted-foreground">{t("vehicleForm.noResults")}</p>
                        ) : (
                          filtered.map((brand) => (
                            <button
                              key={brand}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()} // évite le blur de la recherche
                              onClick={() => handleMarqueSelect(brand)}
                              className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-primary/10 ${
                                formData.marque === brand
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-foreground"
                              }`}
                            >
                              {brand}
                            </button>
                          ))
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!isException && (
              <div className="space-y-2">
                <label htmlFor="modele" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  {t("vehicleForm.labelModele")}
                  {loadingModels && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </label>
                {manualModelEntry ? (
                  <div className="space-y-1.5">
                    <Input
                      id="modele-manual"
                      name="modele"
                      value={modelDraft}
                      onChange={(e) => setModelDraft(e.target.value)}
                      onInput={clearValidity}
                      onBlur={() => {
                        commitManualModel()
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          ;(e.target as HTMLInputElement).blur()
                        }
                      }}
                      required
                      placeholder={t("vehicleForm.modelManualPlaceholder")}
                      disabled={!isMarqueDone}
                      className="h-11 bg-background border-input focus:border-primary disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={backToModelList}
                      className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground/80 text-left cursor-pointer bg-transparent border-0 p-0 font-inherit"
                    >
                      {t("vehicleForm.backToList")}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <select
                      id="modele"
                      name="modele"
                      value={formData.modele}
                      onChange={handleChange}
                      onInput={clearValidity}
                      required
                      disabled={!isMarqueDone}
                      className="h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-[#0a1628] [&>option]:text-foreground"
                    >
                      <option value="" className="bg-[#0a1628]">
                        {!isMarqueDone
                          ? t("vehicleForm.chooseMarqueFirst")
                          : loadingModels
                            ? t("common.loading")
                            : t("vehicleForm.selectModele")}
                      </option>
                      {availableModels.map((model) => (
                        <option key={model} value={model} className="bg-[#0a1628]">
                          {model}
                        </option>
                      ))}
                    </select>
                    {isMarqueDone && !loadingModels && (
                      <button
                        type="button"
                        onClick={() => {
                          setManualModelEntry(true)
                          setModelDraft(formData.modele)
                        }}
                        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground/80 text-left cursor-pointer bg-transparent border-0 p-0 font-inherit"
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
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-foreground animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-sm font-medium text-amber-200/90 mb-1">{t("exceptionBrand.title")}</p>
              <p className="text-sm text-muted-foreground">{t("exceptionBrand.message")}</p>
            </div>
          )}

          {!isException && (
            <>
              {showVariantField && (
                <div className="space-y-2">
                  <label htmlFor="variante" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    {t("vehicleForm.labelVariante")}
                    <span className="text-xs text-muted-foreground">{t("vehicleForm.optional")}</span>
                    {loadingVariant && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </label>
                  <Input
                    id="variante"
                    name="variante"
                    placeholder={t("vehicleForm.manualPlaceholder")}
                    value={formData.variante}
                    onChange={handleChange}
                    onInput={clearValidity}
                    disabled={loadingVariant}
                    onBlur={() => {
                      if (!formData.marque || !formData.modele) return
                      const gen = ++cascadeGen.current
                      void loadYears(
                        {
                          marque: formData.marque,
                          modele: formData.modele,
                          variante: formData.variante,
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="annee" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    {t("vehicleForm.labelAnnee")}
                    {(loadingVariant || loadingYear) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </label>
                  {showYearFallbackInput ? (
                    <Input
                      id="annee"
                      name="annee"
                      type="number"
                      placeholder={t("vehicleForm.manualPlaceholder")}
                      min={1980}
                      max={new Date().getFullYear()}
                      value={formData.annee}
                      onChange={handleChange}
                      onInput={clearValidity}
                      required
                      disabled={yearSelectDisabled}
                      className="h-11 bg-secondary/50 border-input focus:border-primary disabled:opacity-50"
                    />
                  ) : (
                    <select
                      id="annee"
                      name="annee"
                      value={formData.annee}
                      onChange={handleChange}
                      onInput={clearValidity}
                      required
                      disabled={yearSelectDisabled || yearOptionsForSelect.length === 0}
                      className="h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-[#0a1628] [&>option]:text-foreground"
                    >
                      <option value="" className="bg-[#0a1628]">
                        {loadingYear || loadingVariant
                          ? t("common.loading")
                          : yearOptionsForSelect.length > 0
                            ? t("vehicleForm.selectYear")
                            : t("vehicleForm.noYearAvailable")}
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
                    {t("vehicleForm.labelKm")}
                  </label>
                  <Input
                    id="kilometrage"
                    name="kilometrage"
                    type="number"
                    placeholder={t("vehicleForm.kmPh")}
                    min="0"
                    max="2000000"
                    value={formData.kilometrage}
                    onChange={handleChange}
                    onInput={clearValidity}
                    required
                    disabled={!isAnneeDone}
                    className="h-11 bg-secondary/50 border-input focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-200 ${loadingFuel || loadingTrans ? "opacity-60 pointer-events-none" : ""}`}>
                <div className="space-y-2">
                  <label htmlFor="carburant" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-primary" />
                    {t("vehicleForm.labelFuel")}
                    {loadingFuel && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </label>
                  {fuelLocked ? (
                    <Input
                      readOnly
                      name="carburant"
                      id="carburant"
                      value={formatCarburantOptionLabel(formData.carburant, t)}
                      className="h-11 bg-muted/50 border-input text-foreground"
                    />
                  ) : fallbackFuel ? (
                    <Input
                      id="carburant"
                      name="carburant"
                      value={formData.carburant}
                      onChange={handleChange}
                      onInput={clearValidity}
                      required
                      placeholder={t("vehicleForm.manualPlaceholder")}
                      disabled={!isAnneeDone || loadingFuel}
                      className="h-11 bg-background border-input focus:border-primary disabled:opacity-50"
                    />
                  ) : (
                    <select
                      id="carburant"
                      name="carburant"
                      value={formData.carburant}
                      onChange={handleChange}
                      onInput={clearValidity}
                      required
                      disabled={!isAnneeDone || loadingFuel}
                      className="h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-[#0a1628] [&>option]:text-foreground"
                    >
                      <option value="" className="bg-[#0a1628]">
                        {isAnneeDone
                          ? loadingFuel
                            ? t("common.loading")
                            : t("vehicleForm.selectFuel")
                          : t("vehicleForm.chooseYearFirst")}
                      </option>
                      {fuelList.map((fuel) => (
                        <option key={fuel} value={fuel} className="bg-[#0a1628]">
                          {formatCarburantOptionLabel(fuel, t)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="transmission" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    {t("vehicleForm.labelTrans")}
                    {loadingTrans && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </label>
                  {transLocked ? (
                    <Input
                      readOnly
                      name="transmission"
                      id="transmission"
                      value={formData.transmission}
                      className="h-11 bg-muted/50 border-input text-foreground"
                    />
                  ) : fallbackTrans ? (
                    <Input
                      id="transmission"
                      name="transmission"
                      value={formData.transmission}
                      onChange={handleChange}
                      onInput={clearValidity}
                      required
                      placeholder={t("vehicleForm.manualPlaceholder")}
                      disabled={!isCarburantDone || loadingTrans}
                      className="h-11 bg-background border-input focus:border-primary disabled:opacity-50"
                    />
                  ) : (
                    <select
                      id="transmission"
                      name="transmission"
                      value={formData.transmission}
                      onChange={handleChange}
                      onInput={clearValidity}
                      required
                      disabled={!isCarburantDone || loadingTrans}
                      className="h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-[#0a1628] [&>option]:text-foreground"
                    >
                      <option value="" className="bg-[#0a1628]">
                        {isCarburantDone
                          ? loadingTrans
                            ? t("common.loading")
                            : t("vehicleForm.selectTrans")
                          : t("vehicleForm.chooseFuelFirst")}
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
                    {hasMultipleAutoTypes && formData.transmission === "Automatique" && (
                      <div className="md:col-span-2 space-y-1.5 rounded-lg border border-primary/20 bg-primary/5 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <label htmlFor="typeBoiteAuto" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                          <Settings2 className="h-3.5 w-3.5 text-primary" />
                          {t("vehicleForm.typeBoiteLabel")}
                          <span className="text-muted-foreground">{t("vehicleForm.optional")}</span>
                        </label>
                        <Input
                          id="typeBoiteAuto"
                          name="typeBoiteAuto"
                          placeholder={t("vehicleForm.typeBoitePh")}
                          value={formData.typeBoiteAuto}
                          onChange={handleChange}
                          maxLength={100}
                          disabled={!isKilometrageDone}
                          className="h-10 bg-background text-sm"
                        />
                        <p className="text-[11px] text-muted-foreground">{t("vehicleForm.typeBoiteHint")}</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label htmlFor="cylindree" className="text-xs font-medium text-muted-foreground">
                        {t("vehicleForm.cylindree")}
                      </label>
                      <Input
                        id="cylindree"
                        name="cylindree"
                        placeholder={t("vehicleForm.cylindreePh")}
                        value={formData.cylindree}
                        onChange={handleChange}
                        maxLength={80}
                        disabled={!isKilometrageDone}
                        className="h-10 bg-background text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="puissance" className="text-xs font-medium text-muted-foreground">
                        {t("vehicleForm.puissance")}
                      </label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="puissance"
                          name="puissance"
                          type="text"
                          inputMode="numeric"
                          placeholder={t("vehicleForm.puissancePh")}
                          value={formData.puissance}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "")
                            setFormData((prev) => ({ ...prev, puissance: v }))
                          }}
                          maxLength={6}
                          disabled={!isKilometrageDone}
                          className="h-10 bg-background text-sm flex-1"
                        />
                        <div className="flex rounded-lg border border-input overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setPuissanceUnite("ch")}
                            disabled={!isKilometrageDone}
                            className={`px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${puissanceUnite === "ch" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                          >
                            ch
                          </button>
                          <button
                            type="button"
                            onClick={() => setPuissanceUnite("kW")}
                            disabled={!isKilometrageDone}
                            className={`px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${puissanceUnite === "kW" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                          >
                            kW
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="nombrePortes" className="text-xs font-medium text-muted-foreground">
                        {t("vehicleForm.portes")}
                      </label>
                      <Input
                        id="nombrePortes"
                        name="nombrePortes"
                        type="text"
                        inputMode="numeric"
                        placeholder={t("vehicleForm.portesPh")}
                        value={formData.nombrePortes}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "")
                          setFormData((prev) => ({ ...prev, nombrePortes: v }))
                        }}
                        maxLength={2}
                        disabled={!isKilometrageDone}
                        className="h-10 bg-background text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="typeCarrosserie" className="text-xs font-medium text-muted-foreground">
                        {t("vehicleForm.carrosserie")}
                      </label>
                      <Input
                        id="typeCarrosserie"
                        name="typeCarrosserie"
                        placeholder={t("vehicleForm.carrosseriePh")}
                        value={formData.typeCarrosserie}
                        onChange={handleChange}
                        maxLength={80}
                        disabled={!isKilometrageDone}
                        className="h-10 bg-background text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("vehicleForm.dividerProblem")}
                </span>
                <div className="h-px flex-1 bg-border/60" />
              </div>

              <div className="space-y-2">
                <label htmlFor="probleme" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  {t("vehicleForm.labelProbleme")}
                </label>

                {isVoiceActive ? (
                  <div className={`rounded-lg border bg-secondary/50 p-3 space-y-3 min-h-[108px] shadow-sm ${voiceError ? "border-destructive/40" : "border-primary/40"}`}>
                    {/* Indicateur / Erreur */}
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        {voiceError === "BLOCKED" ? (
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-destructive">{t("vehicleForm.voiceBlockedTitle")}</p>
                            <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                              {t("vehicleForm.voiceBlockedHelp")}
                            </p>
                          </div>
                        ) : voiceError ? (
                          <span className="text-xs text-destructive">{voiceError}</span>
                        ) : isListening ? (
                          <span className="flex items-center gap-2 text-xs text-primary font-medium">
                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-70" />
                              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                            </span>
                            {t("vehicleForm.listening")}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Mic className="h-3 w-3" /> {t("vehicleForm.waiting")}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={cancelVoiceRecording}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={t("vehicleForm.cancelAria")}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Transcription en direct */}
                    {!voiceError && (
                      <p className="text-sm text-foreground min-h-[2.5rem] leading-relaxed">
                        {voiceTranscript
                          ? voiceTranscript
                          : <span className="text-muted-foreground italic">{t("vehicleForm.speakNow")}</span>}
                      </p>
                    )}

                    {/* Boutons */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={retryVoiceRecording}
                        className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-accent transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" />
                        {t("vehicleForm.retry")}
                      </button>
                      <button
                        type="button"
                        onClick={sendVoiceTranscript}
                        disabled={!voiceTranscript.trim()}
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Send className="h-3 w-3" />
                        {t("vehicleForm.send")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <textarea
                      id="probleme"
                      name="probleme"
                      lang={locale === "nl" ? "nl" : locale === "en" ? "en" : "fr"}
                      spellCheck={true}
                      placeholder={t("vehicleForm.problemePlaceholder")}
                      value={formData.probleme}
                      onChange={handleChange}
                      onInput={clearValidity}
                      required
                      disabled={!isKilometrageDone}
                      rows={4}
                      className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-3 pr-10 text-sm text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      disabled={!isKilometrageDone}
                      title={t("vehicleForm.describeOralTitle")}
                      className="absolute bottom-2.5 right-2.5 h-7 w-7 rounded-full border border-input bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Mic className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {t("vehicleForm.analyzing")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    {t("vehicleForm.analyzeCta")}
                  </span>
                )}
              </Button>
            </>
          )}
        </form>

        {authError && <p className="mt-3 text-sm text-destructive">{authError}</p>}
      </CardContent>
    </Card>
    </>
  )
}
