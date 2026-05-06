import type { Metadata } from "next"
import { localizedAlternates } from "@/lib/seo-alternates"

export const metadata: Metadata = {
  title: "Créer un compte",
  description:
    "Créez votre compte PitStop gratuitement et obtenez votre premier diagnostic automobile offert. Estimez vos réparations en quelques secondes.",
  alternates: localizedAlternates("/inscription"),
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
