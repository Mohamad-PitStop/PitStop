"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/locale-context"
import { useDiagnosticEntryHrefFromSession } from "@/components/landing-diagnostic-links"
import { cn } from "@/lib/utils"

type LiteData = {
  marque: string
  modele: string
  annee: string
  kilometrage: string
  probleme: string
}

const EMPTY_FULL_FORM = {
  marque: "",
  modele: "",
  variante: "",
  carburant: "",
  transmission: "",
  annee: "",
  kilometrage: "",
  probleme: "",
  cylindree: "",
  puissance: "",
  nombrePortes: "",
  typeCarrosserie: "",
  typeBoiteAuto: "",
}

export function LandingVehicleFormLite() {
  const { t } = useTranslation()
  const router = useRouter()
  const diagnosticHref = useDiagnosticEntryHrefFromSession()
  const [data, setData] = useState<LiteData>({
    marque: "",
    modele: "",
    annee: "",
    kilometrage: "",
    probleme: "",
  })
  const [submitting, setSubmitting] = useState(false)

  function update<K extends keyof LiteData>(key: K, value: string) {
    setData((d) => ({ ...d, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = { ...EMPTY_FULL_FORM, ...data }
      sessionStorage.setItem("pendingFormData", JSON.stringify(payload))
    } catch {
      /* sessionStorage indisponible : on continue quand même */
    }
    router.push(diagnosticHref)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[480px] rounded-2xl border border-border bg-card p-6 shadow-[0_24px_64px_rgba(0,0,0,0.4)] md:p-7"
      aria-label={t("home.v2.liteTitle")}
    >
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/85">
        {t("home.v2.liteTitle")}
      </div>
      <p className="mb-5 text-[13px] leading-[1.6] text-muted-foreground">
        {t("home.v2.liteSubtitle")}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <LiteField
          label={t("home.v2.liteBrand")}
          name="marque"
          value={data.marque}
          onChange={(v) => update("marque", v)}
          placeholder={t("home.v2.liteBrandPh")}
          autoComplete="off"
        />
        <LiteField
          label={t("home.v2.liteModel")}
          name="modele"
          value={data.modele}
          onChange={(v) => update("modele", v)}
          placeholder={t("home.v2.liteModelPh")}
          autoComplete="off"
        />
        <LiteField
          label={t("home.v2.liteYear")}
          name="annee"
          value={data.annee}
          onChange={(v) => update("annee", v.replace(/\D/g, "").slice(0, 4))}
          placeholder={t("home.v2.liteYearPh")}
          inputMode="numeric"
          autoComplete="off"
        />
        <LiteField
          label={t("home.v2.liteKm")}
          name="kilometrage"
          value={data.kilometrage}
          onChange={(v) => update("kilometrage", v.replace(/\D/g, "").slice(0, 7))}
          placeholder={t("home.v2.liteKmPh")}
          inputMode="numeric"
          autoComplete="off"
        />
      </div>

      <div className="mt-3">
        <label
          htmlFor="lite-probleme"
          className="mb-1.5 block text-[11px] uppercase tracking-[0.08em] text-muted-foreground"
        >
          {t("home.v2.liteProblem")}
        </label>
        <textarea
          id="lite-probleme"
          rows={3}
          value={data.probleme}
          onChange={(e) => update("probleme", e.target.value)}
          placeholder={t("home.v2.liteProblemPh")}
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2.5 text-[13.5px] leading-[1.55] text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/60"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className={cn(
          "mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-[14px] font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity",
          submitting ? "opacity-70" : "hover:opacity-90"
        )}
      >
        {submitting ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
        ) : (
          <>
            {t("home.v2.liteSubmit")}
            <span aria-hidden>→</span>
          </>
        )}
      </button>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        {t("home.v2.liteHint")}
      </p>
    </form>
  )
}

function LiteField({
  label,
  name,
  value,
  onChange,
  placeholder,
  inputMode,
  autoComplete,
}: {
  label: string
  name: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  autoComplete?: string
}) {
  return (
    <div>
      <label
        htmlFor={`lite-${name}`}
        className="mb-1.5 block text-[11px] uppercase tracking-[0.08em] text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={`lite-${name}`}
        name={name}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-[13.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/60"
      />
    </div>
  )
}
