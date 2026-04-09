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
  return <LandingPage />
}
