import type { Metadata } from "next"
import { localizedAlternates } from "@/lib/seo-alternates"
import { PolitiqueIaView } from "@/components/legal/politique-ia-view"

export const metadata: Metadata = {
  title: "Politique IA : PitStop",
  description: "Clauses spécifiques liées à l'intelligence artificielle : PitStop.",
  alternates: localizedAlternates("/politique-ia"),
}

export default function PolitiqueIaPage() {
  return <PolitiqueIaView />
}
