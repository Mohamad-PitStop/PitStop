"use client"

import { useTranslation } from "@/lib/i18n/locale-context"

export function SuspenseLoadingScreen() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <span className="text-sm text-muted-foreground">{t("common.loading")}</span>
    </div>
  )
}
