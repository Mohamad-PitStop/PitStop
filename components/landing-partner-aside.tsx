"use client"

import { useTranslation } from "@/lib/i18n/locale-context"

export function LandingPartnerAside() {
  const { t } = useTranslation()

  const steps = [
    {
      n: "01",
      title: t("home.v2.partnerStep1Title"),
      desc: t("home.v2.partnerStep1Desc"),
    },
    {
      n: "02",
      title: t("home.v2.partnerStep2Title"),
      desc: t("home.v2.partnerStep2Desc"),
    },
    {
      n: "03",
      title: t("home.v2.partnerStep3Title"),
      desc: t("home.v2.partnerStep3Desc"),
    },
  ]

  const included = [
    t("home.v2.partnerIncl1"),
    t("home.v2.partnerIncl2"),
    t("home.v2.partnerIncl3"),
    t("home.v2.partnerIncl4"),
    t("home.v2.partnerIncl5"),
  ]

  const faqs = [
    { q: t("home.v2.partnerFaqQ1"), a: t("home.v2.partnerFaqA1") },
    { q: t("home.v2.partnerFaqQ2"), a: t("home.v2.partnerFaqA2") },
    { q: t("home.v2.partnerFaqQ3"), a: t("home.v2.partnerFaqA3") },
    { q: t("home.v2.partnerFaqQ4"), a: t("home.v2.partnerFaqA4") },
  ]

  return (
    <div className="flex w-full flex-col gap-5">
      {/* Warm welcome — réutilisation explicite d'Inter avec le brand */}
      <div>
        <div className="font-sans text-[26px] font-bold leading-[1.2] text-foreground md:text-[28px]">
          {t("home.v2.partnerAsideWelcome")}
          <span>
            Pit<span className="text-primary">Stop</span>
          </span>
        </div>
        <p className="mt-2.5 text-[13px] leading-[1.65] text-muted-foreground">
          {t("home.v2.partnerAsideWelcomeSub")}
        </p>
      </div>

      {/* Card 1 — Journey */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-7">
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/85">
          {t("home.v2.partnerJourneyKicker")}
        </div>
        <h3 className="font-display mb-5 text-[17px] font-bold leading-tight text-foreground">
          {t("home.v2.partnerJourneyTitle")}
        </h3>
        <ol className="space-y-4">
          {steps.map((step) => (
            <li key={step.n} className="flex gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-[13px] font-bold text-primary">
                {step.n}
              </div>
              <div className="pt-0.5">
                <div className="text-[13.5px] font-semibold leading-tight text-foreground">
                  {step.title}
                </div>
                <div className="mt-1.5 text-[12.5px] leading-[1.6] text-muted-foreground">
                  {step.desc}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Card 2 — Included */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-7">
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/85">
          {t("home.v2.partnerIncludedKicker")}
        </div>
        <h3 className="font-display mb-5 text-[17px] font-bold leading-tight text-foreground">
          {t("home.v2.partnerIncludedTitle")}
        </h3>
        <ul className="space-y-2.5">
          {included.map((item) => (
            <li key={item} className="flex items-center gap-3 text-[13px] text-foreground">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                  <path
                    d="M1.5 5L4 7.5L8.5 2.5"
                    className="stroke-primary"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Card 3 — FAQ */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-7">
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/85">
          {t("home.v2.partnerFaqKicker")}
        </div>
        <h3 className="font-display mb-5 text-[17px] font-bold leading-tight text-foreground">
          {t("home.v2.partnerFaqTitle")}
        </h3>
        <dl className="space-y-4">
          {faqs.map((item) => (
            <div key={item.q}>
              <dt className="text-[13px] font-semibold text-foreground">{item.q}</dt>
              <dd className="mt-1 text-[12.5px] leading-[1.6] text-muted-foreground">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
