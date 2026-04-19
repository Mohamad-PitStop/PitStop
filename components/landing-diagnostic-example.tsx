"use client"

import Link from "next/link"
import { useTranslation } from "@/lib/i18n/locale-context"
import { useDiagnosticEntryHrefFromSession } from "@/components/landing-diagnostic-links"

export function LandingDiagnosticExample() {
  const { t } = useTranslation()
  const diagnosticHref = useDiagnosticEntryHrefFromSession()

  return (
    <div className="flex w-full max-w-[500px] flex-col gap-4">
      {/* Card 1 — Example report */}
      <div
        className="rounded-2xl border border-border bg-card shadow-[0_24px_64px_rgba(0,0,0,0.4)]"
        aria-label={t("home.v2.exLabel")}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/85">
            {t("home.v2.exLabel")}
          </div>
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2 w-2 rounded-full bg-primary/60" />
            <span className="h-2 w-2 rounded-full bg-border" />
            <span className="h-2 w-2 rounded-full bg-border" />
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="mb-1 text-[13px] font-semibold text-foreground">
            {t("home.v2.exVehicle")}
          </div>
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            <span className="uppercase tracking-[0.08em] opacity-80">
              {t("home.v2.exEngineLabel")}
            </span>
            <span>·</span>
            <span>{t("home.v2.exEngineValue")}</span>
          </div>
          <p className="mb-4 text-[13px] leading-[1.6] text-muted-foreground">
            {t("home.v2.exSymptom")}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <ReportCell
              label={t("home.v2.exCauseLabel")}
              value={t("home.v2.exCauseValue")}
            />
            <ReportCell
              label={t("home.v2.exSeverityLabel")}
              value={t("home.v2.exSeverityValue")}
              dotClassName="bg-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Card 2 — Pricing comparator + warm message + CTA */}
      <div className="rounded-2xl border border-border bg-card shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
        <div className="px-6 py-5">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t("home.v2.exCompareLabel")}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
            <div className="rounded-md border border-border bg-background/50 px-3 py-3">
              <div className="mb-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                {t("home.v2.exCompareGarageLabel")}
              </div>
              <div className="text-[17px] font-bold leading-none text-muted-foreground">
                {t("home.v2.exCompareGarageValue")}
              </div>
              <div className="mt-1.5 text-[10px] leading-[1.4] text-muted-foreground">
                {t("home.v2.exCompareGarageHint")}
              </div>
            </div>

            <div className="flex items-center justify-center" aria-hidden>
              <svg width="28" height="16" viewBox="0 0 28 16" fill="none" className="text-primary">
                <path
                  d="M1 8H25M25 8L19 2M25 8L19 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="rounded-md border border-primary/60 bg-primary/10 px-3 py-3 shadow-[0_0_0_1px_rgba(34,197,94,0.15)]">
              <div className="mb-1 text-[10px] uppercase tracking-[0.08em] text-primary">
                {t("home.v2.exComparePitstopLabel")}
              </div>
              <div className="text-[17px] font-bold leading-none text-primary">
                {t("home.v2.exComparePitstopValue")}
              </div>
              <div className="mt-1.5 text-[10px] leading-[1.4] text-muted-foreground">
                {t("home.v2.exComparePitstopHint")}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M20 12V22H4V12M22 7H2V12H22V7ZM12 22V7M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7ZM12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold leading-tight text-foreground">
                {t("home.v2.exFreeMessageTitle")}
              </div>
              <div className="mt-1 text-[11.5px] leading-[1.5] text-muted-foreground">
                {t("home.v2.exFreeMessageSub")}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border px-6 py-5">
          <Link
            href={diagnosticHref}
            prefetch={false}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-[14px] font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90"
          >
            {t("home.v2.exCta")}
            <span aria-hidden>→</span>
          </Link>
          <p className="mt-3 text-center text-[10.5px] leading-[1.5] text-muted-foreground">
            {t("home.v2.exDisclaimer")}
          </p>
        </div>
      </div>
    </div>
  )
}

function ReportCell({
  label,
  value,
  dotClassName,
}: {
  label: string
  value: string
  dotClassName?: string
}) {
  return (
    <div className="flex flex-col rounded-md border border-border bg-background/50 px-3 py-2.5">
      <div className="mb-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </div>
      <div className="flex items-center gap-1.5 text-[12.5px] font-medium leading-[1.3] text-foreground">
        {dotClassName && (
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClassName}`} aria-hidden />
        )}
        <span>{value}</span>
      </div>
    </div>
  )
}
