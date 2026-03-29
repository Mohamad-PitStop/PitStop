import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { ResultsContent } from "@/components/results-content"

export default function ResultatPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="py-8 md:py-12">
        <Suspense fallback={
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-muted-foreground">Chargement de l'analyse...</p>
              </div>
            </div>
          </div>
        }>
          <ResultsContent />
        </Suspense>
      </main>
    </div>
  )
}
