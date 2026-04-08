import { Navbar } from "@/components/navbar"
import { RendezVousPageContent } from "@/components/rendez-vous-page-content"

export default async function RendezVousPage({
  searchParams,
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
  const mapsEmbedUrl =
    "https://www.openstreetmap.org/export/embed.html?bbox=4.351%2C50.424%2C4.371%2C50.444&layer=mapnik&marker=50.43432%2C4.36125"

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <RendezVousPageContent
            isObd={isObd}
            isCarWash={isCarWash}
            bookingType={bookingType}
            priceMin={priceMin}
            priceMax={priceMax}
            garageName={garageName}
            garageAddress={garageAddress}
            garagePhoneDisplay={garagePhoneDisplay}
            garagePhoneTel={garagePhoneTel}
            mapsEmbedUrl={mapsEmbedUrl}
          />
        </div>
      </main>
    </div>
  )
}
