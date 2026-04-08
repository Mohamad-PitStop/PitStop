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
      <p className="border-t border-border/60 pt-6 text-center text-sm text-muted-foreground">
        <Link href="/inscription-garage" className="font-medium text-primary hover:underline">
          {t("garage.listPage.proLink")}
        </Link>
      </p>
    </div>
  )
}
