"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/locale-context"
import { MapPin, Phone, Mail, Clock } from "lucide-react"
import type { BusinessHours } from "@/lib/garage-db"

type GarageProfile = {
  id: string
  companyName: string
  street: string
  postalCode: string
  city: string
  specialties: string[]
  businessHours: BusinessHours
  professionalPhone: string
  professionalEmail: string
}

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const

export default function GarageProfilePage() {
  const { t } = useTranslation()
  const params = useParams()
  const garageId = params.garageId as string
  const [garage, setGarage] = useState<GarageProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/garages/${garageId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setGarage(data.garage)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [garageId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </main>
      </div>
    )
  }

  if (!garage) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto max-w-2xl px-4 py-14 text-center">
          <p className="text-muted-foreground">Garage non trouvé.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-2xl px-4 py-14 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{garage.companyName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
              <span>{garage.street}, {garage.postalCode} {garage.city}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${garage.professionalPhone}`} className="hover:underline">{garage.professionalPhone}</a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${garage.professionalEmail}`} className="hover:underline">{garage.professionalEmail}</a>
            </div>
          </CardContent>
        </Card>

        {/* Specialties */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("garage.profile.specialties")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {garage.specialties.map((s) => (
                <span key={s} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {t(`garage.specialties.${s}`)}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Business hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" /> {t("garage.profile.hours")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {DAYS.map((day) => {
                const ranges = garage.businessHours[day] || []
                return (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="font-medium">{t(`garage.days.${day}`)}</span>
                    <span className="text-muted-foreground">
                      {ranges.length === 0
                        ? t("garage.profile.closed")
                        : ranges.map((r) => `${r.start} - ${r.end}`).join(", ")}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Button asChild className="w-full" size="lg">
          <Link href={`/rendez-vous?garageId=${garage.id}`}>
            {t("garage.profile.bookAppointment")}
          </Link>
        </Button>
      </main>
    </div>
  )
}
