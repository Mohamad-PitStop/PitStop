import type { Metadata } from "next"
import { localizedAlternates } from "@/lib/seo-alternates"
import { VentePageContent } from "@/components/vente-page-content"
import { JsonLd } from "@/components/json-ld"

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://pitstop-diagnostic.live").replace(/\/$/, "")

export const metadata: Metadata = {
  title: "Tarifs et crédits",
  description:
    "Achetez des crédits de diagnostic automobile et accédez à des estimations de réparation fiables. Offre de lancement disponible pour les particuliers belges.",
  alternates: localizedAlternates("/vente"),
}

export default function VentePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Crédits de diagnostic PitStop",
          description:
            "Crédits prépayés permettant de lancer des diagnostics automobiles approfondis avec estimation des coûts.",
          brand: { "@id": `${SITE_URL}/#organization` },
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}/vente`,
          },
        }}
      />
      <VentePageContent />
    </>
  )
}
