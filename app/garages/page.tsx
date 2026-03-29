import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { GarageFinder } from "@/components/garage-finder"

export default function GaragesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <Link
                href="/resultat"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Retour au diagnostic
              </Link>
            </div>

            <GarageFinder />
          </div>
        </div>
      </main>
    </div>
  )
}

