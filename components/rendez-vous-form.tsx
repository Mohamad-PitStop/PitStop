"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n/locale-context"

export function RendezVousForm({ isObd }: { isObd: boolean }) {
  const { t } = useTranslation()
  const DAYS = useMemo(
    () => [
      t("rdvForm.dayMon"),
      t("rdvForm.dayTue"),
      t("rdvForm.dayWed"),
      t("rdvForm.dayThu"),
      t("rdvForm.dayFri"),
      t("rdvForm.daySat"),
    ],
    [t]
  )
  const SLOTS = useMemo(
    () => [t("rdvForm.slotMorning"), t("rdvForm.slotAfternoon"), t("rdvForm.slotEvening")],
    [t]
  )

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [availability, setAvailability] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    phone?: string
    postalCode?: string
    availability?: string
  }>({})

  const validatePhone = (value: string) => {
    if (!value.trim()) return t("rdvForm.errPhoneRequired")
    const pattern = /^[+\d./\s()-]+$/
    if (!pattern.test(value)) {
      return t("rdvForm.errPhoneFormat")
    }
    const digits = value.replace(/\D/g, "")
    if (digits.length < 8) {
      return t("rdvForm.errPhoneShort")
    }
    return undefined
  }

  const validatePostalCode = (value: string) => {
    if (!value.trim()) return t("rdvForm.errPostalRequired")
    const pattern = /^[A-Za-z]{0,3}\s*\d{3,5}$|^\d{3,5}$/
    if (!pattern.test(value.trim())) {
      return t("rdvForm.errPostalFormat")
    }
    return undefined
  }

  const toggleSlot = (slot: string) => {
    setAvailability((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    const errors: typeof fieldErrors = {}
    if (!name.trim()) {
      errors.name = t("rdvForm.errName")
    }
    const phoneError = validatePhone(phone)
    if (phoneError) errors.phone = phoneError
    const postalError = validatePostalCode(postalCode)
    if (postalError) errors.postalCode = postalError
    if (availability.length === 0) {
      errors.availability = t("rdvForm.errAvailability")
    }

    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) {
      setMessage(t("rdvForm.formErrorSummary"))
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/rendez-vous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: isObd ? "obd-scan" : "standard",
          name,
          phone,
          postalCode,
          availability: availability.join(", "),
        }),
      })

      if (!res.ok) {
        throw new Error("Request failed")
      }

      setMessage(t("rdvForm.successMessage"))
      toast.success(t("rdvForm.toastSuccessTitle"), {
        description: t("rdvForm.toastSuccessDesc"),
      })
      setName("")
      setPhone("")
      setPostalCode("")
      setAvailability([])
    } catch (error) {
      console.error("Erreur rendez-vous:", error)
      setMessage(t("rdvForm.errorSend"))
      toast.error(t("rdvForm.toastErrorTitle"), { description: t("rdvForm.toastErrorDesc") })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">
          {isObd ? t("rdvForm.titleObd") : t("rdvForm.titleStandard")}
        </CardTitle>
        <CardDescription>{t("rdvForm.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("rdvForm.nameLabel")}</label>
              <Input
                placeholder={t("rdvForm.namePh")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldErrors.name ? "border-destructive focus:ring-destructive/20" : ""}
              />
              {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("rdvForm.phoneLabel")}</label>
              <Input
                placeholder={t("rdvForm.phonePh")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={fieldErrors.phone ? "border-destructive focus:ring-destructive/20" : ""}
              />
              {fieldErrors.phone && <p className="text-sm text-destructive">{fieldErrors.phone}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("rdvForm.postalLabel")}</label>
            <Input
              placeholder={t("rdvForm.postalPh")}
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className={fieldErrors.postalCode ? "border-destructive focus:ring-destructive/20" : ""}
            />
            {fieldErrors.postalCode && (
              <p className="text-sm text-destructive">{fieldErrors.postalCode}</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">{t("rdvForm.availabilityTitle")}</label>
            <div className="rounded-lg border border-border/60 bg-secondary/20 p-3 space-y-2">
              {DAYS.map((day) => (
                <div key={day} className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{day}</p>
                  <div className="flex flex-wrap gap-2">
                    {SLOTS.map((slot) => {
                      const key = `${day} : ${slot}`
                      const selected = availability.includes(key)
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleSlot(key)}
                          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                            selected
                              ? "border-primary bg-primary/20 text-primary"
                              : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          }`}
                        >
                          {slot}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            {fieldErrors.availability && (
              <p className="text-sm text-destructive">{fieldErrors.availability}</p>
            )}
            {availability.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t("rdvForm.slotsSelected", { count: availability.length })}
              </p>
            )}
          </div>

          <div className="pt-2 space-y-2">
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("rdvForm.submitting") : t("rdvForm.submit")}
            </Button>
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
