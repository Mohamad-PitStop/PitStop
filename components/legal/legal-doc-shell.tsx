"use client"

import type { ReactNode } from "react"
import { useTranslation } from "@/lib/i18n/locale-context"

/** Bannière si la langue UI n’est pas le FR : le texte juridique détaillé reste en français (faisant foi). */
export function LegalDocShell({ children }: { children: ReactNode }) {
  const { locale, t } = useTranslation()
  const note = t("legal.docInFrench").trim()
  return (
    <>
      {locale !== "fr" && note ? (
        <p
          role="note"
          className="mb-6 border-l-2 border-primary/35 bg-primary/5 px-3 py-2 text-sm leading-relaxed text-muted-foreground"
        >
          {note}
        </p>
      ) : null}
      {children}
    </>
  )
}
