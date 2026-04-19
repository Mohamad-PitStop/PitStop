import type { Metadata } from "next"
import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { ResultsContent } from "@/components/results-content"
import { ResultatLoadingFallback } from "@/components/resultat-loading-fallback"

export const metadata: Metadata = {
  title: "Résultat du diagnostic — PitStop",
  robots: { index: false, follow: false },
}

export default function ResultatPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="py-8 md:py-12">
        <Suspense fallback={<ResultatLoadingFallback />}>
          <ResultsContent />
        </Suspense>
      </main>
    </div>
  )
}
