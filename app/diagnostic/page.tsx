import type { Metadata } from "next"
import { localizedAlternates } from "@/lib/seo-alternates"
import { headers } from "next/headers"
import { DiagnosticPageContent } from "@/components/diagnostic-page-content"
import { ensureDiagnosticPageAccess } from "@/lib/diagnostic-page-guard"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { JsonLd } from "@/components/json-ld"

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://pitstop-diagnostic.live").replace(/\/$/, "")

export const metadata: Metadata = {
  title: "Diagnostic auto IA",
  description:
    "Décrivez le problème de votre véhicule et obtenez en quelques secondes une estimation des coûts de réparation, un guide DIY et l'accès à des garages partenaires en Belgique.",
  alternates: localizedAlternates("/diagnostic"),
}

export default async function DiagnosticPage() {
  await ensureDiagnosticPageAccess()
  const cookieHeader = (await headers()).get("cookie")
  const user = await getUserFromAuthCookie(cookieHeader)
  /** Session valide + droit diagnostic (déjà vérifié par ensureDiagnosticPageAccess) : pas de modale connexion / invité. */
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Diagnostic automobile par IA",
          serviceType: "Diagnostic automobile",
          provider: { "@id": `${SITE_URL}/#organization` },
          areaServed: { "@type": "Country", name: "Belgium" },
          description:
            "Diagnostic automobile en ligne : décrivez votre panne et recevez une estimation des coûts de réparation, un guide DIY et la mise en relation avec un garage partenaire.",
          url: `${SITE_URL}/diagnostic`,
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "EUR",
            description: "Premier diagnostic offert",
          },
        }}
      />
      <DiagnosticPageContent skipGuestGate={Boolean(user)} />
    </>
  )
}
