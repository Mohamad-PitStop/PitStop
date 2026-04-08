"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { format, isBefore, startOfDay } from "date-fns"
import { fr, enGB, nl } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { StripePaymentForm } from "@/components/stripe-payment-form"
import { hasAcceptedCgv, saveCgvConsent } from "@/lib/cgv-consent"
import { PromoInput, type PromoResult } from "@/components/promo-input"
import { useTranslation } from "@/lib/i18n/locale-context"

type Slot = { start: string; end: string }

function toDateParam(d: Date) {
  return format(d, "yyyy-MM-dd")
}

function computeDepositEuros(_priceMin?: number): number {
  return 25
}

export function BookingCheckout({
  type,
  vehicle,
  priceMin,
  priceMax,
  noCard = false,
  garageId,
}: {
  type: string
  vehicle?: { marque?: string; modele?: string; annee?: number; km?: number }
  priceMin?: number
  priceMax?: number
  noCard?: boolean
  /** Si défini : créneaux et paiement rattachés à ce garage partenaire. */
  garageId?: string | null
}) {
  const { t, locale } = useTranslation()
  const dateFnsLocale = useMemo(
    () => (locale === "en" ? enGB : locale === "nl" ? nl : fr),
    [locale]
  )

  const readJsonOrThrow = useCallback(
    async (res: Response) => {
      const raw = await res.text()
      try {
        return JSON.parse(raw) as { ok?: boolean; error?: string; slots?: Slot[]; clientSecret?: string }
      } catch {
        if (!res.ok) {
          throw new Error(t("bookingFlow.serverErrorUnexpected"))
        }
        throw new Error(t("bookingFlow.serverInvalidResponse"))
      }
    },
    [t]
  )

  const slotLabel = useCallback(
    (isoStart: string) => {
      const d = new Date(isoStart)
      return format(d, "HH:mm", { locale: dateFnsLocale })
    },
    [dateFnsLocale]
  )

  const depositEuros = computeDepositEuros(priceMin)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => new Date())
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [cgvAccepted, setCgvAccepted] = useState(true)
  const [cgvChecked, setCgvChecked] = useState(false)

  const [promoApplied, setPromoApplied] = useState<PromoResult | null>(null)

  const dateParam = useMemo(() => (selectedDate ? toDateParam(selectedDate) : null), [selectedDate])

  useEffect(() => {
    setCgvAccepted(hasAcceptedCgv())
  }, [])

  useEffect(() => {
    const syncCgv = () => setCgvAccepted(hasAcceptedCgv())
    window.addEventListener("storage", syncCgv)
    window.addEventListener("pitstop-cgv-consent-changed", syncCgv)
    return () => {
      window.removeEventListener("storage", syncCgv)
      window.removeEventListener("pitstop-cgv-consent-changed", syncCgv)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!dateParam) return
      setIsLoadingSlots(true)
      setError(null)
      setSelectedSlot(null)
      try {
        const garageQs =
          garageId != null && garageId !== ""
            ? `&garageId=${encodeURIComponent(garageId)}`
            : ""
        const res = await fetch(
          `/api/availability?date=${encodeURIComponent(dateParam)}&type=${encodeURIComponent(type)}${garageQs}`,
          {
            cache: "no-store",
            credentials: "include",
          }
        )
        const data = await readJsonOrThrow(res)
        if (!res.ok || !data?.ok) throw new Error(data?.error || t("bookingFlow.apiErrorGeneric"))
        if (!cancelled) setSlots(data.slots ?? [])
      } catch (e) {
        if (!cancelled) {
          setSlots([])
          setError(t("bookingFlow.errorLoadSlots"))
        }
      } finally {
        if (!cancelled) setIsLoadingSlots(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [dateParam, type, garageId, readJsonOrThrow, t])

  const canPickDate = (d: Date) => {
    const today = startOfDay(new Date())
    return !isBefore(startOfDay(d), today)
  }

  const canPay = Boolean(selectedSlot && name.trim() && phone.trim())

  async function startCheckout() {
    if (!selectedSlot) return
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type,
          name,
          phone,
          email,
          startAt: selectedSlot.start,
          endAt: selectedSlot.end,
          timeZone: "Europe/Brussels",
          priceMin,
          priceMax,
          vehicle,
          promoCode: promoApplied?.code ?? undefined,
          ...(garageId != null && garageId !== "" ? { garageId } : {}),
        }),
      })
      const data = await readJsonOrThrow(res)
      if (!res.ok || !data?.ok || !data?.clientSecret) {
        throw new Error(data?.error || t("bookingFlow.apiErrorGeneric"))
      }
      setClientSecret(data.clientSecret)
      setCgvChecked(cgvAccepted)
    } catch (e) {
      setError(
        e instanceof Error && e.message ? e.message : t("bookingFlow.errorPaymentStart")
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const returnUrl =
    typeof window !== "undefined" ? `${window.location.origin}/rendez-vous/success` : ""

  const inner = (
    <>
      {!noCard && (
        <CardHeader>
          <CardTitle className="text-foreground">{t("bookingFlow.title")}</CardTitle>
          <CardDescription>{t("bookingFlow.description")}</CardDescription>
        </CardHeader>
      )}
      {noCard && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-foreground">{t("bookingFlow.title")}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{t("bookingFlow.description")}</p>
        </div>
      )}
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 flex items-center justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(d) => !canPickDate(d)}
              locale={dateFnsLocale}
              className="[--cell-size:--spacing(9)]"
            />
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-border/50 bg-secondary/20 p-3">
              <p className="text-sm font-medium text-foreground">{t("bookingFlow.slotsLabel")}</p>
              <p className="text-xs text-muted-foreground">
                {dateParam
                  ? format(new Date(`${dateParam}T00:00:00`), "EEEE d MMMM", { locale: dateFnsLocale })
                  : ""}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 min-h-[164px] content-start">
                {isLoadingSlots ? (
                  <p className="text-sm text-muted-foreground col-span-3">{t("bookingFlow.loading")}</p>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground col-span-3">{t("bookingFlow.noSlots")}</p>
                ) : (
                  slots.map((s) => {
                    const active = selectedSlot?.start === s.start
                    return (
                      <Button
                        key={s.start}
                        type="button"
                        size="sm"
                        variant={active ? "default" : "secondary"}
                        onClick={() => setSelectedSlot(s)}
                        className="w-full"
                      >
                        {slotLabel(s.start)}
                      </Button>
                    )
                  })
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("bookingFlow.nameLabel")}</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("bookingFlow.namePh")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("bookingFlow.phoneLabel")}</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("bookingFlow.phonePh")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("bookingFlow.emailOptional")}</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("bookingFlow.emailPh")}
              />
            </div>

            <PromoInput
              applied={promoApplied}
              onApply={(result) => setPromoApplied(result)}
              onClear={() => setPromoApplied(null)}
            />

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={!canPay || isSubmitting}
              onClick={startCheckout}
            >
              {isSubmitting
                ? t("bookingFlow.preparingPayment")
                : t("bookingFlow.depositPayReserve", { amount: depositEuros })}
            </Button>

            <p className="text-xs text-muted-foreground text-center leading-snug">
              {t("bookingFlow.depositDeductNote")}
            </p>
          </div>
        </div>
      </div>
    </>
  )

  const paymentModal = clientSecret && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setClientSecret(null)}
      />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-[#c8d8f0] shadow-2xl flex flex-col"
        style={{ backgroundColor: "#E8EEF8", maxHeight: "calc(100dvh - 2rem)" }}
      >
        <div className="shrink-0 px-6 pt-6 pb-4 flex items-center justify-between">
          <div>
            <p className="text-base font-semibold" style={{ color: "#0D1B3E" }}>
              {t("bookingFlow.modalDepositTitle")}
            </p>
            {selectedSlot && (
              <p className="text-sm mt-0.5" style={{ color: "#1a2d5a" }}>
                {format(new Date(selectedSlot.start), "PPPp", { locale: dateFnsLocale })}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setClientSecret(null)}
            className="rounded-full p-1.5 transition-colors hover:bg-[#c8d8f0] shrink-0"
            style={{ color: "#1a2d5a" }}
            aria-label={t("creditsPage.closeAria")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-6 space-y-4">
          <div
            className="rounded-lg px-3 py-2.5 text-xs leading-relaxed"
            style={{ backgroundColor: "#d4e2f4", color: "#1a2d5a" }}
          >
            {t("bookingFlow.modalDepositLegal")}
          </div>
          {!cgvAccepted && (
            <label className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: "#1a2d5a" }}>
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-green-600"
                checked={cgvChecked}
                onChange={(e) => {
                  const checked = e.target.checked
                  setCgvChecked(checked)
                  if (checked) {
                    saveCgvConsent("accepted")
                    setCgvAccepted(true)
                  }
                }}
              />
              <span>
                {t("creditsPage.cgvCheckbox")}{" "}
                <Link href="/conditions-generales-vente" className="text-primary underline" target="_blank">
                  {t("creditsPage.cgvLink")}
                </Link>
                .
              </span>
            </label>
          )}
          {cgvAccepted ? (
            <StripePaymentForm
              clientSecret={clientSecret}
              returnUrl={returnUrl}
              buttonLabel={t("creditsPage.payButton", {
                amount: `${depositEuros.toFixed(2).replace(".", ",")} €`,
              })}
            />
          ) : (
            <div className="rounded-lg border border-[#c8d8f0] bg-white/60 p-3 text-xs" style={{ color: "#1a2d5a" }}>
              {t("bookingFlow.cgvDeposit")}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (noCard)
    return (
      <>
        {inner}
        {paymentModal}
      </>
    )

  return (
    <>
      <Card className="border-primary/30 bg-card">
        <CardContent className="space-y-5 pt-6">{inner}</CardContent>
      </Card>
      {paymentModal}
    </>
  )
}
