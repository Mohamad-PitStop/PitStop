"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { flushSync } from "react-dom"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Search, Car, Calendar, Gauge, FileText, Fuel, Settings2, ChevronDown, ChevronUp, Loader2, X } from "lucide-react"
import { getAvailableYearsForModel } from "@/lib/vehicle-year-catalog"
import { carBrands, carModels } from "@/lib/vehicle-model-catalog"
import {
  getAvailableFuelTypesForSelection,
  getAvailableTransmissionTypesForSelection,
} from "@/lib/vehicle-compatibility-catalog"
import { useCarsApi } from "@/hooks/use-cars-api"
import { isExceptionBrand, MESSAGE_MARQUE_EXCEPTION } from "@/lib/exception-brands"
import { StripePaymentForm } from "@/components/stripe-payment-form"
import { formatCarburantOptionLabel } from "@/lib/format-carburant-label"
import { dedupeModelsByVariantBase, filterFrenchModelLabels } from "@/lib/merge-verified-models"
import { postVehicleOptions } from "@/lib/vehicle-options-client"

const MANUAL_PLACEHOLDER = "Saisir manuellement"
const MODEL_MANUAL_PLACEHOLDER = "Ex : Continental GT, Macan, Stelvio..."

function sortYearsDesc(years: string[]): string[] {
  return [...years].sort((a, b) => Number(b) - Number(a))
}

