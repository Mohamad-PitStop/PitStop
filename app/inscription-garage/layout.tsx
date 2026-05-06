import type { Metadata } from "next"
import { localizedAlternates } from "@/lib/seo-alternates"

export const metadata: Metadata = {
  title: "Inscription garage partenaire | PitStop",
  description:
    "Inscrivez votre garage sur PitStop : compte professionnel, créneaux, réservations et paiements.",
  alternates: localizedAlternates("/inscription-garage"),
}

export default function InscriptionGarageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
