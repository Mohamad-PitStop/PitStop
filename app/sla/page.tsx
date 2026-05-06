import type { Metadata } from "next"
import { localizedAlternates } from "@/lib/seo-alternates"
import { SlaView } from "@/components/legal/sla-view"

export const metadata: Metadata = {
  title: "SLA",
  description: "Annexe SLA (Service Level Agreement) de la plateforme PitStop.",
  alternates: localizedAlternates("/sla"),
}

export default function SlaPage() {
  return <SlaView />
}
