import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DirectionsLink } from "@/components/directions-link"
import { RendezVousForm } from "@/components/rendez-vous-form"
import { BookingCheckout } from "@/components/booking-checkout"

export default async function RendezVousPage({
  searchParams
}: {
  searchParams?: Promise<{ type?: string; priceMin?: string; priceMax?: string }>
}) {
  const params = await searchParams
  const isObd = params?.type === "obd-scan"
  const isCarWash = params?.type === "lavage-auto"
  const bookingType = isObd ? "obd-scan" : isCarWash ? "lavage-auto" : "rendez-vous"
  const priceMin = params?.priceMin ? Number(params.priceMin) : undefined
  const priceMax = params?.priceMax ? Number(params.priceMax) : undefined
  const garageName = "ADI\u2011Cars | Garage PitStop Officiel."
  const garageAddress = "Route de Trazegnies 738, 6031 Charleroi"
  const garagePhoneDisplay = "+32 483 00 00 30"
  const garagePhoneTel = "+32483000030"
  // OpenStreetMap embed : coordonnées exactes de Route de Trazegnies 738, 6031 Charleroi
  const mapsEmbedUrl =
    "https://www.openstreetmap.org/export/embed.html?bbox=4.351%2C50.424%2C4.371%2C50.444&layer=mapnik&marker=50.43432%2C4.36125"

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <Link
                href="/resultat"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Retour au diagnostic
              </Link>
            </div>

            <Card className="border-primary/30 bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Garage partenaire</CardTitle>
                <CardDescription>
                  {isObd
                    ? "Voici les coordonnées du garage partenaire pour votre premier scan OBD."
                    : isCarWash
                      ? "Voici les coordonnées du partenaire pour votre rendez-vous de lavage auto."
                      : "Voici les coordonnées du garage partenaire pour votre rendez-vous."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Nom du garage</p>
                      <p className="text-sm text-muted-foreground">{garageName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Adresse</p>
                      <p className="text-sm text-muted-foreground">{garageAddress}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">Téléphone</p>
                        <p className="text-sm text-muted-foreground">{garagePhoneDisplay}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Horaires</p>
                        <p className="text-sm text-muted-foreground">Sur rendez-vous</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button asChild size="lg" className="w-full">
                    <a href={`tel:${garagePhoneTel}`}>Appeler le garage</a>
                  </Button>
                  <Button asChild size="lg" variant="secondary" className="w-full">
                    <DirectionsLink address={garageAddress}>Itinéraire</DirectionsLink>
                  </Button>
                </div>

                <div className="rounded-lg overflow-hidden border border-border/50 bg-secondary/30">
                  <div className="aspect-[16/9] w-full">
                    <iframe
                      title={`Carte Google Maps - ${garageName}`}
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
        </div>
      </main>
    </div>
  )
}

