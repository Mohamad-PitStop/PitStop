"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Wrench, Car } from "lucide-react"
import {
  LandingDiagnosticHeroButton,
  LandingDiagnosticCardLink,
} from "@/components/landing-diagnostic-links"
import { marketingFeatureIcons } from "@/lib/marketing-content"
import { MarketingSteps } from "@/components/marketing-steps"
import { LandingStaggerRoot, LandingStaggerItem } from "@/components/landing-stagger"
import { SignupWelcomeOverlay } from "@/components/signup-welcome-overlay"
import { SignupCancelledToast } from "@/components/signup-cancelled-toast"
import { LandingHeroLogo } from "@/components/landing-hero-logo"
import { useTranslation } from "@/lib/i18n/locale-context"

// Chargements différés : non critiques pour le LCP
const HomeAnimatedBackground = dynamic(
  () => import("@/components/home-animated-background").then((m) => m.HomeAnimatedBackground),
  { ssr: false, loading: () => null }
)
const PartnerContactForm = dynamic(
  () => import("@/components/partner-contact-form").then((m) => m.PartnerContactForm),
  { ssr: false, loading: () => <div className="h-64 rounded-2xl border border-border/60 bg-card animate-pulse" /> }
)

const FEATURE_KEYS = [
  { title: "marketing.feature1Title", desc: "marketing.feature1Desc" },
  { title: "marketing.feature2Title", desc: "marketing.feature2Desc" },
  { title: "marketing.feature3Title", desc: "marketing.feature3Desc" },
] as const

