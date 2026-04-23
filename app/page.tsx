import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { LandingPage } from "@/components/landing-page"
import { getUserFromAuthCookie } from "@/lib/auth-session"

export const metadata: Metadata = {
  title: "PitStop : Diagnostic et estimation auto",
  description:
    "Estimez vos réparations et la valeur de revente de votre véhicule. 1er diagnostic gratuit.",
  alternates: { canonical: "/" },
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
      <LandingPage />
    </>
  )
}
