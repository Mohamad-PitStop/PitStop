import type { Metadata } from "next"
import { localizedAlternates } from "@/lib/seo-alternates"
import { ConfidentialiteView } from "@/components/legal/confidentialite-view"

export const metadata: Metadata = {
  title: "Politique de confidentialité : PitStop",
  description: "Politique de confidentialité du service PitStop.",
  alternates: localizedAlternates("/confidentialite"),
}

export default function ConfidentialitePage() {
  return <ConfidentialiteView />
}
