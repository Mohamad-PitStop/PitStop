import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Créer un compte — PitStop",
  description:
    "Créez votre compte PitStop gratuitement et obtenez votre premier diagnostic automobile offert. Estimez vos réparations en quelques secondes.",
  alternates: { canonical: "/inscription" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
