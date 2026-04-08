import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { ResultsContent } from "@/components/results-content"
import { ResultatLoadingFallback } from "@/components/resultat-loading-fallback"

export default function ResultatPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="py-8 md:py-12">
        <Suspense fallback={<ResultatLoadingFallback />}>
          <ResultsContent />
        </Suspense>
      </main>
    </div>
  )
}
