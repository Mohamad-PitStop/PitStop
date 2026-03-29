import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { getSiteUrl } from "@/lib/stripe"

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
    | { ok: true; reservation: { status: string; startAt: string; timeZone: string } }
    | { ok: false; error: string }
  >
}

export default async function RendezVousSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ session_id?: string; payment_intent?: string }>
}) {
  const params = await searchParams
  const sessionId = params?.session_id
  const paymentIntent = params?.payment_intent

  const data = sessionId || paymentIntent ? await getStatus({ session_id: sessionId, payment_intent: paymentIntent }) : null

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
                <CardTitle className="text-foreground">Paiement confirmé</CardTitle>
                <CardDescription>
                  {data?.ok
                    ? "Votre réservation est en cours de confirmation dans le calendrier du garage."
                    : "Nous finalisons votre réservation."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data?.ok ? (
                  <div className="rounded-lg border border-border/50 bg-secondary/20 p-4">
                    <p className="text-sm text-foreground">
                      Statut: <span className="font-medium">{data.reservation.status}</span>
                    </p>
                  </div>
                ) : data && !data.ok ? (
                  <p className="text-sm text-muted-foreground">{data.error}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Merci. Vous pouvez revenir à la page rendez-vous.
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href="/rendez-vous">Retour aux rendez-vous</Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                    <Link href="/resultat">Retour au diagnostic</Link>
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

