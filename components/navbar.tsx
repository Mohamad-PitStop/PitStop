"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState, useEffect, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Wrench, Zap } from "lucide-react"
import { VENTE_TAB_ENABLED, CREDIT_PURCHASES_ENABLED } from "@/lib/feature-flags"
import { getDiagnosticEntryHref } from "@/lib/diagnostic-entry-href"
import {
  AUTH_SESSION_CHANGED_EVENT,
  dispatchAuthSessionChanged,
} from "@/lib/auth-client-events"
import { useTranslation } from "@/lib/i18n/locale-context"
import { LanguageSwitcher } from "@/components/language-switcher"

/** Largeur fixe du groupe d’onglets : évite tout déplacement au changement de langue (libellés de longueurs différentes). */
const tabNavWidthClass =
  "w-[min(100%,18rem)] sm:w-[20rem] min-[1100px]:w-[22rem] xl:w-[26rem]"

const tabBase =
  "inline-flex h-[calc(100%-1px)] min-h-[2.25rem] w-full min-w-0 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1.5 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"

const tabInactive =
  "text-foreground dark:text-muted-foreground hover:text-foreground/90"

const tabActive =
  "bg-background text-foreground shadow-sm border-input dark:bg-input/30 dark:text-foreground"

function TabNav({
  isDiagnostic,
  isVente,
  diagnosticHref,
  className,
}: {
  isDiagnostic: boolean
  isVente: boolean
  /** Cible du parcours diagnostic (ex. /merci si 0 crédit en phase test). */
  diagnosticHref: string
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <nav
      className={cn(
        "bg-muted text-muted-foreground grid shrink-0 grid-cols-2 items-stretch gap-0 rounded-lg p-[3px] text-center",
        tabNavWidthClass,
        className
      )}
      aria-label={t("navbar.mainNav")}
    >
      <Link
        href={diagnosticHref}
        prefetch={false}
        className={cn(tabBase, isDiagnostic ? tabActive : tabInactive)}
        aria-current={isDiagnostic ? "page" : undefined}
      >
        {t("navbar.diagnostic")}
      </Link>
      <Link
        href="/vente"
        className={cn(
          tabBase,
          isVente ? tabActive : tabInactive,
          !VENTE_TAB_ENABLED && "opacity-75"
        )}
        aria-current={isVente ? "page" : undefined}
        title={!VENTE_TAB_ENABLED ? t("navbar.venteSoonTitle") : undefined}
      >
        <Wrench className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
        {t("navbar.vente")}
        {!VENTE_TAB_ENABLED && (
          <span className="ml-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 leading-none">
            {t("navbar.soon")}
          </span>
        )}
      </Link>
    </nav>
  )
}

