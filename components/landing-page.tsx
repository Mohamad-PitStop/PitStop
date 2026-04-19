"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { LandingStaggerRoot, LandingStaggerItem } from "@/components/landing-stagger"
import { SignupWelcomeOverlay } from "@/components/signup-welcome-overlay"
import { LandingDiagnosticExample } from "@/components/landing-diagnostic-example"
import { LandingPartnerAside } from "@/components/landing-partner-aside"
import { useDiagnosticEntryHrefFromSession } from "@/components/landing-diagnostic-links"
import { useTranslation } from "@/lib/i18n/locale-context"
import { cn } from "@/lib/utils"

const HomeAnimatedBackground = dynamic(
  () => import("@/components/home-animated-background").then((m) => m.HomeAnimatedBackground),
  { ssr: false, loading: () => null }
)
const PartnerContactForm = dynamic(
  () => import("@/components/partner-contact-form").then((m) => m.PartnerContactForm),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />,
  }
)

function HeroSection() {
  const { t } = useTranslation()
  const diagnosticHref = useDiagnosticEntryHrefFromSession()

  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-14 md:px-10 md:pb-28 md:pt-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)",
        }}
      />
      <div className="relative z-10 mx-auto grid max-w-[1360px] items-center gap-12 lg:grid-cols-[1.05fr_minmax(0,520px)] lg:gap-20">
        <LandingStaggerItem index={0}>
          <div className="mb-7 text-[13px] font-medium uppercase tracking-[0.22em] text-primary/90">
            {t("home.v2.eyebrow")}
          </div>
          <h1 className="font-display mb-8 text-[clamp(3rem,5.6vw,5rem)] font-black leading-[1.0] tracking-tight text-foreground">
            {t("home.v2.heroLine1")}
            <br />
            {t("home.v2.heroLine2")}
            <br />
            <span className="text-primary">{t("home.v2.heroLine3")}</span>
          </h1>
          <p className="mb-10 max-w-[520px] text-[18px] leading-[1.7] text-muted-foreground md:text-[19px]">
            {t("home.v2.heroSub")}
          </p>
          <div className="flex flex-wrap items-center gap-3.5">
            <Link
              href={diagnosticHref}
              prefetch={false}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-md bg-primary px-9 text-[15px] font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-opacity hover:opacity-90"
            >
              {t("home.v2.ctaPrimary")}
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="#flow"
              className="inline-flex h-14 items-center justify-center rounded-md border border-border bg-transparent px-8 text-[15px] font-medium text-foreground transition-colors hover:bg-white/[0.04]"
            >
              {t("home.v2.ctaSecondary")}
            </Link>
          </div>

          {/* Social proof — sobre */}
          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border pt-7 text-[14px] text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">FR</span>
              {" · "}
              <span className="font-semibold text-foreground">NL</span>
              {" · "}
              <span className="font-semibold text-foreground">EN</span>
            </span>
            <span className="h-4 w-px bg-border" />
            <span>
              <Link href="/garages" className="underline-offset-4 transition-colors hover:text-foreground hover:underline">
                {t("home.v2.socialProof2Label")}
              </Link>
            </span>
          </div>
        </LandingStaggerItem>

        <LandingStaggerItem index={1} className="flex justify-center lg:justify-end">
          <LandingDiagnosticExample />
        </LandingStaggerItem>
      </div>
    </section>
  )
}

