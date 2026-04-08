"use client"

import { FormEvent, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/locale-context"
import { SpecialtyMultiSelect } from "@/components/garage/specialty-multi-select"
import { GarageHoursEditor } from "@/components/garage/garage-hours-editor"
import type { BusinessHours } from "@/lib/garage-db"
import type { GarageSpecialty } from "@/lib/garage-specialties"
import { Mail } from "lucide-react"

const DEFAULT_HOURS: BusinessHours = {
  mon: [{ start: "09:00", end: "17:00" }],
  tue: [{ start: "09:00", end: "17:00" }],
  wed: [{ start: "09:00", end: "17:00" }],
  thu: [{ start: "09:00", end: "17:00" }],
  fri: [{ start: "09:00", end: "17:00" }],
  sat: [{ start: "09:00", end: "12:00" }],
  sun: [],
}

export default function InscriptionGaragePage() {
  const { t } = useTranslation()

  // Mode toggle
  const [isEmployee, setIsEmployee] = useState(false)

  // Company fields (owner mode)
  const [companyName, setCompanyName] = useState("")
  const [bceTva, setBceTva] = useState("")
  const [street, setStreet] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [city, setCity] = useState("")
  const [iban, setIban] = useState("")
  const [professionalPhone, setProfessionalPhone] = useState("")
  const [professionalEmail, setProfessionalEmail] = useState("")
  const [managerName, setManagerName] = useState("")
  const [specialties, setSpecialties] = useState<GarageSpecialty[]>([])
  const [businessHours, setBusinessHours] = useState<BusinessHours>(DEFAULT_HOURS)

  // Personal account fields (both modes)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Employee-only field
  const [garageCode, setGarageCode] = useState("")

  // State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (isEmployee) {
        // Employee signup
        const res = await fetch("/api/auth/signup-garage-employee", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, garageCode }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || "Erreur lors de l'inscription.")
        setPendingEmail(email.toLowerCase())
      } else {
        // Owner signup
        const res = await fetch("/api/auth/signup-garage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName, bceTvaNumber: bceTva, street, postalCode, city, iban,
            professionalPhone, professionalEmail, managerName,
            specialties, businessHours, name, email, password,
          }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || "Erreur lors de l'inscription.")
        setPendingEmail(email.toLowerCase())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Success screen
  if (pendingEmail) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="py-14">
          <div className="container mx-auto max-w-xl px-4">
            <Card className="border-border/60 bg-card text-center">
              <CardContent className="py-12 space-y-4">
                <Mail className="mx-auto h-12 w-12 text-primary" />
                <h2 className="text-xl font-semibold">{t("garage.registration.pendingVerification")}</h2>
                {!isEmployee && (
                  <p className="text-sm text-muted-foreground">{t("garage.registration.pendingApproval")}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-14">
        <div className="container mx-auto max-w-2xl px-4">
          <Card className="border-border/60 bg-card">
            <CardHeader>
              <CardTitle>{t("garage.registration.title")}</CardTitle>
              <CardDescription>{t("garage.registration.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-6">
                {/* Toggle employee mode */}
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={isEmployee}
                    onChange={(e) => setIsEmployee(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">{t("garage.registration.joinExisting")}</span>
                </label>

                {!isEmployee && (
                  <>
                    {/* Company info */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground">{t("garage.registration.companySection")}</h3>
                      <Input placeholder={t("garage.registration.companyName")} value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                      <Input placeholder={t("garage.registration.bceTva")} value={bceTva} onChange={(e) => setBceTva(e.target.value)} required />
                      <Input placeholder={t("garage.registration.street")} value={street} onChange={(e) => setStreet(e.target.value)} required />
                      <div className="grid grid-cols-2 gap-3">
                        <Input placeholder={t("garage.registration.postalCode")} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
                        <Input placeholder={t("garage.registration.city")} value={city} onChange={(e) => setCity(e.target.value)} required />
                      </div>
                      <Input placeholder={t("garage.registration.iban")} value={iban} onChange={(e) => setIban(e.target.value)} required />
                      <Input placeholder={t("garage.registration.professionalPhone")} type="tel" value={professionalPhone} onChange={(e) => setProfessionalPhone(e.target.value)} required />
                      <Input placeholder={t("garage.registration.professionalEmail")} type="email" value={professionalEmail} onChange={(e) => setProfessionalEmail(e.target.value)} required />
                      <Input placeholder={t("garage.registration.managerName")} value={managerName} onChange={(e) => setManagerName(e.target.value)} required />
                    </div>

                    {/* Specialties */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground">{t("garage.registration.specialtiesSection")}</h3>
                      <SpecialtyMultiSelect value={specialties} onChange={setSpecialties} />
                    </div>

                    {/* Business hours */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground">{t("garage.registration.hoursSection")}</h3>
                      <p className="text-xs text-muted-foreground">{t("garage.registration.hoursDescription")}</p>
                      <GarageHoursEditor value={businessHours} onChange={setBusinessHours} />
                    </div>
                  </>
                )}

                {isEmployee && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">{t("garage.registration.employeeSection")}</h3>
                    <div>
                      <Input
                        placeholder={t("garage.registration.garageCodePlaceholder")}
                        value={garageCode}
                        onChange={(e) => setGarageCode(e.target.value.toUpperCase())}
                        maxLength={8}
                        required
                        className="font-mono tracking-wider"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">{t("garage.registration.garageCodeHelp")}</p>
                    </div>
                  </div>
                )}

                {/* Personal account */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">{t("garage.registration.accountSection")}</h3>
                  <Input placeholder={t("garage.registration.name")} value={name} onChange={(e) => setName(e.target.value)} required />
                  <Input placeholder={t("garage.registration.email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  <Input placeholder={t("garage.registration.password")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                </div>

                {error && (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t("garage.registration.submitting") : t("garage.registration.submit")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
