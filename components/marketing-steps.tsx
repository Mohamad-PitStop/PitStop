"use client"

import { useTranslation } from "@/lib/i18n/locale-context"

const STEP_KEYS = ["marketing.step1", "marketing.step2", "marketing.step3"] as const

/** Grille responsive : 1 colonne sur très petit écran, 3 colonnes alignées dès sm */
export function MarketingSteps() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6 md:gap-10">
      {STEP_KEYS.map((key, i) => {
        const number = i + 1
        return (
          <div key={number} className="flex flex-col items-center px-1 text-center">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground"
              aria-hidden
            >
              {number}
            </div>
            <p className="mx-auto mt-4 max-w-[260px] text-sm leading-snug font-medium text-foreground sm:text-base">
              {t(key)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