function FlowSection() {
  const { t } = useTranslation()
  const steps = [
    { n: "01", title: t("home.v2.flow1Title"), body: t("home.v2.flow1Body") },
    { n: "02", title: t("home.v2.flow2Title"), body: t("home.v2.flow2Body") },
    { n: "03", title: t("home.v2.flow3Title"), body: t("home.v2.flow3Body") },
  ]
  return (
    <section id="flow" className="border-t border-border px-6 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-[1320px]">
        <LandingStaggerItem index={2}>
          <div className="mb-10 flex items-baseline justify-between md:mb-12">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {t("home.v2.flowLabel")}
            </span>
            <div className="flex gap-4 opacity-50">
              {["FR", "NL", "EN"].map((s) => (
                <span key={s} className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </LandingStaggerItem>
        <div className="grid gap-0 md:grid-cols-3">
          {steps.map((step, i) => (
            <LandingStaggerItem key={step.n} index={3 + i}>
              <div
                className={`relative h-full px-6 py-8 md:px-8 md:py-10 ${
                  i > 0 ? "md:border-l md:border-border" : ""
                }`}
              >
                {i < 2 && (
                  <div className="pointer-events-none absolute right-[-1px] top-[62px] hidden h-px w-8 bg-primary/40 md:block" />
                )}
                <div className="font-display mb-4 text-[72px] font-black leading-none tracking-tight text-primary/30 md:text-[80px]">
                  {step.n}
                </div>
                <h3 className="font-display mb-2.5 text-lg font-bold leading-tight text-foreground">
                  {step.title}
                </h3>
                <p className="text-[13px] leading-[1.75] text-muted-foreground">{step.body}</p>
              </div>
            </LandingStaggerItem>
          ))}
        </div>
      </div>
    </section>
  )
}

function WhySection() {
  const { t } = useTranslation()
  const items = [
    t("home.v2.why1"),
    t("home.v2.why2"),
    t("home.v2.why3"),
    t("home.v2.why4"),
    t("home.v2.why5"),
    t("home.v2.why6"),
  ]
  return (
    <section className="border-t border-border bg-card/60 px-6 py-14 md:px-10 md:py-16">
      <div className="mx-auto max-w-[1320px]">
        <LandingStaggerItem index={6}>
          <div className="mb-8 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {t("home.v2.whyLabel")}
          </div>
        </LandingStaggerItem>
        <div className="grid grid-cols-1 md:grid-cols-3">
          {items.map((item, i) => (
            <LandingStaggerItem key={i} index={7 + i}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-5 md:px-6",
                  i !== items.length - 1 && "border-b border-border",
                  "md:border-b-0",
                  i < 3 && "md:border-b md:border-border",
                  (i + 1) % 3 !== 0 && "md:border-r md:border-border"
                )}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-[13px] text-foreground">{item}</span>
              </div>
            </LandingStaggerItem>
          ))}
        </div>
      </div>
    </section>
  )
}

function PartnerSection() {
  const { t } = useTranslation()
  return (
    <section id="partner" className="border-t border-border px-6 py-16 md:px-10 md:py-20">
      <div className="mx-auto grid max-w-[1320px] items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <LandingStaggerItem index={13}>
          <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/80">
            {t("home.v2.partnerEyebrow")}
          </div>
          <h2 className="font-display mb-5 text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold leading-[1.15] tracking-tight text-foreground">
            {t("home.v2.partnerHeadline")}
          </h2>
          <p className="mb-7 max-w-[420px] text-[14px] leading-[1.8] text-muted-foreground">
            {t("home.v2.partnerBody")}
          </p>
          <Link
            href="/inscription-garage"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90"
          >
            {t("home.v2.partnerCta")}
            <span aria-hidden>→</span>
          </Link>
          <p className="mt-3 text-[11px] text-muted-foreground opacity-80">{t("home.v2.partnerSub")}</p>

          <p className="mt-10 text-[13px] leading-[1.6] text-muted-foreground">
            {t("home.v2.partnerFormTransition")}
          </p>
          <div className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-7">
            <PartnerContactForm />
          </div>
        </LandingStaggerItem>

        <LandingStaggerItem index={14}>
          <LandingPartnerAside />
        </LandingStaggerItem>
      </div>
    </section>
  )
}

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

        <LandingStaggerRoot>
          <main className="flex-1">
            <HeroSection />
            <FlowSection />
            <WhySection />
            <PartnerSection />
          </main>
        </LandingStaggerRoot>

        {/* Footer conservé hors stagger pour SEO / OAuth crawlers */}
        <footer className="mt-auto border-t border-border px-6 py-8 md:px-10">
          <div className="mx-auto flex max-w-[1320px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-[13px] text-muted-foreground">
              {t("footer.rights", { year: String(new Date().getFullYear()) })}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
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
        </footer>
      </div>
    </div>
  )
}
