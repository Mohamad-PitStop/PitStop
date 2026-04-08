"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DirectionsLink } from "@/components/directions-link"
import { partnerGarages, type PartnerGarage } from "@/lib/partners"
import { haversineKm } from "@/lib/distance"
import { useTranslation } from "@/lib/i18n/locale-context"

type Coords = { lat: number; lng: number; label?: string }

async function geocode(q: string): Promise<Coords | null> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { cache: "no-store" })
  const data = await res.json()
  if (!res.ok || !data?.ok) return null
  return { lat: data.lat, lng: data.lng, label: data.label }
}

function mapsDirectionsEmbed(origin: string, destination: string) {
  const o = encodeURIComponent(origin)
  const d = encodeURIComponent(destination)
  return `https://www.google.com/maps?output=embed&saddr=${o}&daddr=${d}`
}

export function GarageFinder() {
  const { t } = useTranslation()
  const [postalCode, setPostalCode] = useState("")
  const [originCoords, setOriginCoords] = useState<Coords | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [garageCoords, setGarageCoords] = useState<Record<string, Coords>>({})

  useEffect(() => {
    let cancelled = false
    async function run() {
      const entries: Array<[string, Coords]> = []
      for (const g of partnerGarages) {
        if (g.lat != null && g.lng != null) {
          entries.push([g.id, { lat: g.lat, lng: g.lng }])
          continue
        }
        const c = await geocode(g.address)
        if (c) entries.push([g.id, c])
      }
      if (!cancelled) setGarageCoords(Object.fromEntries(entries))
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function run() {
      const raw = postalCode.trim()
      if (!raw) {
        setOriginCoords(null)
        setError(null)
        return
      }
      setIsLocating(true)
      setError(null)
      try {
        await new Promise((r) => setTimeout(r, 450))
        if (cancelled) return
        const c = await geocode(`${raw}, Belgique`)
        if (!c) {
          setOriginCoords(null)
          setError(t("garageFinder.postalNotFound"))
          return
        }
        setOriginCoords(c)
      } finally {
        if (!cancelled) setIsLocating(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [postalCode, t])

  const garagesWithDistance = useMemo(() => {
    const origin = originCoords
    if (!origin) return partnerGarages.map((g) => ({ garage: g, km: null as number | null }))

    return partnerGarages
      .map((g) => {
        const c = garageCoords[g.id]
        const km = c ? haversineKm({ lat: origin.lat, lng: origin.lng }, { lat: c.lat, lng: c.lng }) : null
        return { garage: g, km }
      })
      .sort((a, b) => {
        if (a.km == null && b.km == null) return 0
        if (a.km == null) return 1
        if (b.km == null) return -1
        return a.km - b.km
      })
  }, [originCoords, garageCoords])

  const closest = garagesWithDistance[0]?.garage as PartnerGarage | undefined
  const originLabel = postalCode.trim() ? `${postalCode.trim()}, Belgique` : undefined
  const mapUrl = useMemo(() => {
    const origin = postalCode.trim() ? `${postalCode.trim()}, Belgique` : "Belgique"
    const dest = closest?.address ?? partnerGarages[0]?.address
    return mapsDirectionsEmbed(origin, dest)
  }, [postalCode, closest])

  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">{t("garageFinder.referenceTitle")}</CardTitle>
          <CardDescription>{t("garageFinder.referenceDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
            <p className="text-sm font-medium text-foreground">{partnerGarages[0].name}</p>
            <p className="text-sm text-muted-foreground">{partnerGarages[0].address}</p>
            <p className="text-sm text-muted-foreground">
              {t("garageFinder.tel")} {partnerGarages[0].phoneDisplay}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href={`tel:${partnerGarages[0].phoneTel}`}>{t("garageFinder.call")}</a>
            </Button>
            <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
              <DirectionsLink address={partnerGarages[0].address} origin={originLabel}>
                {t("rdvPage.directions")}
              </DirectionsLink>
            </Button>
            <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
              <a href={`/rendez-vous?type=obd-scan`}>{t("garageFinder.scheduleRdv")}</a>
            </Button>
          </div>
        </CardContent>
      </Card>

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
            {isLocating ? <p className="text-xs text-muted-foreground">{t("garageFinder.searchingZone")}</p> : null}
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
          </div>

          <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">{t("garageFinder.partnersList")}</p>
            <div className="space-y-2">
              {garagesWithDistance.map(({ garage, km }) => (
                <div key={garage.id} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-foreground">{garage.name}</p>
                    <p className="text-xs text-muted-foreground">{garage.address}</p>
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {km == null ? "—" : `${km.toFixed(1)} km`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {postalCode.trim() && originCoords ? (
            <div className="rounded-lg overflow-hidden border border-border/50 bg-secondary/30">
              <div className="aspect-[16/9] w-full">
                <iframe
                  title={t("garageFinder.mapIframeTitle")}
                  src={mapUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground">
              {t("garageFinder.mapPlaceholder")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
