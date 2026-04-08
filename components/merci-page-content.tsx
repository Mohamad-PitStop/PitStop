"use client"

import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { MerciPromoSection } from "@/components/merci-promo-section"
import { CheckCircle, Clock, Mail, Sparkles } from "lucide-react"
import { useTranslation } from "@/lib/i18n/locale-context"

export function MerciPageContent({ fromDiagnostic }: { fromDiagnostic: boolean }) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl space-y-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/15">
            <CheckCircle className="h-10 w-10 text-primary" strokeWidth={1.5} />
          </div>

          <div className="space-y-5">
            <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">{t("merci.title")}</h1>
            <p className="rounded-lg border border-border/60 bg-muted/30 px-5 py-4 text-left text-base leading-relaxed text-muted-foreground">
              {t("merci.p1")}
            </p>
            {fromDiagnostic ? (
              <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 px-5 py-4 text-left">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  {t("merci.creditsOutTitle")}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{t("merci.creditsOutP1")}</p>
                <p className="text-sm leading-relaxed text-foreground/90">{t("merci.creditsOutP2")}</p>
              </div>
            ) : (
              <p className="text-lg leading-relaxed text-muted-foreground">{t("merci.creditsOutAlt")}</p>
            )}
          </div>

          <div className="space-y-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-6 py-5 text-left">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
              <Clock className="h-4 w-4 shrink-0" />
              {t("merci.boxTitle")}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("merci.boxP1")}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("merci.boxP2")}</p>
          </div>

          <MerciPromoSection />

          <div className="space-y-2 rounded-xl border border-border/50 bg-card px-6 py-5 text-left">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              {t("merci.contactTitle")}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("merci.contactBody")}{" "}
              <a href="mailto:pitstopbelgique@gmail.com" className="text-primary hover:underline">
                pitstopbelgique@gmail.com
              </a>
              {t("merci.contactBodyEnd")}
            </p>
          </div>

          <Button asChild variant="outline" size="lg">
            <Link href="/">{t("common.backHome")}</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
