"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { VENTE_TAB_ENABLED } from "@/lib/feature-flags"
import { getDiagnosticEntryHref } from "@/lib/diagnostic-entry-href"
import { AUTH_SESSION_CHANGED_EVENT } from "@/lib/auth-client-events"
import { ArrowRight, Wrench } from "lucide-react"
import { useTranslation } from "@/lib/i18n/locale-context"

function useDiagnosticEntryHrefFromSession() {
  const pathname = usePathname()
  const [href, setHref] = useState("/diagnostic")

  useEffect(() => {
    function refresh() {
      fetch("/api/auth/me", { credentials: "include" })
        .then((r) => r.json())
        .then((data) => setHref(getDiagnosticEntryHref(data?.user)))
        .catch(() => setHref("/diagnostic"))
    }
    refresh()
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, refresh)
  }, [pathname])

  return href
}

/** Liens accueil vers le diagnostic : cible /merci ou /credits si solde 0 (phase test). */
export function LandingDiagnosticTabMobile() {
  const { t } = useTranslation()
  const href = useDiagnosticEntryHrefFromSession()
  return (
    <Link
      href={href}
      prefetch={false}
      className="inline-flex min-h-[2.25rem] w-full min-w-0 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-foreground hover:text-foreground/90"
    >
      {t("navbar.diagnostic")}
    </Link>
  )
}

export function LandingDiagnosticHeroButton() {
  const { t } = useTranslation()
  const href = useDiagnosticEntryHrefFromSession()
  return (
    <Button
      asChild
      size="lg"
      className="h-12 w-full px-8 text-base gap-2 shadow-lg shadow-primary/20 sm:w-auto sm:min-w-[220px]"
    >
      <Link href={href} prefetch={false} className="inline-flex items-center justify-center">
        <Wrench className="h-5 w-5 shrink-0" />
        <span className="text-center">{t("home.ctaDiagnosticRepair")}</span>
        <ArrowRight className="h-4 w-4 shrink-0 opacity-80" />
      </Link>
    </Button>
  )
}

export function LandingDiagnosticCardLink({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const href = useDiagnosticEntryHrefFromSession()
  return (
    <Link href={href} prefetch={false} className={cn(className)}>
      {children}
    </Link>
  )
}

export function LandingVenteLink({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <Link
      href="/vente"
      className={cn(className)}
      title={!VENTE_TAB_ENABLED ? t("navbar.venteSoonTitle") : undefined}
    >
      {children}
    </Link>
  )
}
