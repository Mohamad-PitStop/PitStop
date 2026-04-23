import type { Metadata } from "next"
import { ConfidentialiteView } from "@/components/legal/confidentialite-view"

export const metadata: Metadata = {
  title: "Politique de confidentialité : PitStop",
  description: "Politique de confidentialité du service PitStop.",
  alternates: { canonical: "/confidentialite" },
}

export default function ConfidentialitePage() {
  return <ConfidentialiteView />
}
