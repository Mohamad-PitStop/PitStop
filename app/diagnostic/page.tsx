import { Navbar } from "@/components/navbar"
import { VehicleForm } from "@/components/vehicle-form"
import { CheckCircle, Info } from "lucide-react"

export default function DiagnosticPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <section className="relative overflow-hidden py-14 md:py-20">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

          <div className="container mx-auto max-w-6xl px-4 relative">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex max-w-full items-center justify-center gap-1.5 px-2 py-1.5 sm:gap-2 sm:px-4 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[12px] font-medium leading-tight whitespace-nowrap sm:text-sm sm:leading-normal mb-5 text-center">
                <CheckCircle className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                Estimations approuvées par des professionnels
              </div>

              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4 text-balance">
                Votre devis en quelques secondes
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                Obtenez une estimation fiable et transparente pour vos réparations automobiles. Comparez les prix et
                prenez la meilleure décision.
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
              <VehicleForm />

              {/* Disclaimer */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30 border border-border/50">
                <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" aria-hidden />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Avertissement</p>
                  <p>
                    Ces estimations sont construites pour vous fournir un diagnostic fiable et un devis cohérent avec les standards du marché belge. 
                    Les garages partenaires PitStop s&apos;engagent à s&apos;aligner sur les montants annoncés, sauf découverte technique majeure lors du contrôle physique du véhicule.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
