import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { LandingPage } from "@/components/landing-page"
import { getUserFromAuthCookie } from "@/lib/auth-session"

export const metadata: Metadata = {
  title: "PitStop : Diagnostic et estimation auto",
  description:
    "Estimez vos réparations et la valeur de revente de votre véhicule. 1er diagnostic gratuit.",
}

export default async function HomePage() {
  const cookieStore = await cookies()
  const user = await getUserFromAuthCookie(cookieStore.toString())
  if (user?.role === "garagiste") redirect("/garage/dashboard")
  return (
    <>
      {/* Balise standard lue par les robots OAuth de Google pour localiser la page
          de confidentialité sans dépendre du rendu JavaScript ni des animations. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <link rel="privacy-policy" href="/confidentialite" />
      <LandingPage />
    </>
  )
}