export function LandingPage() {
  const { t } = useTranslation()

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <HomeAnimatedBackground />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />

        <Suspense fallback={null}>
          <SignupWelcomeOverlay />
        </Suspense>
        <SignupCancelledToast />

        <LandingStaggerRoot>
          <main className="flex-1">
            <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.15),transparent)]" />

              <div className="container relative mx-auto flex max-w-6xl flex-col items-center px-4 text-center">
                <LandingStaggerItem index={0} className="mt-8 mb-8 select-none md:mt-0 md:mb-10">
                  <LandingHeroLogo />
                </LandingStaggerItem>

                <LandingStaggerItem index={1}>
                  <h1 className="font-display mb-5 max-w-4xl whitespace-pre-line text-balance text-3xl leading-tight font-bold text-foreground md:text-5xl lg:text-6xl">
                    {t("home.heroTitle")}
                  </h1>
                </LandingStaggerItem>

                <LandingStaggerItem index={2}>
                  <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
                    {t("home.heroSubtitle")}
                  </p>
                </LandingStaggerItem>

                <LandingStaggerItem index={3}>
                  <p className="mb-8 flex min-h-[2.5rem] items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-5 py-2 text-sm font-medium text-primary text-center">
                    <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
                    <span>{t("home.trustBadge")}</span>
                  </p>
                </LandingStaggerItem>

                <LandingStaggerItem index={4}>
                  <div className="mx-auto flex w-full max-w-md flex-col items-stretch justify-center gap-4 sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
                    <LandingDiagnosticHeroButton />
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="h-12 w-full gap-2 border-primary/30 bg-background/50 px-8 text-base backdrop-blur sm:w-auto sm:min-w-[220px]"
                    >
                      <Link href="/vente" className="inline-flex items-center justify-center">
                        <Car className="h-5 w-5 shrink-0" />
                        <span className="text-center">{t("home.ctaEstimateSale")}</span>
                        <ArrowRight className="h-4 w-4 shrink-0 opacity-80" />
                      </Link>
                    </Button>
                  </div>
                </LandingStaggerItem>

                <LandingStaggerItem index={5}>
                  <ul className="m-0 mt-12 flex list-none flex-wrap justify-center gap-x-8 gap-y-3 p-0 text-sm text-muted-foreground">
                    <li className="flex items-center justify-center gap-2 text-center">
                      <CheckCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                      {t("home.bulletFree")}
                    </li>
                    <li className="flex items-center justify-center gap-2 text-center">
                      <CheckCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                      {t("home.bulletData")}
                    </li>
                  </ul>
                </LandingStaggerItem>
              </div>
            </section>

            <section className="border-t border-border/50 bg-card/30 py-14 md:py-20">
              <div className="container mx-auto max-w-6xl px-4">
                <LandingStaggerItem index={6}>
                  <div className="mb-12 text-center md:mb-14">
                    <h2 className="font-display mb-3 text-2xl font-bold text-foreground md:text-3xl">
                      {t("home.sectionTwoTitle")}
                    </h2>
                    <p className="mx-auto max-w-2xl text-muted-foreground">{t("home.sectionTwoSubtitle")}</p>
                  </div>
                </LandingStaggerItem>

                <div className="mx-auto grid max-w-4xl items-stretch gap-6 md:grid-cols-2">
                  <LandingStaggerItem index={7}>
                    <LandingDiagnosticCardLink className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card p-8 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 transition-colors group-hover:bg-primary/20">
                        <Wrench className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-display mb-2 text-xl font-semibold text-foreground">
                        {t("home.cardDiagnosticTitle")}
                      </h3>
                      <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {t("home.cardDiagnosticBody")}
                      </p>
                      <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
                        {t("home.cardDiagnosticCta")}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </LandingDiagnosticCardLink>
                  </LandingStaggerItem>

                  <LandingStaggerItem index={8}>
                    <Link
                      href="/vente"
                      className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card p-8 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                    >
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 transition-colors group-hover:bg-primary/20">
                        <Car className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-display mb-2 text-xl font-semibold text-foreground">
                        {t("home.cardVenteTitle")}
                      </h3>
                      <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {t("home.cardVenteBody")}
                      </p>
                      <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
                        {t("home.cardVenteCta")}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </LandingStaggerItem>
                </div>
              </div>
            </section>

            <section id="avantages" className="border-t border-border/50 py-14 md:py-20">
              <div className="container mx-auto max-w-6xl px-4">
                <LandingStaggerItem index={9}>
                  <div className="mb-12 text-center">
                    <h2 className="font-display mb-4 text-2xl font-bold text-foreground md:text-3xl">
                      {t("home.whyTitle")}
                    </h2>
                    <p className="mx-auto max-w-xl text-muted-foreground">{t("home.whySubtitle")}</p>
                  </div>
                </LandingStaggerItem>

                <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
                  {marketingFeatureIcons.map((Icon, index) => (
                    <LandingStaggerItem key={index} index={10 + index}>
                      <div className="flex flex-col items-center rounded-xl border border-border/50 bg-card p-6 text-center transition-colors hover:border-primary/30">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="mb-2 font-semibold text-foreground">
                          {t(FEATURE_KEYS[index]!.title)}
                        </h3>
                        <p className="text-sm text-muted-foreground">{t(FEATURE_KEYS[index]!.desc)}</p>
                      </div>
                    </LandingStaggerItem>
                  ))}
                </div>
              </div>
            </section>

            <section className="border-t border-border/50 bg-card/20 py-14 md:py-20">
              <div className="container mx-auto max-w-6xl px-4">
                <LandingStaggerItem index={13}>
                  <div className="mb-12 text-center">
                    <h2 className="font-display mb-4 text-2xl font-bold text-foreground md:text-3xl">
                      {t("home.howTitle")}
                    </h2>
                  </div>
                </LandingStaggerItem>
                <LandingStaggerItem index={14}>
                  <MarketingSteps />
                </LandingStaggerItem>
              </div>
            </section>

            <section className="border-t border-border/50 py-14 md:py-20">
              <div className="container mx-auto max-w-4xl px-4">
                <LandingStaggerItem index={15}>
                  <div className="mb-10 text-center">
                    <h2 className="font-display mb-3 text-2xl font-bold text-foreground md:text-3xl">
                      {t("home.partnerTitleLine1")}
                      <br />
                      {t("home.partnerTitleLine2")}
                    </h2>
                    <p className="mx-auto max-w-2xl text-muted-foreground">{t("home.partnerSubtitle")}</p>
                  </div>
                </LandingStaggerItem>

                <LandingStaggerItem index={16}>
                  <div className="mb-6 rounded-xl border border-primary/25 bg-primary/5 p-5 text-center md:p-6">
                    <p className="mx-auto mb-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {t("home.partnerOnlineIntro")}
                    </p>
                    <Button asChild size="lg" className="gap-2">
                      <Link href="/inscription-garage">
                        {t("home.partnerOnlineCta")}
                        <ArrowRight className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                      </Link>
                    </Button>
                    <p className="mx-auto mt-3 max-w-xl text-xs text-muted-foreground">
                      {t("home.partnerOnlineHint")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm md:p-8">
                    <PartnerContactForm />
                  </div>
                </LandingStaggerItem>
              </div>
            </section>

          </main>
        </LandingStaggerRoot>

        {/* Footer hors du système d'animation : garanti visible dans le HTML statique
            pour les robots (Google OAuth, crawlers SEO) sans dépendance JS. */}
        <footer className="mt-auto border-t border-border/50 py-10">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="shrink-0 text-center text-sm text-muted-foreground md:text-left">
                {t("footer.rights", { year: String(new Date().getFullYear()) })}
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground md:justify-end">
                <Link href="/mentions-legales" className="transition-colors hover:text-foreground">
                  {t("footer.legal")}
                </Link>
                <Link href="/confidentialite" className="transition-colors hover:text-foreground">
                  {t("footer.privacy")}
                </Link>
                <Link href="/conditions-generales-vente" className="transition-colors hover:text-foreground">
                  {t("footer.cgv")}
                </Link>
                <Link href="/politique-ia" className="transition-colors hover:text-foreground">
                  {t("footer.aiPolicy")}
                </Link>
                <Link href="/cgp-garages" className="transition-colors hover:text-foreground">
                  {t("footer.cgpGarages")}
                </Link>
                <Link href="/inscription-garage" className="transition-colors hover:text-foreground">
                  {t("footer.garageProfessionals")}
                </Link>
                <Link href="/sla" className="transition-colors hover:text-foreground">
                  {t("footer.sla")}
                </Link>
                <a
                  href="mailto:pitstopbelgique@gmail.com"
                  className="transition-colors hover:text-foreground"
                >
                  {t("footer.contact")}
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
