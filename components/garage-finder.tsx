"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/lib/i18n/locale-context"
import { MapPin, Phone } from "lucide-react"

type DynamicGarage = {
  id: string
  companyName: string
  street: string
  postalCode: string
  city: string
  specialties: string[]
  distance: number | null
}

export function GarageFinder() {
  const { t } = useTranslation()
  const [postalCode, setPostalCode] = useState("")
  const [garages, setGarages] = useState<DynamicGarage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const trimmed = postalCode.trim()
    setLoading(true)
    const url = trimmed
      ? `/api/garages?postalCode=${encodeURIComponent(trimmed)}`
      : "/api/garages"
    const timeout = trimmed ? setTimeout(doFetch, 400) : null
    if (!trimmed) doFetch()

    function doFetch() {
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          if (data.ok) setGarages(data.garages)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [postalCode])

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">{t("garageFinder.findNearTitle")}</CardTitle>
          <CardDescription>{t("garageFinder.findNearDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("garageFinder.yourPostal")}</label>
            <Input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder={t("garageFinder.postalPh")}
              inputMode="numeric"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : garages.length === 0 ? (
            <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground text-center">
              {t("garageFinder.noGarages")}
            </div>
          ) : (
            <div className="space-y-3">
              {garages.map((g) => (
                <Link key={g.id} href={`/garages/${g.id}`} className="block">
                  <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 hover:border-primary/40 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{g.companyName}</p>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {g.street}, {g.postalCode} {g.city}
                        </p>
                        {g.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {g.specialties.slice(0, 4).map((s) => (
                              <span
                                key={s}
                                className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                              >
                                {t(`garage.specialties.${s}`)}
                              </span>
                            ))}
                            {g.specialties.length > 4 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{g.specialties.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {g.distance != null && (
                        <span className="shrink-0 text-sm font-medium text-muted-foreground whitespace-nowrap">
                          {g.distance.toFixed(1)} km
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
