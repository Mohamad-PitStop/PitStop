import type { Metadata } from "next"
import { MentionsLegalesView } from "@/components/legal/mentions-legales-view"

export const metadata: Metadata = {
  title: "Mentions légales : PitStop",
  description: "Mentions légales du service PitStop.",
  alternates: { canonical: "/mentions-legales" },
}

export default function MentionsLegalesPage() {
  return <MentionsLegalesView />
}
