"use client"

import Link from "next/link"
import { useState } from "react"
import { useTranslation } from "@/lib/i18n/locale-context"
import { cn } from "@/lib/utils"

type Step = 0 | 1 | 2

const DOTS = ["#ff5f57", "#ffbd2e", "#28c841"]

export function LandingDiagnosticMock() {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>(0)
  const [vehicle, setVehicle] = useState("Peugeot 208 · 2019")
  const [symIdx, setSymIdx] = useState(0)
  const [loading, setLoading] = useState(false)

  const symptoms = [
    t("home.v2.mockSym1"),
    t("home.v2.mockSym2"),
    t("home.v2.mockSym3"),
    t("home.v2.mockSym4"),
    t("home.v2.mockSym5"),
  ]

  const garages = [
    { name: t("home.v2.mockG1Name"), dist: "2.3 km", rating: "4.7", slot: t("home.v2.mockG1Slot"), avail: true },
    { name: t("home.v2.mockG2Name"), dist: "5.1 km", rating: "4.9", slot: t("home.v2.mockG2Slot"), avail: true },
    { name: t("home.v2.mockG3Name"), dist: "8.4 km", rating: "4.5", slot: t("home.v2.mockG3Slot"), avail: false },
  ]

  function handleAnalyse() {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStep(1)
    }, 900)
  }

  return (
    <div className="w-full max-w-[420px] overflow-hidden rounded-xl border border-border bg-card shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-[#0e1d3d] px-4 py-2.5">
        <div className="flex gap-1.5">
          {DOTS.map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-full opacity-70" style={{ background: c }} />
          ))}
        </div>
        <span className="ml-2 text-[11px] tracking-wide text-muted-foreground">pitstop-diagnostic.live</span>
        <div className="ml-auto flex gap-1">
          {([0, 1, 2] as Step[]).map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              aria-label={`Étape ${i + 1}`}
              className={cn(
                "h-1 w-[22px] rounded-sm transition-colors",
                step === i ? "bg-primary" : "bg-border hover:bg-border/80"
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {step === 0 && (
          <div>
            <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/80">
              {t("home.v2.mockTitle")}
            </div>

            {/* Vehicle */}
            <div className="mb-4">
              <label className="mb-1.5 block text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                {t("home.v2.mockVehicle")}
              </label>
              <div className="flex overflow-hidden rounded-md border border-border bg-background">
                <div className="flex w-7 shrink-0 flex-col items-center justify-between bg-[#003DA5] px-0.5 py-1">
                  <span className="text-[8px] font-extrabold text-[#F5C400]">B</span>
                  <span className="text-[10px] text-[#F5C400]">★</span>
                </div>
                <input
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  placeholder={t("home.v2.mockVehiclePh")}
                  className="flex-1 bg-transparent px-3 py-2 text-sm font-semibold tracking-wide text-foreground outline-none placeholder:text-muted-foreground/70"
                />
              </div>
            </div>

            {/* Symptom */}
            <div className="mb-5">
              <label className="mb-1.5 block text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                {t("home.v2.mockSymptom")}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {symptoms.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSymIdx(i)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      symIdx === i
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAnalyse}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  {t("home.v2.mockAnalysing")}
                </>
              ) : (
                t("home.v2.mockAnalyse")
              )}
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/80">
              {t("home.v2.mockResultLabel")}
            </div>
            <div className="mb-3 rounded-md border border-primary/25 bg-background px-4 py-3.5">
              <div className="mb-1 font-mono text-base font-bold text-primary">
                {t("home.v2.mockResultRange")}
              </div>
              <div className="inline-block rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] tracking-wide text-amber-400">
                {t("home.v2.mockResultSev")}
              </div>
            </div>
            <p className="mb-5 text-[13px] leading-relaxed text-muted-foreground">
              {t("home.v2.mockResultBody")}
            </p>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t("home.v2.mockResultCta")} →
            </button>
            <button
              type="button"
              onClick={() => setStep(0)}
              className="mt-2 w-full rounded-md border border-border bg-transparent px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("home.v2.mockBack")}
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/80">
              {t("home.v2.mockGarages")}
            </div>
            <div className="space-y-2">
              {garages.map((g, i) => (
                <Link
                  key={i}
                  href="/garages"
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3.5 py-3 transition-colors hover:border-primary/40"
                >
                  <div className="min-w-0">
                    <div className="mb-0.5 truncate text-[13px] font-medium text-foreground">{g.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {g.dist} · ★ {g.rating} ·{" "}
                      <span className={g.avail ? "text-primary" : "text-muted-foreground"}>{g.slot}</span>
                    </div>
                  </div>
                  <span className="text-lg text-primary/70">→</span>
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(0)}
              className="mt-3 w-full rounded-md border border-border bg-transparent px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("home.v2.mockBack")}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