export function VehicleForm() {
  const router = useRouter()
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

  const [extraOpen, setExtraOpen] = useState(false)
  const [puissanceUnite, setPuissanceUnite] = useState<"ch" | "kW">("ch")
  const [isLoading, setIsLoading] = useState(false)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authUser, setAuthUser] = useState<{ id: string; email: string; name: string; role: string; diagnosticCredits: number } | null>(null)
  const [guestAlreadyUsed, setGuestAlreadyUsed] = useState(false)
  const [paidSessionVerified, setPaidSessionVerified] = useState(false)
  const [creditCheckoutLoading, setCreditCheckoutLoading] = useState(false)
  const [creditClientSecret, setCreditClientSecret] = useState<string | null>(null)
  const [creditPaymentType, setCreditPaymentType] = useState<"credit_purchase" | "guest_diagnostic" | null>(null)

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
      }))
      setFuelLocked(false)
      setTransLocked(false)

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
        setAuthError("Veuillez indiquer le modèle de votre véhicule ou revenir à la liste.")
        return
      }
      if (v !== (formData.modele || "").trim()) {
        flushSync(() => {
          applyModeleValue(v)
        })
        setModelDraft(v)
      }
    }

    const MAX_EXTRA = 80
    const trim = (s: string) => (s || "").trim()
    const cylindree = trim(formData.cylindree)
    const puissanceVal = trim(formData.puissance)
    const puissance = puissanceVal ? `${puissanceVal} ${puissanceUnite}` : ""
    const nombrePortes = trim(formData.nombrePortes)
    const typeCarrosserie = trim(formData.typeCarrosserie)
    if (cylindree.length > MAX_EXTRA || (puissanceVal && puissance.length > MAX_EXTRA) || nombrePortes.length > MAX_EXTRA || typeCarrosserie.length > MAX_EXTRA) {
      setAuthError("Les informations complémentaires ne doivent pas dépasser 80 caractères par champ.")
      return
    }
    if (nombrePortes.length > 0) {
      const onlyNum = /^\d+$/.test(nombrePortes)
      const num = parseInt(nombrePortes, 10)
      if (onlyNum && (Number.isNaN(num) || num < 2 || num > 6)) {
        setAuthError("Nombre de portes : indiquez un nombre entre 2 et 6 (ex. 3 ou 5).")
        return
      }
    }

    if (authUser) {
      const isPrivileged = authUser.role === "admin" || authUser.role === "tester"
      if (isPrivileged || authUser.diagnosticCredits > 0) {
        void runDiagnostic("account")
        return
      }
      // Utilisateur connecté sans crédit → ouvrir la modale
      setAuthDialogOpen(true)
      return
    }

    // Invité avec session de paiement vérifiée → lancement direct
    if (paidSessionVerified) {
      setPaidSessionVerified(false)
      void runDiagnostic("guest")
      return
    }

    setAuthDialogOpen(true)
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
    let cancelled = false
    ;(async () => {
      try {
        // Récupérer le statut utilisateur et invité en parallèle
        const [meRes, guestRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/credits/guest-status"),
        ])
        const meData = await meRes.json().catch(() => null)
        const guestData = await guestRes.json().catch(() => null)
        if (!cancelled) {
          if (meData?.user) {
            setAuthUser({
              ...meData.user,
              diagnosticCredits: meData.user.diagnosticCredits ?? 0,
              role: meData.user.role ?? "user",
            })
          }
          if (guestData?.guestUsed) setGuestAlreadyUsed(true)
        }
      } catch {
        // no-op
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Gestion des retours depuis Stripe (payment_intent, paid_session, credits_added)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentIntentId = params.get("payment_intent")
    const intentType = params.get("intent")
    const paidSession = params.get("paid_session")
    const creditsAdded = params.get("credits_added")

    // Nouveau flux : retour PaymentIntent + Elements
    if (paymentIntentId && params.get("redirect_status") === "succeeded") {
      window.history.replaceState({}, "", "/diagnostic")
      const savedDataStr = sessionStorage.getItem("pendingFormData")
      if (savedDataStr) {
        const savedData = JSON.parse(savedDataStr)
        sessionStorage.removeItem("pendingFormData")
        setFormData(savedData)
      }

      if (intentType === "guest_diagnostic") {
        ;(async () => {
          try {
            const res = await fetch(`/api/credits/verify-guest-payment?payment_intent=${encodeURIComponent(paymentIntentId)}`)
            if (res.ok) {
              setPaidSessionVerified(true)
            } else {
              setAuthError("Erreur de vérification du paiement. Veuillez réessayer.")
            }
          } catch {
            setAuthError("Erreur de vérification du paiement. Veuillez réessayer.")
          }
        })()
      } else {
        // credit_purchase : rafraîchir le solde
        fetch("/api/credits/balance")
          .then((r) => r.json())
          .then((data) => {
            if (data.ok) {
              setAuthUser((prev) => prev ? { ...prev, diagnosticCredits: data.credits } : null)
            }
          })
          .catch(() => null)
      }
      return
    }

    // Ancien flux rétro-compatible : paid_session (Checkout Session)
    if (paidSession) {
      window.history.replaceState({}, "", "/diagnostic")
      ;(async () => {
        try {
          const res = await fetch(`/api/credits/verify-guest-payment?session_id=${encodeURIComponent(paidSession)}`)
          if (res.ok) {
            const savedDataStr = sessionStorage.getItem("pendingFormData")
            if (savedDataStr) {
              const savedData = JSON.parse(savedDataStr)
              sessionStorage.removeItem("pendingFormData")
              setFormData(savedData)
            }
            setPaidSessionVerified(true)
          } else {
            setAuthError("Erreur de vérification du paiement. Veuillez réessayer.")
          }
        } catch {
          setAuthError("Erreur de vérification du paiement. Veuillez réessayer.")
        }
      })()
    }

    if (creditsAdded) {
      window.history.replaceState({}, "", "/diagnostic")
      const savedDataStr = sessionStorage.getItem("pendingFormData")
      if (savedDataStr) {
        const savedData = JSON.parse(savedDataStr)
        sessionStorage.removeItem("pendingFormData")
        setFormData(savedData)
      }
      fetch("/api/credits/balance")
        .then((r) => r.json())
        .then((data) => {
          if (data.ok) {
            setAuthUser((prev) => prev ? { ...prev, diagnosticCredits: data.credits } : null)
          }
        })
        .catch(() => null)
    }
  }, [])

  const runDiagnostic = async (mode: "guest" | "account") => {
    setAuthError(null)
    setIsLoading(true)
    setAuthDialogOpen(false)

    try {
      const payload = {
        ...formData,
        puissance: formData.puissance.trim() ? `${formData.puissance.trim()} ${puissanceUnite}` : formData.puissance,
        authType: mode,
      }
      const response = await fetch("/api/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const msg =
          data?.error ||
          "Une erreur est survenue lors de l'analyse. Veuillez réessayer ou réessayer plus tard."
        setAuthError(msg)
        return
      }

      sessionStorage.setItem("diagnostic", JSON.stringify(data))
      sessionStorage.setItem("vehicleInfo", JSON.stringify(formData))
      sessionStorage.removeItem("followUps")

      router.push("/resultat")
    } catch (error) {
      console.error("Erreur:", error)
      setAuthError("Une erreur technique est survenue. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  /** Sélection d'une marque via le combobox (remplace le <select> natif). */
  const handleMarqueSelect = (value: string) => {
    cascadeGen.current += 1
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

  /** Prépare un PaymentIntent et ouvre le modal Stripe Elements pour payer. */
  const startCreditPayment = async (
    packageId: "1" | "3" | "6" | "10",
    intent: "credit_purchase" | "guest_diagnostic"
  ) => {
    setCreditCheckoutLoading(true)
    try {
      sessionStorage.setItem("pendingFormData", JSON.stringify(formData))
      const res = await fetch("/api/credits/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, intent }),
      })
      const data = await res.json().catch(() => null)
      if (data?.ok && data?.clientSecret) {
        setCreditPaymentType(intent)
        setCreditClientSecret(data.clientSecret)
        setAuthDialogOpen(false)
      } else {
        setAuthError("Erreur lors de la création du paiement. Veuillez réessayer.")
      }
    } catch {
      setAuthError("Erreur technique. Veuillez réessayer.")
    } finally {
      setCreditCheckoutLoading(false)
    }
  }

  const handleInvalid = (e: React.FormEvent<HTMLFormElement>) => {
    const target = e.target
    if (target instanceof HTMLSelectElement || target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      if (target.name === "marque") {
        target.setCustomValidity("Veuillez sélectionner une marque.")
      } else if (target.name === "modele") {
        target.setCustomValidity("Veuillez sélectionner un modèle.")
      } else if (target.name === "carburant") {
        target.setCustomValidity("Veuillez sélectionner le carburant.")
      } else if (target.name === "transmission") {
        target.setCustomValidity("Veuillez sélectionner la transmission.")
      } else if (target.name === "annee") {
        target.setCustomValidity("Veuillez indiquer l'année du véhicule.")
      } else if (target.name === "kilometrage") {
        target.setCustomValidity("Veuillez indiquer le kilométrage du véhicule.")
      } else if (target.name === "probleme") {
        target.setCustomValidity("Veuillez décrire le problème rencontré.")
      } else {
        target.setCustomValidity("Ce champ est requis.")
      }
    }
  }

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

  return (
    <Card className="w-full max-w-2xl mx-auto border-border/50 bg-card shadow-xl pt-3">
      <CardContent className="pt-3">
        <form onSubmit={openAuthDialog} onInvalid={handleInvalid} className="space-y-5">
          <p className="text-sm font-medium text-foreground text-left">Informations du véhicule</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="marque-btn" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                Marque
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
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Veuillez sélectionner une marque.")}
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
                    {formData.marque || (loadingMakes ? "Chargement…" : "Sélectionnez une marque")}
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
                          placeholder="Rechercher une marque…"
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
                          <p className="px-3 py-2 text-sm text-muted-foreground">Aucun résultat</p>
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
                  Modèle
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
                      placeholder={MODEL_MANUAL_PLACEHOLDER}
                      disabled={!isMarqueDone}
                      className="h-11 bg-background border-input focus:border-primary disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={backToModelList}
                      className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground/80 text-left cursor-pointer bg-transparent border-0 p-0 font-inherit"
                    >
                      Retour à la liste
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
                          ? "Choisissez d'abord une marque"
                          : loadingModels
                            ? "Chargement…"
                            : "Sélectionnez un modèle"}
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
                        Mon modèle n&apos;apparaît pas ?
                      </button>
                    )}
                  </div>
                )}
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
                    {loadingVariant && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </label>
                  <Input
                    id="variante"
                    name="variante"
                    placeholder={MANUAL_PLACEHOLDER}
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
                    Année
                    {(loadingVariant || loadingYear) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </label>
                  {showYearFallbackInput ? (
                    <Input
                      id="annee"
                      name="annee"
                      type="number"
                      placeholder={MANUAL_PLACEHOLDER}
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
                    name="kilometrage"
                    type="number"
                    placeholder="Ex: 85000"
                    min="0"
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
                    Carburant / Énergie
                    {loadingFuel && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </label>
                  {fuelLocked ? (
                    <Input
                      readOnly
                      name="carburant"
                      id="carburant"
                      value={formatCarburantOptionLabel(formData.carburant)}
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
                      placeholder={MANUAL_PLACEHOLDER}
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
                      placeholder={MANUAL_PLACEHOLDER}
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
                      <label htmlFor="cylindree" className="text-xs font-medium text-muted-foreground">
                        Cylindrée
                      </label>
                      <Input
                        id="cylindree"
                        name="cylindree"
                        placeholder="Ex: 1.6, 2.0 TDI"
                        value={formData.cylindree}
                        onChange={handleChange}
                        maxLength={80}
                        disabled={!isKilometrageDone}
                        className="h-10 bg-background text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="puissance" className="text-xs font-medium text-muted-foreground">
                        Puissance
                      </label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="puissance"
                          name="puissance"
                          type="text"
                          inputMode="numeric"
                          placeholder="Ex: 110"
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
                        Nombre de portes
                      </label>
                      <Input
                        id="nombrePortes"
                        name="nombrePortes"
                        type="text"
                        inputMode="numeric"
                        placeholder="Ex: 3, 5"
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
                        Type de carrosserie
                      </label>
                      <Input
                        id="typeCarrosserie"
                        name="typeCarrosserie"
                        placeholder="Ex: Berline, SUV, Break"
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
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Décrivez votre problème</span>
                <div className="h-px flex-1 bg-border/60" />
              </div>

              <div className="space-y-2">
                <label htmlFor="probleme" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  Description du problème
                </label>
                <textarea
                  id="probleme"
                  name="probleme"
                  lang="fr"
                  spellCheck={true}
                  placeholder="Décrivez le problème que vous rencontrez avec votre véhicule..."
                  value={formData.probleme}
                  onChange={handleChange}
                  onInput={clearValidity}
                  required
                  disabled={!isKilometrageDone}
                  rows={4}
                  className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-3 text-sm text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                />
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
                    Analyse en cours...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Analyser mon véhicule
                  </span>
                )}
              </Button>
            </>
          )}
        </form>

        {authError && <p className="mt-3 text-sm text-destructive">{authError}</p>}

        <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
          <DialogContent>
            {/* ── Utilisateur connecté ── */}
            {authUser ? (
              <>
                <DialogHeader>
                  <DialogTitle>Lancer votre diagnostic</DialogTitle>
                  <DialogDescription>
                    Bonjour {authUser.name} ! Voici votre solde de crédits PitStop.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-2 space-y-4">
                  {/* Badge crédits */}
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                    <span className="text-sm font-medium text-foreground">Crédits disponibles</span>
                    <span className={`text-2xl font-bold ${authUser.diagnosticCredits > 0 ? "text-orange-500" : "text-destructive"}`}>
                      {authUser.diagnosticCredits}
                    </span>
                  </div>

                  {authUser.diagnosticCredits > 0 ? (
                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                      onClick={() => runDiagnostic("account")}
                      disabled={isLoading}
                    >
                      Utiliser 1 crédit pour mon diagnostic
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground text-center">
                        Vous n&apos;avez plus de crédits. Payez un diagnostic unique ou rechargez votre compte.
                      </p>
                      <Button
                        className="w-full"
                        onClick={() => startCreditPayment("1", "credit_purchase")}
                        disabled={creditCheckoutLoading}
                      >
                        {creditCheckoutLoading ? "Préparation…" : "Payer 1 diagnostic — 9,99 €"}
                      </Button>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setAuthDialogOpen(false)
                      router.push("/credits")
                    }}
                  >
                    Recharger mes crédits
                  </Button>
                </div>

                <DialogFooter>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    1 crédit = 1 diagnostic complet. Les questions de suivi sont incluses.
                  </p>
                </DialogFooter>
              </>
            ) : (
              /* ── Invité ── */
              <>
                <DialogHeader>
                  <DialogTitle>
                    {guestAlreadyUsed
                      ? "Votre diagnostic gratuit a été utilisé"
                      : "Créer un compte ou continuer en tant qu\u2019invité"}
                  </DialogTitle>
                  <DialogDescription>
                    {guestAlreadyUsed
                      ? "Connectez-vous, créez un compte ou payez un diagnostic unique pour continuer."
                      : "Créez un compte pour des diagnostics illimités, ou continuez en invité pour un diagnostic gratuit."}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                  {/* Colonne gauche : connexion / inscription (toujours présente) */}
                  <div className="border border-border/60 rounded-lg p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Se connecter / Créer un compte</h3>
                    <p className="text-xs text-muted-foreground">
                      Retrouvez vos diagnostics et rechargez vos crédits depuis votre espace personnel.
                    </p>
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setAuthDialogOpen(false)
                          router.push("/inscription")
                        }}
                      >
                        Créer un compte
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setAuthDialogOpen(false)
                          router.push("/connexion")
                        }}
                      >
                        Se connecter
                      </Button>
                    </div>
                  </div>

                  {/* Colonne droite : invité gratuit OU paiement unique */}
                  {guestAlreadyUsed ? (
                    <div className="border border-orange-400/60 rounded-lg p-4 space-y-2 bg-orange-50/10">
                      <h3 className="text-sm font-semibold text-foreground">Diagnostic unique</h3>
                      <p className="text-xs text-muted-foreground">
                        Payez un diagnostic unique sans créer de compte. Valable une fois depuis ce navigateur.
                      </p>
                      <Button
                        size="sm"
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => startCreditPayment("1", "guest_diagnostic")}
                        disabled={creditCheckoutLoading}
                      >
                        {creditCheckoutLoading ? "Préparation…" : "Payer mon diagnostic — 9,99 €"}
                      </Button>
                    </div>
                  ) : (
                    <div className="border border-primary/50 rounded-lg p-4 space-y-2 bg-primary/5">
                      <h3 className="text-sm font-semibold text-foreground">Continuer en tant qu&apos;invité</h3>
                      <p className="text-xs text-muted-foreground">
                        Réalisez un diagnostic gratuit en mode invité. Un seul par navigateur.
                      </p>
                      <Button
                        size="sm"
                        className="w-full"
                        variant="secondary"
                        onClick={() => runDiagnostic("guest")}
                        disabled={isLoading}
                      >
                        Continuer en tant qu&apos;invité
                      </Button>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    En continuant, vous acceptez que vos informations soient traitées pour générer un diagnostic automobile personnalisé.
                  </p>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal Stripe Elements pour paiement de crédits */}
        {creditClientSecret && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setCreditClientSecret(null); setCreditPaymentType(null) }}
            />
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#c8d8f0] p-6 shadow-2xl" style={{ backgroundColor: "#E8EEF8" }}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold" style={{ color: "#0D1B3E" }}>
                    {creditPaymentType === "guest_diagnostic" ? "Paiement du diagnostic" : "Achat de crédit"}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "#1a2d5a" }}>
                    1 diagnostic — 9,99 €
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setCreditClientSecret(null); setCreditPaymentType(null) }}
                  className="rounded-full p-1.5 transition-colors hover:bg-[#c8d8f0]"
                  style={{ color: "#1a2d5a" }}
                  aria-label="Fermer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </svg>
                </button>
              </div>
              <StripePaymentForm
                clientSecret={creditClientSecret}
                returnUrl={
                  typeof window !== "undefined"
                    ? `${window.location.origin}/diagnostic?intent=${creditPaymentType}`
                    : ""
                }
                buttonLabel="Payer 9,99 €"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
