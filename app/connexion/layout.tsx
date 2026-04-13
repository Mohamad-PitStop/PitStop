import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Connexion — PitStop",
  description:
    "Connectez-vous à votre compte PitStop pour accéder à votre historique de diagnostics, vos crédits et vos rendez-vous.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
