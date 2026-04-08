"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { CheckCircle, Euro, Calendar, Info, XCircle, XOctagon } from "lucide-react"
import { formatInTimeZone } from "date-fns-tz"
import { fr, enGB, nl } from "date-fns/locale"
import { useMemo } from "react"
import { useTranslation } from "@/lib/i18n/locale-context"

export type RdvSuccessPaidData = {
  reservation: {
    status: string
    startAt: string
    endAt: string
    timeZone: string
    name: string
    type: string
    cancelToken: string | null
  }
  payment: {
    depositAmountCents?: number
    priceMinEuros?: number
    priceMaxEuros?: number
    paymentStatus?: string
  }
}

export function RendezVousSuccessView({
  cancelled,
  isPaid,
  paidData,
  depositEuros,
  remainingMin,
  remainingMax,
  hasRemainingInfo,
  apiError,
}: {
  cancelled: boolean
  isPaid: boolean
  paidData: RdvSuccessPaidData | null
  depositEuros: number | null
  remainingMin: number | null
  remainingMax: number | null
  hasRemainingInfo: boolean
  apiError: string | null
}) {
  const { t, locale } = useTranslation()
  const dateFnsLocale = useMemo(
    () => (locale === "en" ? enGB : locale === "nl" ? nl : fr),
    [locale]
  )

  function formatDateTime(iso: string, timeZone = "Europe/Brussels") {
    try {
      return formatInTimeZone(new Date(iso), timeZone, "PPPp", { locale: dateFnsLocale })
    } catch {
      return iso
    }
  }

  if (cancelled) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <Link href="/rendez-vous" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("rdvSuccess.back")}
                </Link>
              </div>
              <Card className="border-destructive/30 bg-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                      <XCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">{t("rdvSuccess.paymentCancelledTitle")}</CardTitle>
                      <CardDescription>{t("rdvSuccess.paymentCancelledDesc")}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{t("rdvSuccess.noCharge")}</p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button asChild size="lg" className="w-full sm:w-auto">
                      <Link href="/rendez-vous">{t("rdvSuccess.retry")}</Link>
                    </Button>
                    <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                      <Link href="/">{t("rdvSuccess.home")}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <Link href="/rendez-vous" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t("rdvSuccess.back")}
              </Link>
            </div>

            <Card className="border-primary/30 bg-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">{t("rdvSuccess.titlePaid")}</CardTitle>
                    <CardDescription>
                      {isPaid ? t("rdvSuccess.descPaid") : t("rdvSuccess.descPending")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {isPaid ? (
                  <>
                    <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{t("rdvSuccess.yourAppointment")}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {paidData &&
                            formatDateTime(
                              paidData.reservation.startAt,
                              paidData.reservation.timeZone || "Europe/Brussels"
                            )}
                        </p>
                        {paidData?.reservation.name && (
                          <p className="text-sm text-muted-foreground">
                            {t("rdvSuccess.namePrefix")} {paidData.reservation.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {depositEuros != null && depositEuros > 0 && (
                      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 flex items-start gap-3">
                        <Euro className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            {t("rdvSuccess.depositTitle")}{" "}
                            <span className="text-green-400 font-bold">{depositEuros}€</span>
                          </p>
                          <p className="text-sm text-muted-foreground">{t("rdvSuccess.depositNote")}</p>
                        </div>
                      </div>
                    )}

                    {hasRemainingInfo && remainingMin != null && remainingMax != null && depositEuros != null && (
                      <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 flex items-start gap-3">
                        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">{t("rdvSuccess.remainderTitle")}</p>
                          <p className="text-sm text-muted-foreground">
                            {t("rdvSuccess.remainderBody", {
                              min: remainingMin,
                              max: remainingMax,
                              deposit: depositEuros,
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">{t("rdvSuccess.remainderFootnote")}</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : apiError ? (
                  <p className="text-sm text-muted-foreground">{apiError}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("rdvSuccess.thanksPaid")}</p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href="/resultat">{t("rdvSuccess.backDiagnostic")}</Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                    <Link href="/">{t("rdvSuccess.home")}</Link>
                  </Button>
                </div>

                {paidData?.reservation.cancelToken && (
                  <div className="rounded-lg border border-border/40 bg-muted/20 p-4 flex items-start gap-3">
                    <XOctagon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{t("rdvSuccess.cancelTitle")}</p>
                      <p className="text-sm text-muted-foreground">{t("rdvSuccess.cancelDesc")}</p>
                      <Link
                        href={`/rendez-vous/annuler?token=${paidData.reservation.cancelToken}`}
                        className="text-sm text-destructive hover:underline"
                      >
                        {t("rdvSuccess.cancelLink")}
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
