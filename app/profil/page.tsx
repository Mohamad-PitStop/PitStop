"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StripePaymentForm } from "@/components/stripe-payment-form"
import { CREDIT_PACKAGES } from "@/lib/credit-packages"
import { creditPackageLabel, creditPackageSaving } from "@/lib/credit-package-i18n"
import { CREDIT_PURCHASES_ENABLED } from "@/lib/feature-flags"
import { getDiagnosticEntryHref } from "@/lib/diagnostic-entry-href"
import { buildLoginUrl } from "@/lib/login-redirect"
import { formatCarburantOptionLabel } from "@/lib/format-carburant-label"
import { formatTransmissionOptionLabel } from "@/lib/format-transmission-label"
import { Input } from "@/components/ui/input"
import {
  Car,
  Calendar,
  Gauge,
  Search,
  RotateCcw,
  Zap,
  Check,
  ArrowLeft,
  Trash2,
  Pencil,
  Download,
  X,
  XOctagon,
  Gift,
  Eye,
  Plus,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n/locale-context"
import { VehiclePicker, type VehiclePickerData } from "@/components/vehicle-picker"

type AuthUser = {
  id: string
  name: string
  email: string
  role: string
  diagnosticCredits: number
  signupPostalCode: string | null
}

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
  status: DiagnosticStatus
}

type Reservation = {
  id: string
  type: string
  startAt: string
  endAt: string
  timeZone: string
  status: string
  cancelToken: string | null
}

type UserVehicle = {
  id: string
  nickname: string | null
  marque: string
  modele: string
  variante: string | null
  carburant: string | null
  transmission: string | null
  annee: string | null
  kilometrage: string | null
  cylindree: string | null
  puissance: string | null
  nombrePortes: string | null
  typeCarrosserie: string | null
  typeBoiteAuto: string | null
}

function truncate(text: string, max = 120) {
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text
}

