import type { Metadata } from "next"
import { LandingPage } from "@/components/landing-page"

export const metadata: Metadata = {
  title: "PitStop : Diagnostic et estimation auto",
  description:
    "Estimez vos réparations et la valeur de revente de votre véhicule. 1er diagnostic gratuit.",
}

export default function HomePage() {
  return <LandingPage />
}
