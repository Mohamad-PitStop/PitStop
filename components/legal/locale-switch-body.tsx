"use client"

import type { ReactNode } from "react"
import { useTranslation } from "@/lib/i18n/locale-context"

export function LocaleSwitchBody({
  fr,
  en,
  nl,
}: {
  fr: ReactNode
  en: ReactNode
  nl: ReactNode
}) {
  const { locale } = useTranslation()
  if (locale === "en") return en
  if (locale === "nl") return nl
  return fr
}
