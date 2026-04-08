import type { Metadata } from "next"
import { CgpView } from "@/components/legal/cgp-view"

export const metadata: Metadata = {
  title: "Conditions générales de partenariat : PitStop",
  description: "CGP (B2B) de PitStop pour les garages partenaires.",
}

export default function CgpGaragesPage() {
  return <CgpView />
}
