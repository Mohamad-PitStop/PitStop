import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { GaragesPageContent } from "@/components/garages-page-content"

export const metadata: Metadata = {
  title: "Garages partenaires — PitStop",
  description:
    "Trouvez un garage de confiance près de chez vous en Belgique. Prenez rendez-vous directement depuis votre diagnostic PitStop.",
}

export default function GaragesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <GaragesPageContent />
        </div>
      </main>
    </div>
  )
}
