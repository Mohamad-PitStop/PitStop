import type { Metadata } from "next"
import { SlaView } from "@/components/legal/sla-view"

export const metadata: Metadata = {
  title: "SLA — PitStop",
  description: "Annexe SLA (Service Level Agreement) de la plateforme PitStop.",
  alternates: { canonical: "/sla" },
}

export default function SlaPage() {
  return <SlaView />
}
