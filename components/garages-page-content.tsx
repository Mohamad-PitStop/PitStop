"use client"

import Link from "next/link"
import { GarageFinder } from "@/components/garage-finder"
import { useTranslation } from "@/lib/i18n/locale-context"

export function GaragesPageContent() {
  const { t } = useTranslation()
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/resultat"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("rdvPage.backToResult")}
        </Link>
      </div>
      <GarageFinder />
    </div>
  )
}
