"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DirectionsLink } from "@/components/directions-link"
import { RendezVousForm } from "@/components/rendez-vous-form"
import { BookingCheckout } from "@/components/booking-checkout"
import { useTranslation } from "@/lib/i18n/locale-context"

type Props = {
  isObd: boolean
  isCarWash: boolean
  bookingType: string
  priceMin?: number
  priceMax?: number
  garageName: string
  garageAddress: string
  garagePhoneDisplay: string
  garagePhoneTel: string
  mapsEmbedUrl: string
}

export function RendezVousPageContent({
  isObd,
  isCarWash,
  bookingType,
  priceMin,
  priceMax,
  garageName,
  garageAddress,
  garagePhoneDisplay,
  garagePhoneTel,
  mapsEmbedUrl,
}: Props) {
  const { t } = useTranslation()

  const partnerDesc = isObd
    ? t("rdvPage.partnerDescObd")
    : isCarWash
      ? t("rdvPage.partnerDescWash")
      : t("rdvPage.partnerDescDefault")

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/resultat" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          {t("rdvPage.backToResult")}
        </Link>
      </div>

      <Card className="border-primary/30 bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">{t("rdvPage.partnerTitle")}</CardTitle>
          <CardDescription>{partnerDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">{t("rdvPage.garageNameLabel")}</p>
                <p className="text-sm text-muted-foreground">{garageName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t("rdvPage.addressLabel")}</p>
                <p className="text-sm text-muted-foreground">{garageAddress}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("rdvPage.phone")}</p>
                  <p className="text-sm text-muted-foreground">{garagePhoneDisplay}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t("rdvPage.hoursLabel")}</p>
                  <p className="text-sm text-muted-foreground">{t("rdvPage.hoursByAppointment")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button asChild size="lg" className="w-full">
              <a href={`tel:${garagePhoneTel}`}>{t("rdvPage.callGarage")}</a>
            </Button>
            <Button asChild size="lg" variant="secondary" className="w-full">
              <DirectionsLink address={garageAddress}>{t("rdvPage.directions")}</DirectionsLink>
            </Button>
          </div>

          <div className="rounded-lg overflow-hidden border border-border/50 bg-secondary/30">
            <div className="aspect-[16/9] w-full">
              <iframe
                title={t("rdvPage.mapIframeTitle", { name: garageName })}
                src={mapsEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full"
              />
            </div>
          </div>

          <div className="border-t border-border/40 pt-4">
            <BookingCheckout type={bookingType} priceMin={priceMin} priceMax={priceMax} noCard />
          </div>
        </CardContent>
      </Card>

      <RendezVousForm isObd={isObd} />
    </div>
  )
}
