"use client"

import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/locale-context"
import type { Locale } from "@/lib/i18n/types"
import { LOCALES } from "@/lib/i18n/types"

const localeLabels: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
  nl: "NL",
}

type Props = {
  /** `header` : à côté du badge (desktop uniquement via classes parent). `mobile` : barre fixe bas d’écran. */
  variant: "header" | "mobile"
  className?: string
}

export function LanguageSwitcher({ variant, className }: Props) {
  const { locale, setLocale, t } = useTranslation()

  return (
    <div
      role="group"
      aria-label={t("lang.aria.choose")}
      className={cn(
        variant === "header" &&
          "hidden xl:inline-flex items-center gap-0.5 rounded-lg border border-border/60 bg-muted/40 p-0.5",
        variant === "mobile" &&
          "xl:hidden fixed bottom-0 left-0 right-0 z-[45] flex items-center justify-center gap-1 border-t border-border/60 bg-background/95 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.12)]",
        className
      )}
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={cn(
            "inline-flex h-8 w-9 shrink-0 items-center justify-center rounded-md px-0 py-1 text-xs font-semibold transition-colors",
            variant === "mobile" && "min-h-11 h-11 w-12 text-sm",
            locale === code
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          aria-pressed={locale === code}
          lang={code === "nl" ? "nl" : code === "en" ? "en" : "fr"}
        >
          {localeLabels[code]}
        </button>
      ))}
    </div>
  )
}