function StatusBadge({ status }: { status: DiagnosticStatus }) {
  const { t } = useTranslation()
  if (status === "completed") return null
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

export default function ProfilPage() {
  const { t, locale } = useTranslation()
  const dateLocaleTag = locale === "en" ? "en-GB" : locale === "nl" ? "nl-BE" : "fr-BE"
  const numberLocale = dateLocaleTag
  function formatDate(iso: string) {
    try {
      return new Intl.DateTimeFormat(dateLocaleTag, {
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
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([])
  const [loading, setLoading] = useState(true)
  const [resumingId, setResumingId] = useState<string | null>(null)
  const [resumeError, setResumeError] = useState<string | null>(null)
  const [paySuccess, setPaySuccess] = useState(false)
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [selectedPkg, setSelectedPkg] = useState<(typeof CREDIT_PACKAGES)[number] | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  // Édition profil
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPostalCode, setEditPostalCode] = useState("")
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSuccess, setEditSuccess] = useState(false)
  // Export données
  const [downloadingData, setDownloadingData] = useState(false)
  const [merciPromoCode, setMerciPromoCode] = useState<string | null>(null)
  const merciFetchDoneRef = useRef(false)

  const [giftCode, setGiftCode] = useState("")
  const [giftRedeeming, setGiftRedeeming] = useState(false)
  const [giftError, setGiftError] = useState<string | null>(null)
  const [giftSuccess, setGiftSuccess] = useState<string | null>(null)

  // Mon garage
  const [vehicles, setVehicles] = useState<UserVehicle[]>([])
  const [garageAddOpen, setGarageAddOpen] = useState(false)
  const [garageEditVehicle, setGarageEditVehicle] = useState<UserVehicle | null>(null)
  const [garageAddSubmitting, setGarageAddSubmitting] = useState(false)
  const [garageAddError, setGarageAddError] = useState<string | null>(null)
  const [garageDeleteError, setGarageDeleteError] = useState<string | null>(null)
  const [garageNickname, setGarageNickname] = useState("")
  const [garagePickerData, setGaragePickerData] = useState<VehiclePickerData>({ marque: "", modele: "", variante: "", carburant: "", transmission: "", annee: "", kilometrage: "", cylindree: "", puissance: "", nombrePortes: "", typeCarrosserie: "", typeBoiteAuto: "" })

  const refreshUser = () => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!data?.user) {
          router.replace(buildLoginUrl("/profil"))
        } else {
          setUser({ ...data.user, diagnosticCredits: data.user.diagnosticCredits ?? 0 })
        }
      })
      .catch(() => router.replace(buildLoginUrl("/profil")))
  }

  async function redeemGiftCode() {
    setGiftError(null)
    setGiftSuccess(null)
    const raw = giftCode.trim()
    if (raw.length < 4) {
      setGiftError(t("creditsPage.giftCodeShort"))
      return
    }
    setGiftRedeeming(true)
    try {
      const res = await fetch("/api/credits/redeem-gift-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: raw }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || t("creditsPage.giftErrorGeneric"))
      }
      setUser((u) =>
        u ? { ...u, diagnosticCredits: data.newBalance ?? u.diagnosticCredits } : null
      )
      setGiftSuccess(t("creditsPage.giftSuccess", { count: data.creditsAdded, balance: data.newBalance }))
      setGiftCode("")
    } catch (e) {
      setGiftError(e instanceof Error ? e.message : t("creditsPage.giftErrorUnknown"))
    } finally {
      setGiftRedeeming(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("redirect_status") === "succeeded" || params.get("success") === "1") {
      setPaySuccess(true)
      window.history.replaceState({}, "", "/profil")
    }

    // Load user + diagnostics + reservations + vehicles in parallel
    Promise.all([
      fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()).catch(() => null),
      fetch("/api/mes-diagnostics").then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/mes-reservations").then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/user-vehicles").then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([userData, diagData, resData, vehiclesData]) => {
      if (!userData?.user) {
        router.replace(buildLoginUrl("/profil"))
        return
      }
      setUser({ ...userData.user, diagnosticCredits: userData.user.diagnosticCredits ?? 0 })
      setDiagnostics(diagData?.diagnostics ?? [])
      setReservations(resData?.reservations ?? [])
      setVehicles(vehiclesData?.vehicles ?? [])
    }).finally(() => setLoading(false))
  }, [router])

  // Refresh balance after payment success (webhook peut suivre le redirect avec délai)
  useEffect(() => {
    if (!paySuccess) return
    const delaysMs = [0, 2500, 6000, 12000, 20000]
    const timers = delaysMs.map((ms) => setTimeout(() => refreshUser(), ms))
    return () => timers.forEach(clearTimeout)
  }, [paySuccess])

  useEffect(() => {
    if (!CREDIT_PURCHASES_ENABLED || !user || merciFetchDoneRef.current) return
    merciFetchDoneRef.current = true
    fetch("/api/credits/merci-promo")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && !d.exhausted && d.code) setMerciPromoCode(d.code)
      })
      .catch(() => null)
  }, [CREDIT_PURCHASES_ENABLED, user])

  const [selectedPkgFinalAmount, setSelectedPkgFinalAmount] = useState<number | null>(null)

  const handleBuy = async (packageId: string) => {
    if (!CREDIT_PURCHASES_ENABLED) return
    setLoadingPkg(packageId)
    try {
      const res = await fetch("/api/credits/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          intent: "credit_purchase",
          ...(merciPromoCode ? { promoCode: merciPromoCode } : {}),
        }),
      })
      const data = await res.json().catch(() => null)
      if (data?.ok && data?.clientSecret) {
        setSelectedPkg(CREDIT_PACKAGES.find((p) => p.id === packageId) ?? null)
        setClientSecret(data.clientSecret)
        setSelectedPkgFinalAmount(data.finalAmount ?? null)
      }
    } finally {
      setLoadingPkg(null)
    }
  }

  const handleResume = async (d: Diagnostic) => {
    setResumingId(d.id)
    setResumeError(null)
    try {
      const response = await fetch(`/api/diagnostic/${d.id}`)
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? "Erreur")
      sessionStorage.setItem("diagnostic", JSON.stringify(data.diagnostic))
      sessionStorage.setItem("vehicleInfo", JSON.stringify(data.vehicleInfo))
      if (data.followUps) sessionStorage.setItem("followUps", data.followUps)
      else sessionStorage.removeItem("followUps")
      router.push(`/resultat?diagnosticId=${encodeURIComponent(d.id)}`)
    } catch {
      setResumeError(t("profilePage.resumeError"))
    } finally {
      setResumingId(null)
    }
  }

  const canOpenStoredResult = (d: Diagnostic) =>
    d.status === "completed" || d.status === "in_progress"

  const returnUrl =
    typeof window !== "undefined" ? `${window.location.origin}/profil` : ""

  const openEditMode = () => {
    setEditName(user?.name ?? "")
    setEditEmail(user?.email ?? "")
    setEditPostalCode(user?.signupPostalCode ?? "")
    setEditError(null)
    setEditSuccess(false)
    setEditMode(true)
  }

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError(null)
    setEditSubmitting(true)
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim(),
          postalCode: editPostalCode.trim(),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? t("profilePage.updateError"))
      setEditSuccess(true)
      setEditMode(false)
      setUser((prev) => prev ? { ...prev, name: editName.trim(), email: editEmail.trim(), signupPostalCode: editPostalCode.trim() || null } : prev)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : t("common.errorUnknown"))
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDownloadData = async () => {
    setDownloadingData(true)
    try {
      const res = await fetch("/api/auth/data-export")
      if (!res.ok) throw new Error(t("profilePage.exportFailed"))
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const cd = res.headers.get("Content-Disposition") ?? ""
      const match = cd.match(/filename="([^"]+)"/)
      a.download = match?.[1] ?? "pitstop-mes-donnees.json"
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // Erreur silencieuse : l'utilisateur peut réessayer
    } finally {
      setDownloadingData(false)
    }
  }

  // Bloquer le scroll quand un modal garage est ouvert
  const isGarageModalOpen = garageAddOpen || garageEditVehicle !== null
  useEffect(() => {
    if (isGarageModalOpen) {
      document.body.style.overflow = "hidden"
      document.documentElement.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
      document.documentElement.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
      document.documentElement.style.overflow = ""
    }
  }, [isGarageModalOpen])

  const handleGaragePickerChange = useCallback((data: VehiclePickerData) => {
    setGaragePickerData(data)
  }, [])

  const handleGarageAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!garagePickerData.marque.trim() || !garagePickerData.modele.trim()) {
      setGarageAddError(t("profilePage.garageAddError"))
      return
    }
    setGarageAddError(null)
    setGarageAddSubmitting(true)
    try {
      const p = garagePickerData
      const res = await fetch("/api/user-vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: garageNickname.trim() || undefined,
          marque: p.marque.trim(),
          modele: p.modele.trim(),
          variante: p.variante.trim() || undefined,
          carburant: p.carburant.trim() || undefined,
          transmission: p.transmission.trim() || undefined,
          annee: p.annee.trim() || undefined,
          kilometrage: p.kilometrage.trim() || undefined,
          cylindree: p.cylindree.trim() || undefined,
          puissance: p.puissance.trim() || undefined,
          nombrePortes: p.nombrePortes.trim() || undefined,
          typeCarrosserie: p.typeCarrosserie.trim() || undefined,
          typeBoiteAuto: p.typeBoiteAuto.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.vehicle) {
        throw new Error(data?.error === "max_vehicles_reached" ? t("profilePage.garageMaxReached") : t("profilePage.garageAddError"))
      }
      setVehicles((prev) => [...prev, data.vehicle])
      closeGarageModal()
    } catch (err) {
      setGarageAddError(err instanceof Error ? err.message : t("profilePage.garageAddError"))
    } finally {
      setGarageAddSubmitting(false)
    }
  }

  const closeGarageModal = () => {
    setGarageAddOpen(false)
    setGarageEditVehicle(null)
    setGarageNickname("")
    setGaragePickerData({ marque: "", modele: "", variante: "", carburant: "", transmission: "", annee: "", kilometrage: "", cylindree: "", puissance: "", nombrePortes: "", typeCarrosserie: "", typeBoiteAuto: "" })
    setGarageAddError(null)
  }

  const openGarageEdit = (v: UserVehicle) => {
    setGarageEditVehicle(v)
    setGarageNickname(v.nickname ?? "")
    setGaragePickerData({
      marque: v.marque,
      modele: v.modele,
      variante: v.variante ?? "",
      carburant: v.carburant ?? "",
      transmission: v.transmission ?? "",
      annee: v.annee ?? "",
      kilometrage: v.kilometrage ?? "",
      cylindree: v.cylindree ?? "",
      puissance: v.puissance ?? "",
      nombrePortes: v.nombrePortes ?? "",
      typeCarrosserie: v.typeCarrosserie ?? "",
      typeBoiteAuto: v.typeBoiteAuto ?? "",
    })
    setGarageAddError(null)
  }

  const handleGarageEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!garageEditVehicle || !garagePickerData.marque.trim() || !garagePickerData.modele.trim()) {
      setGarageAddError(t("profilePage.garageAddError"))
      return
    }
    setGarageAddError(null)
    setGarageAddSubmitting(true)
    try {
      const p = garagePickerData
      const res = await fetch(`/api/user-vehicles?id=${encodeURIComponent(garageEditVehicle.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: garageNickname.trim() || undefined,
          marque: p.marque.trim(),
          modele: p.modele.trim(),
          variante: p.variante.trim() || undefined,
          carburant: p.carburant.trim() || undefined,
          transmission: p.transmission.trim() || undefined,
          annee: p.annee.trim() || undefined,
          kilometrage: p.kilometrage.trim() || undefined,
          cylindree: p.cylindree.trim() || undefined,
          puissance: p.puissance.trim() || undefined,
          nombrePortes: p.nombrePortes.trim() || undefined,
          typeCarrosserie: p.typeCarrosserie.trim() || undefined,
          typeBoiteAuto: p.typeBoiteAuto.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.vehicle) throw new Error(t("profilePage.garageAddError"))
      setVehicles((prev) => prev.map((v) => v.id === garageEditVehicle.id ? data.vehicle : v))
      closeGarageModal()
    } catch (err) {
      setGarageAddError(err instanceof Error ? err.message : t("profilePage.garageAddError"))
    } finally {
      setGarageAddSubmitting(false)
    }
  }

  const handleGarageDelete = async (vehicleId: string) => {
    setGarageDeleteError(null)
    try {
      const res = await fetch(`/api/user-vehicles?id=${encodeURIComponent(vehicleId)}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId))
    } catch {
      setGarageDeleteError(t("profilePage.garageDeleteError"))
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteError(null)
    const confirmed = window.confirm(t("profilePage.deleteConfirm"))
    if (!confirmed) return

    setDeletingAccount(true)
    try {
      const res = await fetch("/api/auth/delete-account", { method: "POST" })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? t("profilePage.deleteFailed"))
      }
      router.push("/")
      router.refresh()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t("profilePage.deleteFailed"))
      setDeletingAccount(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        {/* Retour */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.backHome")}
        </Link>

        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <>
            {/* En-tête profil */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{t("profilePage.pageHeading")}</h1>
                {user && <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>}
              </div>
              <Link href={user ? getDiagnosticEntryHref(user) : "/diagnostic"}>
                <Button size="sm" className="gap-2">
                  <Search className="h-4 w-4" />
                  {t("profilePage.newDiagnostic")}
                </Button>
              </Link>
            </div>

            {/* Bannière succès */}
            {paySuccess && (
              <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  {t("profilePage.paySuccessBanner")}
                </p>
              </div>
            )}

            {/* Mes informations : Art. 16 RGPD */}
            {user && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">{t("profilePage.myInfo")}</h2>
                  {!editMode && (
                    <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={openEditMode}>
                      <Pencil className="h-3.5 w-3.5" />
                      {t("profilePage.edit")}
                    </Button>
                  )}
                </div>

                {editSuccess && (
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> {t("profilePage.updatedToast")}
                  </p>
                )}

                {!editMode ? (
                  <div className="rounded-xl border border-border/60 bg-muted/30 px-5 py-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("profilePage.nameLabel")}</span>
                      <span className="font-medium">{user.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("common.email")}</span>
                      <span className="font-medium">{user.email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("profilePage.postalCodeLabel")}</span>
                      <span className="font-medium">
                        {user.signupPostalCode || <span className="text-muted-foreground/60">—</span>}
                      </span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleEditProfile} className="rounded-xl border border-border/60 bg-muted/30 px-5 py-4 space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">{t("profilePage.fullNameLabel")}</label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                        minLength={2}
                        maxLength={120}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">{t("common.email")}</label>
                      <Input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        required
                        maxLength={160}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">{t("profilePage.postalCodeLabel")}</label>
                      <Input
                        value={editPostalCode}
                        onChange={(e) => setEditPostalCode(e.target.value)}
                        placeholder={t("profilePage.postalCodePh")}
                        maxLength={20}
                      />
                    </div>
                    {editError && <p className="text-xs text-destructive">{editError}</p>}
                    <div className="flex gap-2 pt-1">
                      <Button type="submit" size="sm" disabled={editSubmitting} className="h-7 text-xs">
                        {editSubmitting ? t("profilePage.saving") : t("profilePage.save")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1"
                        onClick={() => setEditMode(false)}
                        disabled={editSubmitting}
                      >
                        <X className="h-3.5 w-3.5" />
                        {t("results.cancel")}
                      </Button>
                    </div>
                  </form>
                )}
              </section>
            )}

            {/* Mon garage */}
            {user && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold">{t("profilePage.garageTitle")}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("profilePage.garageSubtitle")}</p>
                  </div>
                  {vehicles.length < 3 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-7 text-xs shrink-0"
                      onClick={() => { setGarageAddOpen(true); setGarageAddError(null) }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t("profilePage.garageAddBtn")}
                    </Button>
                  )}
                </div>

                {garageDeleteError && (
                  <p className="text-xs text-destructive">{garageDeleteError}</p>
                )}

                {vehicles.length === 0 ? (
                  <div className="rounded-xl border border-border/50 px-5 py-6 text-center space-y-3">
                    <Car size={44} strokeWidth={1} className="mx-auto text-muted-foreground" style={{ opacity: 0.4, display: "block" }} />
                    <p className="text-sm text-muted-foreground">{t("profilePage.garageEmpty")}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs h-7"
                      onClick={() => { setGarageAddOpen(true); setGarageAddError(null) }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t("profilePage.garageAddBtn")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {vehicles.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors group"
                        onClick={() => openGarageEdit(v)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openGarageEdit(v) }}
                      >
                        <div className="min-w-0 space-y-0.5 flex-1">
                          <p className="text-sm font-medium truncate">
                            {v.nickname ? (
                              <><span className="text-foreground">{v.nickname}</span>{" "}
                              <span className="text-muted-foreground font-normal text-xs">— {v.marque} {v.modele}</span></>
                            ) : (
                              <span>{v.marque} {v.modele}</span>
                            )}
                            {v.variante ? <span className="text-muted-foreground font-normal"> · {v.variante}</span> : null}
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            {v.annee && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{v.annee}</span>}
                            {v.kilometrage && <span className="flex items-center gap-1"><Gauge className="h-3 w-3" />{Number(v.kilometrage).toLocaleString(dateLocaleTag)} km</span>}
                            {v.carburant && <span>{formatCarburantOptionLabel(v.carburant, t)}</span>}
                            {v.transmission && <span>{formatTransmissionOptionLabel(v.transmission, t)}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="p-1.5 rounded-lg text-muted-foreground group-hover:text-primary transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </span>
                          <button
                            type="button"
                            aria-label={t("profilePage.garageDeleteAria")}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10"
                            onClick={(e) => { e.stopPropagation(); void handleGarageDelete(v.id) }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {vehicles.length >= 3 && (
                  <p className="text-xs text-muted-foreground">{t("profilePage.garageMaxReached")}</p>
                )}
              </section>
            )}

            {/* Solde crédits */}
            {user && (
              <section className="space-y-4">
                <h2 className="text-base font-semibold">{t("profilePage.creditsTitle")}</h2>
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-5 py-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("profilePage.balanceAvailable")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-orange-500">{user.diagnosticCredits}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.diagnosticCredits !== 1 ? t("creditsPage.creditPlural") : t("creditsPage.creditSingular")}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Gift className="h-4 w-4 text-primary shrink-0" aria-hidden />
                    {t("creditsPage.giftTitle")}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("creditsPage.giftHelp")}
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <Input
                      value={giftCode}
                      onChange={(e) => {
                        setGiftCode(e.target.value)
                        setGiftError(null)
                        setGiftSuccess(null)
                      }}
                      placeholder={t("creditsPage.giftPlaceholder")}
                      className="h-10 font-sans sm:flex-1"
                      maxLength={40}
                      autoComplete="off"
                      spellCheck={false}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void redeemGiftCode()
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-10 shrink-0 sm:min-w-[120px]"
                      onClick={() => void redeemGiftCode()}
                      disabled={giftRedeeming}
                    >
                      {giftRedeeming ? "…" : t("creditsPage.giftActivate")}
                    </Button>
                  </div>
                  {giftError && <p className="text-xs text-destructive">{giftError}</p>}
                  {giftSuccess && <p className="text-xs text-green-600 dark:text-green-400">{giftSuccess}</p>}
                </div>

                {/* Achat de crédits (désactivable : `CREDIT_PURCHASES_ENABLED` dans `lib/feature-flags.ts`) */}
                {CREDIT_PURCHASES_ENABLED ? (
                  <>
                    {user?.role === "user_friend" && (
                      <div className="flex items-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs text-violet-400 font-medium">
                        <span>🎁</span>
                        <span>Tarif ami appliqué : −50 % sur tous les packs</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {CREDIT_PACKAGES.map((pkg) => {
                        const savingLine = creditPackageSaving(t, pkg.id)
                        const isFriendUser = user?.role === "user_friend"
                        const friendAmountCents = Math.round(pkg.amountCents * 0.5)
                        const friendPriceLabel = `${(friendAmountCents / 100).toFixed(2).replace(".", ",")} €`
                        return (
                        <div
                          key={pkg.id}
                          className={`relative flex flex-col rounded-xl border p-3 ${
                            pkg.highlight
                              ? "border-orange-400 ring-1 ring-orange-400/30"
                              : "border-border/60"
                          }`}
                        >
                          <div className="h-5 flex items-center justify-center mb-2">
                            {pkg.highlight && (
                              <span className="bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                {t("creditsPage.bestCompromise")}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 mb-2">
                            <Zap className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                            <span className="text-xs font-medium">{creditPackageLabel(t, pkg.id)}</span>
                          </div>
                          <div className="mb-3">
                            {isFriendUser ? (
                              <>
                                <p className="text-[10px] text-muted-foreground line-through">{pkg.priceLabel}</p>
                                <p className="text-lg font-bold leading-tight text-violet-400">{friendPriceLabel}</p>
                                <span className="inline-block mt-0.5 bg-violet-500/10 text-violet-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                  −50 % tarif ami
                                </span>
                              </>
                            ) : (
                              <>
                                {pkg.originalPrice && (
                                  <p className="text-[10px] text-muted-foreground line-through">{pkg.originalPrice}</p>
                                )}
                                <p className="text-lg font-bold leading-tight">{pkg.priceLabel}</p>
                                {savingLine ? (
                                  <p className="text-[10px] font-medium text-green-600 dark:text-green-400 mt-0.5">
                                    {savingLine}
                                  </p>
                                ) : null}
                                {pkg.badge && (
                                  <span className="inline-block mt-0.5 bg-green-500/10 text-green-700 dark:text-green-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                    {pkg.badge}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className={`w-full text-xs h-7 mt-auto ${pkg.highlight ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
                            variant={pkg.highlight ? "default" : "outline"}
                            onClick={() => handleBuy(pkg.id)}
                            disabled={loadingPkg !== null}
                          >
                            {loadingPkg === pkg.id ? "…" : t("creditsPage.buy")}
                          </Button>
                        </div>
                        )
                      })}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{t("profilePage.creditsStripeNote")}</p>
                    <p className="text-[11px] font-medium text-amber-300/90">{t("creditsPage.footerNonRefundable")}</p>
                  </>
                ) : (
                  <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-4 space-y-2">
                    <p className="text-sm text-foreground font-medium">{t("profilePage.purchaseUnavailable")}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t("profilePage.purchaseDisabledBodyProfile")}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Mes réservations */}
            {reservations.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-base font-semibold">{t("profilePage.reservationsTitle")}</h2>
                <div className="space-y-3">
                  {reservations.map((r) => {
                    const startAt = new Date(r.startAt)
                    const dateLabel = new Intl.DateTimeFormat(dateLocaleTag, {
                      weekday: "long", day: "2-digit", month: "long", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    }).format(startAt)
                    const isCancelled = r.status === "cancelled"
                    const isPast = startAt < new Date()
                    return (
                      <div
                        key={r.id}
                        className={`rounded-xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                          isCancelled ? "border-border/40 bg-muted/20 opacity-60" : "border-border/60 bg-card"
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-sm font-medium text-foreground capitalize">{dateLabel}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {r.type.replace(/-/g, " ")}
                            {isCancelled && ` · ${t("profilePage.reservationCancelled")}`}
                            {!isCancelled && isPast && ` · ${t("profilePage.reservationPast")}`}
                          </p>
                        </div>
                        {!isCancelled && !isPast && r.cancelToken && (
                          <Link
                            href={`/rendez-vous/annuler?token=${r.cancelToken}`}
                            className="inline-flex items-center gap-1.5 shrink-0 text-xs text-destructive hover:underline"
                          >
                            <XOctagon className="h-3.5 w-3.5" />
                            {t("profilePage.cancelReservation")}
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Historique diagnostics */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">{t("profilePage.historyTitle")}</h2>
              </div>

              {resumeError && (
                <p className="text-destructive text-sm rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                  {resumeError}
                </p>
              )}

              {diagnostics.length === 0 ? (
                <div className="text-center py-12 space-y-4 rounded-xl border border-border/50">
                  <Car size={40} strokeWidth={1} className="mx-auto text-muted-foreground" style={{ opacity: 0.35, display: "block" }} />
                  <p className="text-sm text-muted-foreground">{t("profilePage.noDiagnostics")}</p>
                  <Link href={user ? getDiagnosticEntryHref(user) : "/diagnostic"}>
                    <Button variant="outline" size="sm">{t("profilePage.ctaFirstDiagnostic")}</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
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
                            ? t("profilePage.ariaSeeResults")
                            : t("profilePage.ariaResume")
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
                            <p className="text-sm text-foreground/80 leading-relaxed">
                              {truncate(d.probleme)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <time className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(d.createdAt)}
                            </time>
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
                                {resumingId === d.id ? t("profilePage.loadingShort") : t("profilePage.seeResults")}
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
                                {resumingId === d.id ? t("profilePage.loadingShort") : t("profilePage.resume")}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Mes données : Art. 20 RGPD (portabilité) */}
            <section className="space-y-3">
              <h2 className="text-base font-semibold">{t("profilePage.dataTitle")}</h2>
              <div className="rounded-xl border border-border/60 bg-muted/30 px-5 py-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("profilePage.downloadTitle")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("profilePage.exportDesc")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 h-8 text-xs"
                  onClick={handleDownloadData}
                  disabled={downloadingData}
                >
                  <Download className="h-3.5 w-3.5" />
                  {downloadingData ? t("profilePage.preparingDownload") : t("profilePage.downloadJson")}
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  {t("profilePage.rgpdContact")}{" "}
                  <a href="mailto:pitstopbelgique@gmail.com" className="text-primary hover:underline">
                    pitstopbelgique@gmail.com
                  </a>
                </p>
              </div>
            </section>

            {/* Suppression de compte */}
            <section className="pt-2">
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-foreground">{t("profilePage.deleteTitle")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("profilePage.deleteWarning")}
                </p>
                <p className="mt-2 text-xs font-medium text-amber-300/90">
                  {t("profilePage.deleteCreditsWarning")}
                </p>
                {deleteError && (
                  <p className="mt-2 text-xs text-destructive">{deleteError}</p>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  className="mt-4 w-full sm:w-auto"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deletingAccount ? t("profilePage.deleting") : t("profilePage.deleteButton")}
                </Button>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Modal paiement Stripe (désactivé si `CREDIT_PURCHASES_ENABLED` est false) */}
      {CREDIT_PURCHASES_ENABLED && clientSecret && selectedPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setClientSecret(null); setSelectedPkg(null); setSelectedPkgFinalAmount(null) }}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#c8d8f0] p-6 shadow-2xl" style={{ backgroundColor: "#E8EEF8" }}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold" style={{ color: "#0D1B3E" }}>{t("profilePage.stripeModalTitle")}</p>
                <p className="text-sm mt-0.5" style={{ color: "#1a2d5a" }}>
                  {creditPackageLabel(t, selectedPkg.id)} :{" "}
                  {selectedPkgFinalAmount != null && selectedPkgFinalAmount !== selectedPkg.amountCents ? (
                    <>
                      <span className="line-through text-[#1a2d5a]/50 mr-1">{selectedPkg.priceLabel}</span>
                      <span className="text-violet-500 font-semibold">{(selectedPkgFinalAmount / 100).toFixed(2).replace(".", ",")} €</span>
                    </>
                  ) : (
                    selectedPkg.priceLabel
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setClientSecret(null); setSelectedPkg(null); setSelectedPkgFinalAmount(null) }}
                className="rounded-full p-1.5 transition-colors hover:bg-[#c8d8f0]"
                style={{ color: "#1a2d5a" }}
                aria-label={t("creditsPage.closeAria")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <StripePaymentForm
              clientSecret={clientSecret}
              returnUrl={returnUrl}
              buttonLabel={t("creditsPage.payButton", {
                amount: selectedPkgFinalAmount != null
                  ? `${(selectedPkgFinalAmount / 100).toFixed(2).replace(".", ",")} €`
                  : selectedPkg.priceLabel,
              })}
            />
            <p className="mt-3 text-xs font-medium" style={{ color: "#7a2e2e" }}>
              {t("creditsPage.nonRefundableNote")}
            </p>
          </div>
        </div>
      )}

      {/* Modal ajout / édition véhicule — portail rendu directement dans document.body */}
      {isGarageModalOpen && typeof document !== "undefined" && createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          {/* Fond semi-transparent */}
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }}
            onClick={closeGarageModal}
          />

          {/* Contenu du modal */}
          <div
            className="relative w-full max-w-lg rounded-2xl border border-border/60 bg-card shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 flex flex-col"
            style={{ maxHeight: "90vh", zIndex: 1 }}
          >
            {/* En-tête fixe */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <h3 className="text-base font-semibold">
                {garageEditVehicle ? t("profilePage.garageEditTitle") : t("profilePage.garageAddTitle")}
              </h3>
              <button
                type="button"
                onClick={closeGarageModal}
                className="rounded-full p-1.5 transition-colors hover:bg-muted text-muted-foreground"
                aria-label={t("results.cancel")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Corps scrollable */}
            <form
              onSubmit={(e) => garageEditVehicle ? void handleGarageEdit(e) : void handleGarageAdd(e)}
              className="overflow-y-auto px-6 pb-6 space-y-5"
            >
              {/* Surnom */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t("profilePage.garageNicknameLabel")}</label>
                <Input
                  value={garageNickname}
                  onChange={(e) => setGarageNickname(e.target.value)}
                  placeholder={t("profilePage.garageNicknamePh")}
                  maxLength={50}
                />
              </div>

              {/* Formulaire véhicule — key force le remontage lors du passage add→edit */}
              <VehiclePicker
                key={garageEditVehicle?.id ?? "new"}
                onChange={handleGaragePickerChange}
                initialData={garageEditVehicle ? garagePickerData : undefined}
              />

              {garageAddError && <p className="text-xs text-destructive">{garageAddError}</p>}

              <Button
                type="submit"
                className="w-full"
                disabled={garageAddSubmitting || !garagePickerData.marque || !garagePickerData.modele}
              >
                {garageAddSubmitting ? "…" : t("profilePage.garageSaveBtn")}
              </Button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
