import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { SaleEstimator } from "@/components/sale-estimator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VENTE_TAB_ENABLED } from "@/lib/feature-flags"
import { CheckCircle, Info, Wrench } from "lucide-react"

/** Contenu complet du parcours Vente — affiché lorsque `VENTE_TAB_ENABLED` est `true` dans `lib/feature-flags.ts`. */
function VentePageFull() {
  return (
    <>
      <main className="flex-1">
        <section className="relative overflow-hidden py-14 md:py-20">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

          <div className="container relative mx-auto max-w-6xl px-4">
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <div className="mb-5 inline-flex max-w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-primary/20 bg-primary/10 px-2 py-1.5 text-center text-[12px] font-medium leading-tight text-primary sm:px-4 sm:py-2 sm:text-sm sm:leading-normal">
                <CheckCircle className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                Estimation rapide et fiable de la valeur de revente
              </div>

              <h1 className="font-display mb-4 text-balance text-3xl font-bold leading-tight text-foreground md:text-4xl lg:text-5xl">
                Vente de votre véhicule
              </h1>

              <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
                Renseignez les informations de votre véhicule et obtenez une estimation de son prix de vente idéal. Nos
                garages partenaires seront informés de l&apos;offre et vous recontacteront dans les plus brefs délais.
              </p>
            </div>

            <div className="mx-auto max-w-4xl space-y-6">
              <SaleEstimator />

              <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-secondary/30 p-4">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" aria-hidden />
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2 font-medium text-foreground">Avertissement</p>
                  <p className="mb-3">
                    Ces estimations sont établies pour vous donner une fourchette de reprise et une analyse cohérentes
                    avec les standards du marché belge. Les garages partenaires PitStop s&apos;engagent à des propositions
                    alignées sur ces ordres de grandeur, sous réserve de la vérification physique du véhicule.
                  </p>
                  <p>
                    Il est contre-productif de minorer ou d&apos;exagérer l&apos;état réel de votre voiture : une
                    inspection du véhicule sera de toute façon effectuée au garage. Toute différence importante avec les
                    informations fournies peut entraîner un ajustement de l&apos;offre de reprise et nuire à la confiance
                    avec le professionnel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

function VenteComingSoon() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-lg border-border/60 bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
            <Wrench className="h-6 w-6 text-primary" aria-hidden />
          </div>
          <CardTitle className="font-display text-xl md:text-2xl">Estimation de reprise</CardTitle>
          <CardDescription className="text-base leading-relaxed text-muted-foreground">
            Cette fonctionnalité est en cours de mise en production. Nous préparons un parcours dédié pour estimer la
            valeur de reprise de votre véhicule auprès de notre réseau de garages partenaires en Belgique. Elle sera
            prochainement disponible — merci de votre patience.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="default" className="w-full sm:w-auto">
            <Link href="/diagnostic">Aller au diagnostic</Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}

export default function VentePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      {VENTE_TAB_ENABLED ? <VentePageFull /> : <VenteComingSoon />}
    </div>
  )
}
