import type { Metadata } from "next"
import { localizedAlternates } from "@/lib/seo-alternates"
import { CgvView } from "@/components/legal/cgv-view"

export const metadata: Metadata = {
  title: "Conditions générales de vente : PitStop",
  description: "CGV (B2C) de PitStop pour les clients particuliers en Belgique.",
  alternates: localizedAlternates("/conditions-generales-vente"),
}

export default function ConditionsGeneralesVentePage() {
  return <CgvView />
}
