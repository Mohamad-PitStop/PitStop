import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { VENTE_TAB_ENABLED } from "@/lib/feature-flags"
import { CheckCircle, ArrowRight, Wrench, Car } from "lucide-react"
import { marketingFeatures } from "@/lib/marketing-content"
import { MarketingSteps } from "@/components/marketing-steps"
import { PartnerContactForm } from "@/components/partner-contact-form"

export const metadata: Metadata = {
  title: "PitStop — Diagnostic et estimation auto",
  description:
    "Estimez vos réparations et la valeur de revente de votre véhicule. Transparent, rapide, sans inscription.",
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pb-24 md:pb-0">
        {/* Hero — logo centré */}
        <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24">
          <div className="absolute left-4 top-6 z-10 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200 md:left-6 md:top-6">
            Phase de test
          </div>
          <div className="absolute right-4 top-4 z-10 sm:hidden">
            <nav
              className="bg-muted text-muted-foreground inline-flex min-h-9 w-fit items-stretch rounded-lg p-[3px]"
              aria-label="Navigation accueil"
            >
              <Link
                href="/diagnostic"
                className="inline-flex min-h-[2.25rem] min-w-[6.5rem] items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-foreground hover:text-foreground/90"
              >
                Diagnostic
              </Link>
              <Link
                href="/vente"
                className={cn(
                  "inline-flex min-h-[2.25rem] min-w-[6.5rem] items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-foreground hover:text-foreground/90",
                  !VENTE_TAB_ENABLED && "opacity-75"
                )}
                title={!VENTE_TAB_ENABLED ? "Fonctionnalité en cours de mise en production" : undefined}
              >
                <Wrench className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                Vente
              </Link>
            </nav>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.15),transparent)] pointer-events-none" />

          <div className="container relative mx-auto max-w-6xl px-4 flex flex-col items-center text-center">
            <div className="mt-8 mb-8 select-none md:mt-0 md:mb-10">
              <Image
                src="/images/pitstop-logo.png"
                alt="PitStop"
                width={560}
                height={160}
                className="h-24 w-auto md:h-32 lg:h-36 mx-auto [-webkit-user-drag:none]"
                priority
                draggable={false}
              />
            </div>

            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-5 max-w-4xl text-balance">
              Votre voiture mérite un diagnostic clair et un prix juste
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty mb-8">
              PitStop vous aide à estimer vos réparations et à connaître la valeur de revente de votre
              véhicule auprès de nos partenaires.
            </p>

            <p className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
              <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
              Estimations alignées sur le marché belge et approuvées par des professionnels
            </p>

            <div className="flex w-full max-w-md flex-col items-stretch justify-center gap-4 sm:max-w-none sm:flex-row sm:items-center sm:justify-center mx-auto">
              <Button
                asChild
                size="lg"
                className="h-12 w-full px-8 text-base gap-2 shadow-lg shadow-primary/20 sm:w-auto sm:min-w-[220px]"
              >
                <Link href="/diagnostic" className="inline-flex items-center justify-center">
                  <Wrench className="h-5 w-5 shrink-0" />
                  <span className="text-center">Diagnostic & réparation</span>
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-80" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 w-full px-8 text-base gap-2 border-primary/30 bg-background/50 backdrop-blur sm:w-auto sm:min-w-[220px]"
              >
                <Link href="/vente" className="inline-flex items-center justify-center">
                  <Car className="h-5 w-5 shrink-0" />
                  <span className="text-center">Estimer la vente</span>
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-80" />
                </Link>
              </Button>
            </div>

            <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-12 text-sm text-muted-foreground list-none p-0 m-0">
              <li className="flex items-center justify-center gap-2 text-center">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" aria-hidden />
                1er diagnostic offert
              </li>
              <li className="flex items-center justify-center gap-2 text-center">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" aria-hidden />
                Données traitées avec soin
              </li>
            </ul>
          </div>
        </section>

        {/* Blocs services */}
        <section className="py-14 md:py-20 border-t border-border/50 bg-card/30">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-12 md:mb-14">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
                Deux parcours, une même exigence
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Choisissez l’espace qui correspond à votre besoin — vous pourrez toujours explorer l’autre plus tard.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
              <Link
                href="/diagnostic"
                className="group flex flex-col rounded-2xl border border-border/60 bg-card p-8 shadow-sm hover:border-primary/40 hover:shadow-md transition-all text-left h-full"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Wrench className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">Diagnostic</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-1">
                  Décrivez le symptôme, votre véhicule et recevez une fourchette de prix, des conseils et les options pour
                  avancer sereinement.
                </p>
                <span className="text-primary text-sm font-medium inline-flex items-center gap-1 mt-auto">
                  Commencer
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>

              <Link
                href="/vente"
                className="group flex flex-col rounded-2xl border border-border/60 bg-card p-8 shadow-sm hover:border-primary/40 hover:shadow-md transition-all text-left h-full"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">Vente</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-1">
                  Estimez la valeur de reprise par un garage partenaire et préparez votre vente avec des repères
                  réalistes.
                </p>
                <span className="text-primary text-sm font-medium inline-flex items-center gap-1 mt-auto">
                  Estimer ma voiture
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Avantages */}
        <section id="avantages" className="py-14 md:py-20 border-t border-border/50">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                Pourquoi PitStop ?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Un outil pensé pour vous donner des repères clairs avant de passer au garage.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {marketingFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Étapes */}
        <section className="py-14 md:py-20 border-t border-border/50 bg-card/20">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                Comment ça marche ?
              </h2>
            </div>
            <MarketingSteps />
          </div>
        </section>

        {/* Partenaires garages */}
        <section className="py-14 md:py-20 border-t border-border/50">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
                Vous êtes propriétaire d'un garage ? Devenez partenaire PitStop
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Rejoignez notre réseau de garages partenaires en Belgique. Remplissez ce formulaire pro et notre
                équipe vous recontacte rapidement.
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 shadow-sm">
              <PartnerContactForm />
            </div>
          </div>
        </section>

        <footer className="py-10 mt-auto border-t border-border/50">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="text-sm text-muted-foreground text-center md:text-left shrink-0">
                © {new Date().getFullYear()} PitStop. Tous droits réservés.
              </div>
              <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <Link href="/mentions-legales" className="hover:text-foreground transition-colors">
                  Mentions légales
                </Link>
                <Link href="/confidentialite" className="hover:text-foreground transition-colors">
                  Confidentialité
                </Link>
                <a href="mailto:amoudialiahmad@gmail.com" className="hover:text-foreground transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
