import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { MerciPromoSection } from "@/components/merci-promo-section"
import { CheckCircle, Clock, Mail } from "lucide-react"

export const metadata: Metadata = {
  title: "Merci d'avoir participé : PitStop",
  description: "Phase de test PitStop terminée. Merci pour votre participation.",
}

export default function MerciPage() {
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
          <div className="space-y-3">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Merci pour votre participation !
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Vous avez utilisé tous vos crédits de diagnostic dans le cadre de la phase de test de PitStop. Votre retour nous est précieux.
            </p>
          </div>

          {/* Encadré phase de test */}
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-6 py-5 text-left space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
              <Clock className="h-4 w-4 shrink-0" />
              Phase de test : accès temporairement limité
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              PitStop est actuellement en phase de test restreinte. L&apos;achat de crédits supplémentaires n&apos;est pas encore proposé.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Le lancement officiel de PitStop : avec accès libre à l&apos;achat de crédits et à l&apos;ensemble des fonctionnalités : interviendra prochainement.
            </p>
          </div>

          <MerciPromoSection />

          {/* Contact */}
          <div className="rounded-xl border border-border/50 bg-card px-6 py-5 text-left space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              Une remarque ou un retour à nous faire ?
            </div>
            <p className="text-sm text-muted-foreground">
              Votre avis nous aide à améliorer le service avant le lancement officiel. N&apos;hésitez pas à nous écrire à{" "}
              <a
                href="mailto:pitstopbelgique@gmail.com"
                className="text-primary hover:underline"
              >
                pitstopbelgique@gmail.com
              </a>
              .
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
