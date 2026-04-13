import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe — PitStop",
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
