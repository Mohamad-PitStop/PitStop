import { redirect } from "next/navigation"

/** Évite une 404 sur /garage : même point d’entrée que le lien « Espace garage ». */
export default function GarageIndexPage() {
  redirect("/garage/dashboard")
}
