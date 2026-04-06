import type { Metadata } from "next"
import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { VENTE_TAB_ENABLED } from "@/lib/feature-flags"
import { CheckCircle, ArrowRight, Wrench, Car } from "lucide-react"
import {
  LandingDiagnosticTabMobile,
  LandingDiagnosticHeroButton,
  LandingDiagnosticCardLink,
  LandingVenteLink,
} from "@/components/landing-diagnostic-links"
import { marketingFeatures } from "@/lib/marketing-content"
import { MarketingSteps } from "@/components/marketing-steps"
import { PartnerContactForm } from "@/components/partner-contact-form"
import { LandingStaggerRoot, LandingStaggerItem } from "@/components/landing-stagger"
import { SignupWelcomeOverlay } from "@/components/signup-welcome-overlay"

export const metadata: Metadata = {
  title: "PitStop : Diagnostic et estimation auto",
  description:
    "Estimez vos réparations et la valeur de revente de votre véhicule. Compte requis pour le diagnostic automobile.",
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <Suspense fallback={null}>
        <SignupWelcomeOverlay />
      </Suspense>

      <LandingStaggerRoot>
      <main className="flex-1 pb-24 md:pb-0">
        {/* Hero : logo centré */}
        <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24">
          <div className="absolute right-4 top-4 z-10 sm:hidden">
            <nav
              className="bg-muted text-muted-foreground inline-flex min-h-9 w-fit items-stretch rounded-lg p-[3px]"
              aria-label="Navigation accueil"
            >
              <LandingDiagnosticTabMobile />
              <LandingVenteLink
                className={cn(
                  "inline-flex min-h-[2.25rem] min-w-[6.5rem] items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-foreground hover:text-foreground/90",
                  !VENTE_TAB_ENABLED && "opacity-75"
                )}
              >
                <Wrench className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                Vente
              </LandingVenteLink>
            </nav>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.15),transparent)] pointer-events-none" />

          <div className="container relative mx-auto max-w-6xl px-4 flex flex-col items-center text-center">
            <LandingStaggerItem index={0} className="mt-8 mb-8 select-none md:mt-0 md:mb-10">
              <Image
                src="/images/pitstop-logo.png"
                alt="PitStop"
                width={560}
                height={160}
                className="h-24 w-auto md:h-32 lg:h-36 mx-auto [-webkit-user-drag:none]"
                priority
                draggable={false}
              />
            </LandingStaggerItem>

            <LandingStaggerItem index={1}>
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-5 max-w-4xl text-balance">
              Votre voiture mérite un diagnostic clair et un prix juste
            </h1>
            </LandingStaggerItem>

            <LandingStaggerItem index={2}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty mb-8">
              PitStop vous aide à estimer vos réparations et à connaître la valeur de revente de votre
              véhicule auprès de nos partenaires.
            </p>
            </LandingStaggerItem>

            <LandingStaggerItem index={3}>
            <p className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
              <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
              Estimations alignées sur le marché belge et approuvées par des professionnels
            </p>
            </LandingStaggerItem>

            <LandingStaggerItem index={4}>
            <div className="flex w-full max-w-md flex-col items-stretch justify-center gap-4 sm:max-w-none sm:flex-row sm:items-center sm:justify-center mx-auto">
              <LandingDiagnosticHeroButton />
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
            </LandingStaggerItem>

            <LandingStaggerItem index={5}>
            <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-12 text-sm text-muted-foreground list-none p-0 m-0">
              <li className="flex items-center justify-center gap-2 text-center">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" aria-hidden />
                Compte requis pour le diagnostic
              </li>
              <li className="flex items-center justify-center gap-2 text-center">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" aria-hidden />
                Données traitées avec soin
              </li>
            </ul>
            </LandingStaggerItem>
          </div>
        </section>

        {/* Blocs services */}
        <section className="py-14 md:py-20 border-t border-border/50 bg-card/30">
          <div className="container mx-auto max-w-6xl px-4">
            <LandingStaggerItem index={6}>
            <div className="text-center mb-12 md:mb-14">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
                Deux parcours, une même exigence
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Choisissez l’espace qui correspond à votre besoin. Vous pourrez toujours explorer l’autre plus tard.
              </p>
            </div>
            </LandingStaggerItem>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
              <LandingStaggerItem index={7}>
              <LandingDiagnosticCardLink className="group flex flex-col rounded-2xl border border-border/60 bg-card p-8 shadow-sm hover:border-primary/40 hover:shadow-md transition-all text-left h-full">
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
              </LandingDiagnosticCardLink>
              </LandingStaggerItem>

              <LandingStaggerItem index={8}>
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
              </LandingStaggerItem>
            </div>
          </div>
        </section>

        {/* Avantages */}
        <section id="avantages" className="py-14 md:py-20 border-t border-border/50">
          <div className="container mx-auto max-w-6xl px-4">
            <LandingStaggerItem index={9}>
            <div className="text-center mb-12">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                Pourquoi PitStop ?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Un outil pensé pour vous donner des repères clairs avant de passer au garage.
              </p>
            </div>
            </LandingStaggerItem>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {marketingFeatures.map((feature, index) => (
                <LandingStaggerItem key={index} index={10 + index}>
                <div
                  className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
                </LandingStaggerItem>
              ))}
            </div>
          </div>
        </section>

        {/* Étapes */}
        <section className="py-14 md:py-20 border-t border-border/50 bg-card/20">
          <div className="container mx-auto max-w-6xl px-4">
            <LandingStaggerItem index={13}>
            <div className="text-center mb-12">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                Comment ça marche ?
              </h2>
            </div>
            </LandingStaggerItem>
            <LandingStaggerItem index={14}>
            <MarketingSteps />
            </LandingStaggerItem>
          </div>
        </section>

        {/* Partenaires garages */}
        <section className="py-14 md:py-20 border-t border-border/50">
          <div className="container mx-auto max-w-4xl px-4">
            <LandingStaggerItem index={15}>
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
                Vous êtes propriétaire d'un garage ?<br />
                Devenez partenaire PitStop
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Rejoignez notre réseau de garages partenaires en Belgique. Remplissez ce formulaire et notre
                équipe vous recontactera rapidement.
              </p>
            </div>
            </LandingStaggerItem>

            <LandingStaggerItem index={16}>
            <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 shadow-sm">
              <PartnerContactForm />
            </div>
            </LandingStaggerItem>
          </div>
        </section>

        <LandingStaggerItem index={17}>
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
                <Link href="/conditions-generales-vente" className="hover:text-foreground transition-colors">
                  Conditions générales de vente
                </Link>
                <Link href="/politique-ia" className="hover:text-foreground transition-colors">
                  Politique IA
                </Link>
                <Link href="/cgp-garages" className="hover:text-foreground transition-colors">
                  CGP garages
                </Link>
                <Link href="/sla" className="hover:text-foreground transition-colors">
                  SLA
                </Link>
                <a href="mailto:pitstopbelgique@gmail.com" className="hover:text-foreground transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
        </LandingStaggerItem>
      </main>
      </LandingStaggerRoot>
    </div>
  )
}
