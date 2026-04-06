import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { MerciPromoSection } from "@/components/merci-promo-section"
import { CheckCircle, Clock, Mail, Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "Merci d'avoir participé : PitStop",
  description: "Phase de test PitStop terminée. Merci pour votre participation.",
}

export default async function MerciPage({
  searchParams,
}: {
  searchParams?: Promise<{ from?: string }>
}) {
  const params = await searchParams
  const fromDiagnostic = params?.from === "diagnostic"

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl text-center space-y-8">
          {/* Icône principale */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/15">
            <CheckCircle className="h-10 w-10 text-primary" strokeWidth={1.5} />
          </div>

          {/* Titre */}
          <div className="space-y-5">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Merci pour votre participation !
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed text-left rounded-lg border border-border/60 bg-muted/30 px-5 py-4">
              Chaque passage sur PitStop nous aide à affiner le service : nous en sommes sincèrement reconnaissants. En
              phase de test, votre confiance et le temps que vous nous accordez font vraiment la différence pour bâtir un
              outil utile, clair et adapté aux automobilistes.
            </p>
            {fromDiagnostic ? (
              <div className="rounded-xl border border-primary/25 bg-primary/5 px-5 py-4 text-left space-y-3">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  Vos crédits diagnostic sont épuisés pour le moment
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Vous avez utilisé les crédits associés à votre compte. Pendant cette phase pilote, l’achat de crédits
                  supplémentaires n’est pas encore ouvert — c’est une étape que nous réserverons au lancement officiel.
                </p>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  Nous tenions à vous remercier chaleureusement d’avoir expérimenté PitStop : votre retour, même informel,
                  nous éclaire sur ce qui fonctionne et ce que nous pouvons encore améliorer.
                </p>
              </div>
            ) : (
              <p className="text-lg text-muted-foreground leading-relaxed">
                Vous avez utilisé l’ensemble des crédits de diagnostic prévus dans le cadre de cette phase de test. Ce
                que vous nous avez fait vivre sur la plateforme compte énormément pour la suite : merci encore.
              </p>
            )}
          </div>

          {/* Encadré phase de test */}
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-6 py-5 text-left space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
              <Clock className="h-4 w-4 shrink-0" />
              Phase de test : accès temporairement limité
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              PitStop est encore en phase de test restreinte : l’achat de crédits supplémentaires ne figure pas encore à
              notre catalogue, le temps de finaliser l’offre avec le soin qu’elle mérite.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Le lancement public — avec la possibilité d’acheter des crédits et l’ensemble des fonctionnalités prévues —
              suivra dans les prochains mois. Nous avons hâte de vous y retrouver.
            </p>
          </div>

          <MerciPromoSection />

          {/* Contact */}
          <div className="rounded-xl border border-border/50 bg-card px-6 py-5 text-left space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              Une remarque ou un retour à nous faire ?
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Un mot, une suggestion ou une idée : nous les lisons avec attention. Écrivez-nous à{" "}
              <a
                href="mailto:pitstopbelgique@gmail.com"
                className="text-primary hover:underline"
              >
                pitstopbelgique@gmail.com
              </a>
              , nous vous répondrons avec plaisir.
            </p>
          </div>

          {/* CTA */}
          <Button asChild variant="outline" size="lg">
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
