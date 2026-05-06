import type { Metadata } from "next"
import { findGarageById } from "@/lib/garage-db"
import { localizedAlternates } from "@/lib/seo-alternates"
import { JsonLd } from "@/components/json-ld"

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://pitstop-diagnostic.live").replace(/\/$/, "")

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const
const SCHEMA_DAYS: Record<(typeof DAY_KEYS)[number], string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
}

type Props = { params: Promise<{ garageId: string }>; children: React.ReactNode }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { garageId } = await params
  const garage = await findGarageById(garageId).catch(() => null)
  if (!garage || garage.status !== "approved") {
    return { robots: { index: false, follow: false } }
  }
  const title = `${garage.companyName}, garage à ${garage.city}`
  const description = `Garage partenaire PitStop à ${garage.city} (${garage.postalCode}). Prenez rendez-vous en ligne après votre diagnostic.`
  return {
    title,
    description,
    alternates: localizedAlternates(`/garages/${garageId}`),
    openGraph: { title, description, url: `/garages/${garageId}`, type: "website" },
  }
}

export default async function GarageLayout({ params, children }: Props) {
  const { garageId } = await params
  const garage = await findGarageById(garageId).catch(() => null)
  if (!garage || garage.status !== "approved") return <>{children}</>

  const specialties: string[] = (() => {
    try {
      return JSON.parse(garage.specialties) as string[]
    } catch {
      return []
    }
  })()

  const businessHours = (() => {
    try {
      return JSON.parse(garage.businessHours) as Record<string, { start: string; end: string }[]>
    } catch {
      return null
    }
  })()

  const openingHoursSpecification = businessHours
    ? DAY_KEYS.flatMap((day) =>
        (businessHours[day] ?? []).map((slot) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: SCHEMA_DAYS[day],
          opens: slot.start,
          closes: slot.end,
        })),
      )
    : []

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AutoRepair",
          "@id": `${SITE_URL}/garages/${garageId}#business`,
          name: garage.companyName,
          url: `${SITE_URL}/garages/${garageId}`,
          telephone: garage.professionalPhone,
          email: garage.professionalEmail,
          address: {
            "@type": "PostalAddress",
            streetAddress: garage.street,
            postalCode: garage.postalCode,
            addressLocality: garage.city,
            addressCountry: garage.country || "BE",
          },
          areaServed: { "@type": "Country", name: "Belgium" },
          ...(specialties.length ? { knowsAbout: specialties } : {}),
          ...(openingHoursSpecification.length ? { openingHoursSpecification } : {}),
        }}
      />
      {children}
    </>
  )
}
