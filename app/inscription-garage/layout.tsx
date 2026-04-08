import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Inscription garage partenaire | PitStop",
  description:
    "Inscrivez votre garage sur PitStop : compte professionnel, créneaux, réservations et paiements.",
}

export default function InscriptionGarageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
