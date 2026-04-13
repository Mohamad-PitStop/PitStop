import type { Metadata } from "next"
import { VentePageContent } from "@/components/vente-page-content"

export const metadata: Metadata = {
  title: "Tarifs et crédits — PitStop",
  description:
    "Achetez des crédits de diagnostic automobile et accédez à des estimations de réparation fiables. Offre de lancement disponible pour les particuliers belges.",
}

export default function VentePage() {
  return <VentePageContent />
}
