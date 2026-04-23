import type { Metadata } from "next"
import { headers } from "next/headers"
import { DiagnosticPageContent } from "@/components/diagnostic-page-content"
import { ensureDiagnosticPageAccess } from "@/lib/diagnostic-page-guard"
import { getUserFromAuthCookie } from "@/lib/auth-session"

export const metadata: Metadata = {
  title: "Diagnostic auto IA — PitStop",
  description:
    "Décrivez le problème de votre véhicule et obtenez en quelques secondes une estimation des coûts de réparation, un guide DIY et l'accès à des garages partenaires en Belgique.",
  alternates: { canonical: "/diagnostic" },
}

export default async function DiagnosticPage() {
  await ensureDiagnosticPageAccess()
  const cookieHeader = (await headers()).get("cookie")
  const user = await getUserFromAuthCookie(cookieHeader)
  /** Session valide + droit diagnostic (déjà vérifié par ensureDiagnosticPageAccess) : pas de modale connexion / invité. */
  return <DiagnosticPageContent skipGuestGate={Boolean(user)} />
}