/** Onglets Diagnostic / Vente, ou lien unique vers l’espace garage pour les garagistes. */
function DiagnosticVenteNavOrGarage({
  isDiagnostic,
  isVente,
  diagnosticHref,
  isGaragiste,
  className,
}: {
  isDiagnostic: boolean
  isVente: boolean
  diagnosticHref: string
  isGaragiste: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const pathname = usePathname()
  if (isGaragiste) {
    const active = pathname.startsWith("/garage")
    return (
      <nav
        className={cn(
          "bg-muted text-muted-foreground grid shrink-0 grid-cols-1 items-stretch gap-0 rounded-lg p-[3px] text-center",
          tabNavWidthClass,
          className
        )}
        aria-label={t("navbar.mainNav")}
      >
        <Link
          href="/garage/dashboard"
          prefetch={false}
          className={cn(tabBase, active ? tabActive : tabInactive)}
          aria-current={active ? "page" : undefined}
        >
          {t("navbar.garageDashboard")}
        </Link>
      </nav>
    )
  }
  return (
    <TabNav
      isDiagnostic={isDiagnostic}
      isVente={isVente}
      diagnosticHref={diagnosticHref}
      className={className}
    />
  )
}

export function Navbar() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === "/"
  const isConnexionPage = pathname.startsWith("/connexion")
  const isDiagnostic = pathname.startsWith("/diagnostic")
  const isVente = pathname.startsWith("/vente")
  const isDiagnosticOrVente = isDiagnostic || isVente

  const [user, setUser] = useState<{
    id: string
    name: string
    email: string
    role: string
    diagnosticCredits?: number
  } | null>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    function loadSession() {
      fetch("/api/auth/me", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => null)
        .then((data) => {
          setUser(data?.user ?? null)
          setAuthReady(true)
        })
    }
    loadSession()
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, loadSession)
    return () => window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, loadSession)
  }, [pathname])

  const isGaragiste = user?.role === "garagiste"

  useEffect(() => {
    if (!authReady || !isGaragiste) return
    if (pathname.startsWith("/garage")) return
    if (pathname === "/") {
      router.replace("/garage/dashboard")
    }
  }, [authReady, isGaragiste, pathname, router])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    setUser(null)
    dispatchAuthSessionChanged()
    // Rechargement complet : évite état client / cache Next incohérent avec le cookie supprimé.
    window.location.href = "/"
  }

  const firstName = user?.name?.split(" ")[0] ?? ""

  const diagnosticHref = authReady ? getDiagnosticEntryHref(user) : "/diagnostic"

  const authBlock: ReactNode =
    authReady &&
    (user ? (
      <div className="flex min-w-0 max-w-full flex-nowrap items-center justify-end gap-1.5 sm:gap-x-2">
        {user.role === "admin" && (
          <>
            <Link
              href="/admin/users"
              className="hidden shrink-0 text-[11px] font-medium text-amber-400 hover:text-amber-300 transition-colors min-[1200px]:inline sm:text-xs"
            >
              ⚙ Admin
            </Link>
            <Link
              href="/admin/garages"
              className="hidden shrink-0 text-[11px] font-medium text-amber-400 hover:text-amber-300 transition-colors min-[1200px]:inline sm:text-xs"
            >
              {t("navbar.adminGarages")}
            </Link>
          </>
        )}
        {user.role === "garagiste" && (
          <Link
            href="/garage/dashboard"
            className="hidden shrink-0 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors min-[1200px]:inline sm:text-xs"
          >
            {t("navbar.garageDashboard")}
          </Link>
        )}
        <Link
          href="/profil"
          className="hidden text-xs text-muted-foreground hover:text-foreground transition-colors min-[1080px]:inline"
        >
          {t("navbar.myProfile")}
        </Link>
        {/* Mobile : prénom cliquable → Mon profil */}
        <Link
          href="/profil"
          className="min-w-0 max-w-[7.5rem] truncate text-xs text-foreground hover:text-foreground/80 transition-colors sm:hidden"
        >
          {t("navbar.hello", { name: firstName })}
        </Link>
        {/* Desktop : prénom non cliquable (masqué si fenêtre étroite pour éviter le chevauchement) */}
        <span className="hidden min-w-0 min-[1024px]:inline min-[1024px]:max-w-none min-[1024px]:text-sm text-foreground">
          {t("navbar.hello", { name: firstName })}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleLogout}
          className="h-7 min-w-[6.25rem] shrink-0 px-2 text-[11px] min-[1024px]:min-w-[8.5rem] sm:h-8 min-[1280px]:min-w-[9rem] sm:px-3 sm:text-xs"
        >
          {t("navbar.logout")}
        </Button>
      </div>
    ) : (
      <Link href="/connexion" className={cn(isConnexionPage && "hidden")}>
        <Button
          size="sm"
          variant="outline"
          className="h-8 min-w-[6rem] px-2.5 text-xs min-[1024px]:min-w-[7.5rem] min-[1024px]:px-3"
        >
          {t("navbar.login")}
        </Button>
      </Link>
    ))

  // Indicateur crédits pour la page d'accueil et la page diagnostic (desktop)
  const creditsIndicator =
    user && !isGaragiste && (isHome || isDiagnostic) ? (
      <div className="hidden min-[1280px]:flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400">
          <Zap className="h-3.5 w-3.5" />
          {user.diagnosticCredits ?? 0}{" "}
          {(user.diagnosticCredits ?? 0) === 1 ? t("navbar.credit") : t("navbar.credits")}
        </div>
        {CREDIT_PURCHASES_ENABLED ? (
          <Link href="/credits">
            <Button
              size="sm"
              className="h-7 min-w-[4.5rem] px-2.5 text-[11px] bg-orange-500 hover:bg-orange-600 text-white"
            >
              {t("navbar.buy")}
            </Button>
          </Link>
        ) : null}
      </div>
    ) : null

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex min-h-16 flex-wrap items-center gap-2 px-4 py-2">
        {/* Mobile */}
        <div className="flex w-full min-w-0 flex-col gap-1.5 sm:hidden">
          {isDiagnosticOrVente ? (
            <>
              {/* Ligne 1 : logo + onglets */}
              <div className="flex w-full items-center justify-between gap-2">
                <Link href="/" className="flex shrink-0 items-center">
                  <Image
                    src="/images/pitstop-logo.png"
                    alt="PitStop"
                    width={140}
                    height={40}
                    className="h-8 w-auto select-none [-webkit-user-drag:none]"
                    draggable={false}
                    priority
                  />
                </Link>
                <DiagnosticVenteNavOrGarage
                  isDiagnostic={isDiagnostic}
                  isVente={isVente}
                  diagnosticHref={diagnosticHref}
                  isGaragiste={isGaragiste}
                />
              </div>
              {/* Ligne 2 : infos connexion */}
              <div className="flex w-full min-w-0 items-center justify-between">
                <span className="inline-flex min-w-[8.25rem] shrink-0 justify-center whitespace-nowrap rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                  {t("navbar.phaseTest")}
                </span>
                {authBlock}
              </div>
            </>
          ) : (
            <>
              {/* Ligne 1 : Phase de test + connexion */}
              <div className="flex w-full min-w-0 items-center justify-between">
                <span className="inline-flex min-w-[8.25rem] shrink-0 justify-center whitespace-nowrap rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                  {t("navbar.phaseTest")}
                </span>
                {authBlock}
              </div>
              {/* Ligne 2 : logo + onglets (hors accueil) */}
              {!isHome && (
                <div className="flex w-full items-center justify-between gap-2">
                  <Link href="/" className="flex shrink-0 items-center">
                    <Image
                      src="/images/pitstop-logo.png"
                      alt="PitStop"
                      width={140}
                      height={40}
                      className="h-8 w-auto select-none [-webkit-user-drag:none]"
                      draggable={false}
                      priority
                    />
                  </Link>
                  <DiagnosticVenteNavOrGarage
                    isDiagnostic={isDiagnostic}
                    isVente={isVente}
                    diagnosticHref={diagnosticHref}
                    isGaragiste={isGaragiste}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* PC : une ligne : logo (hors accueil) | badge | [infos connexion][onglets] alignés à droite */}
        <div className="hidden min-h-[3rem] w-full items-center gap-4 sm:flex">
          {!isHome && (
            <Link href="/" className="flex shrink-0 items-center">
              <Image
                src="/images/pitstop-logo.png"
                alt="PitStop"
                width={140}
                height={40}
                className="h-10 w-auto select-none [-webkit-user-drag:none]"
                draggable={false}
                priority
              />
            </Link>
          )}
          <span className="inline-flex min-w-0 shrink-0 justify-center whitespace-nowrap rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300 min-[1100px]:min-w-[9.5rem] min-[1100px]:px-3 min-[1100px]:text-xs">
            {t("navbar.phaseTest")}
          </span>
          <LanguageSwitcher variant="header" className="shrink-0" />
          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
            {creditsIndicator}
            {authBlock}
            <DiagnosticVenteNavOrGarage
              isDiagnostic={isDiagnostic}
              isVente={isVente}
              diagnosticHref={diagnosticHref}
              isGaragiste={isGaragiste}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
