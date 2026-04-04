import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { getSiteUrl } from "@/lib/stripe"
import { CheckCircle, Euro, Calendar, Info, XCircle } from "lucide-react"
import { formatInTimeZone } from "date-fns-tz"
import { fr } from "date-fns/locale"

async function getStatus(params: { session_id?: string; payment_intent?: string }) {
  const base = getSiteUrl()
  const q = params.session_id
    ? `session_id=${encodeURIComponent(params.session_id)}`
    : params.payment_intent
      ? `payment_intent=${encodeURIComponent(params.payment_intent)}`
      : ""
  if (!q) return null
  const res = await fetch(`${base}/api/reservation/status?${q}`, { cache: "no-store" })
  return res.json() as Promise<
    | {
        ok: true
        reservation: { status: string; startAt: string; endAt: string; timeZone: string; name: string; type: string }
        payment: {
          depositAmountCents?: number
          priceMinEuros?: number
          priceMaxEuros?: number
          paymentStatus?: string
        }
      }
    | { ok: false; error: string }
  >
}

function formatDateTime(iso: string, timeZone = "Europe/Brussels") {
  try {
    return formatInTimeZone(new Date(iso), timeZone, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })
  } catch {
    return iso
  }
}

export default async function RendezVousSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ session_id?: string; payment_intent?: string }>
}) {
  const params = await searchParams
  const sessionId = params?.session_id
  const paymentIntent = params?.payment_intent

  const data = sessionId || paymentIntent
    ? await getStatus({ session_id: sessionId, payment_intent: paymentIntent })
    : null

  const isPaid = data?.ok && data.payment.paymentStatus === "paid"
  const isCancelled = data?.ok && data.payment.paymentStatus !== "paid"

  const depositEuros = isPaid ? (data!.payment.depositAmountCents ?? 0) / 100 : null
  const priceMin = isPaid ? data!.payment.priceMinEuros ?? null : null
  const priceMax = isPaid ? data!.payment.priceMaxEuros ?? null : null

  const remainingMin = depositEuros != null && priceMin != null ? Math.max(0, priceMin - depositEuros) : null
  const remainingMax = depositEuros != null && priceMax != null ? Math.max(0, priceMax - depositEuros) : null
  const hasRemainingInfo = remainingMin != null && remainingMax != null

  // Payment was not completed (cancelled, failed, or still pending)
  if (isCancelled) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <Link href="/rendez-vous" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  ← Retour
                </Link>
              </div>
              <Card className="border-destructive/30 bg-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                      <XCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">Paiement annulé</CardTitle>
                      <CardDescription>
                        Le paiement n&apos;a pas été complété. Votre réservation n&apos;a pas été confirmée.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Aucun montant n&apos;a été débité. Vous pouvez recommencer la réservation à tout moment.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button asChild size="lg" className="w-full sm:w-auto">
                      <Link href="/rendez-vous">Réessayer</Link>
                    </Button>
                    <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                      <Link href="/">Accueil</Link>
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
              <Link
                href="/rendez-vous"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Retour
              </Link>
            </div>

            <Card className="border-primary/30 bg-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">Paiement confirmé ✓</CardTitle>
                    <CardDescription>
                      {isPaid
                        ? "Votre réservation est enregistrée. Le créneau a été bloqué dans le calendrier du garage."
                        : "Nous finalisons votre réservation."}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {isPaid ? (
                  <>
                    {/* Créneau réservé */}
                    <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Votre rendez-vous</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {formatDateTime(data!.reservation.startAt, data!.reservation.timeZone || "Europe/Brussels")}
                        </p>
                        {data!.reservation.name && (
                          <p className="text-sm text-muted-foreground">Au nom de : {data!.reservation.name}</p>
                        )}
                      </div>
                    </div>

                    {/* Acompte payé */}
                    {depositEuros != null && depositEuros > 0 && (
                      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 flex items-start gap-3">
                        <Euro className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            Acompte encaissé : <span className="text-green-400 font-bold">{depositEuros}€</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Ce montant sera déduit du total de la prestation lors de votre passage au garage.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Reste à payer */}
                    {hasRemainingInfo && (
                      <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 flex items-start gap-3">
                        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Reste à régler au garage</p>
                          <p className="text-sm text-muted-foreground">
                            À la fin de la prestation, il vous restera à payer directement au garage entre{" "}
                            <span className="font-semibold text-foreground">{remainingMin}€</span>
                            {" "}et{" "}
                            <span className="font-semibold text-foreground">{remainingMax}€</span>
                            {" "}(acompte de {depositEuros}€ déjà déduit).
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            Ces montants sont des estimations basées sur le diagnostic. Le garagiste établira le devis définitif après examen du véhicule.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : data && !data.ok ? (
                  <p className="text-sm text-muted-foreground">{data.error}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Merci. Votre paiement a bien été reçu.
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href="/resultat">Retour au diagnostic</Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                    <Link href="/">Accueil</Link>
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
