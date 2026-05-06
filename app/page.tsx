import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { LandingPage } from "@/components/landing-page"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { JsonLd } from "@/components/json-ld"

export const metadata: Metadata = {
  title: { absolute: "PitStop : diagnostic et estimation auto en Belgique" },
  description:
    "Estimez vos réparations et la valeur de revente de votre véhicule. 1er diagnostic gratuit.",
  alternates: {
    canonical: "/",
    languages: {
      "fr-BE": "/",
      en: "/",
      "nl-BE": "/",
      "x-default": "/",
    },
  },
  openGraph: {
    title: "PitStop : diagnostic et estimation auto en Belgique",
    description:
      "Estimez vos réparations et la valeur de revente de votre véhicule. 1er diagnostic gratuit.",
    url: "/",
  },
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://pitstop-diagnostic.live").replace(/\/$/, "")

export default async function HomePage() {
  const cookieStore = await cookies()
  const user = await getUserFromAuthCookie(cookieStore.toString())
  if (user?.role === "garagiste") redirect("/garage/dashboard")
  return (
    <>
      {/* URL absolue obligatoire : Google compare l'href exact avec l'URL enregistrée
          dans la console OAuth. Un chemin relatif ne passe pas la vérification. */}
      <link rel="privacy-policy" href={`${SITE_URL}/confidentialite`} />
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${SITE_URL}/#organization`,
            name: "PitStop",
            url: SITE_URL,
            logo: `${SITE_URL}/icon.png`,
            description:
              "PitStop est un assistant de diagnostic automobile qui fournit des estimations de réparation transparentes et met en relation les particuliers belges avec un réseau de garages partenaires.",
            areaServed: { "@type": "Country", name: "Belgium" },
            sameAs: [],
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            url: SITE_URL,
            name: "PitStop",
            publisher: { "@id": `${SITE_URL}/#organization` },
            inLanguage: ["fr-BE", "en", "nl-BE"],
          },
        ]}
      />
      <LandingPage />
    </>
  )
}
