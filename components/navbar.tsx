"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Wrench, Zap, Menu, X } from "lucide-react"
import { VENTE_TAB_ENABLED, CREDIT_PURCHASES_ENABLED } from "@/lib/feature-flags"
import { getDiagnosticEntryHref } from "@/lib/diagnostic-entry-href"
import {
  AUTH_SESSION_CHANGED_EVENT,
  dispatchAuthSessionChanged,
} from "@/lib/auth-client-events"
import { useTranslation } from "@/lib/i18n/locale-context"
import { LanguageSwitcher } from "@/components/language-switcher"

const tabNavWidthClass = "w-[min(100%,18rem)] sm:w-[20rem] min-[1100px]:w-[22rem] xl:w-[26rem]"

const tabBase =
  "inline-flex h-[calc(100%-1px)] min-h-[2.25rem] w-full min-w-[5rem] items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1.5 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"

const tabInactive = "text-foreground dark:text-muted-foreground hover:text-foreground/90"
const tabActive = "bg-background text-foreground shadow-sm border-input dark:bg-input/30 dark:text-foreground"

function TabNav({
  isDiagnostic,
  isVente,
  diagnosticHref,
  className,
}: {
  isDiagnostic: boolean
  isVente: boolean
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
        className={cn(tabBase, isVente ? tabActive : tabInactive, !VENTE_TAB_ENABLED && "opacity-75")}
        aria-current={isVente ? "page" : undefined}
        title={!VENTE_TAB_ENABLED ? t("navbar.venteSoonTitle") : undefined}
      >
        <Wrench className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
        {t("navbar.vente")}
        {!VENTE_TAB_ENABLED && (
          <span className="ml-0.5 inline-flex items-center justify-center w-[4.5rem] h-4 rounded-full bg-amber-500/20 text-[10px] font-semibold text-amber-400 leading-none">
            {t("navbar.soon")}
          </span>
        )}
      </Link>
    </nav>
  )
}

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

function DropItem({
  href,
  onClick,
  children,
  className,
}: {
  href: string
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors",
        className
      )}
    >
      {children}
    </Link>
  )
}

function NavMenu({
  user,
  authReady,
  isConnexionPage,
  handleLogout,
}: {
  user: { id: string; name: string; email: string; role: string; diagnosticCredits?: number } | null
  authReady: boolean
  isConnexionPage: boolean
  handleLogout: () => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onOutside)
    document.addEventListener("keydown", onEsc)
    return () => {
      document.removeEventListener("mousedown", onOutside)
      document.removeEventListener("keydown", onEsc)
    }
  }, [open])

  const close = () => setOpen(false)
  const isGaragiste = user?.role === "garagiste"
  const isAdmin = user?.role === "admin"
  const credits = user?.diagnosticCredits ?? 0
  const firstName = user?.name?.split(" ")[0] ?? ""

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-background hover:bg-muted transition-colors"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-60 rounded-xl border border-border/60 bg-background shadow-xl overflow-hidden">
          {!authReady ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">&hellip;</div>
          ) : user ? (
            <>
              {/* En-tête utilisateur */}
              <div className="px-4 py-3 border-b border-border/40">
                <p className="text-sm font-semibold text-foreground">{t("navbar.hello", { name: firstName })}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>

              {/* Crédits */}
              {!isGaragiste && (
                <div className="px-3 py-2.5 border-b border-border/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-orange-400 font-medium">
                    <Zap className="h-3.5 w-3.5 shrink-0" />
                    {credits} {credits === 1 ? t("navbar.credit") : t("navbar.credits")}
                  </div>
                  {CREDIT_PURCHASES_ENABLED && (
                    <Link href="/credits" onClick={close}>
                      <Button size="sm" className="h-6 min-w-[4rem] px-2.5 text-[11px] bg-orange-500 hover:bg-orange-600 text-white">
                        {t("navbar.buy")}
                      </Button>
                    </Link>
                  )}
                </div>
              )}

              {/* Liens de navigation */}
              <div className="py-1.5 space-y-0.5 px-1.5">
                {isAdmin && (
                  <>
                    <DropItem href="/admin/users" onClick={close} className="text-amber-400 hover:text-amber-300">
                      ⚙ Admin
                    </DropItem>
                    <DropItem href="/admin/garages" onClick={close} className="text-amber-400 hover:text-amber-300">
                      {t("navbar.adminGarages")}
                    </DropItem>
                  </>
                )}
                {isGaragiste && (
                  <DropItem href="/garage/dashboard" onClick={close} className="text-primary hover:text-primary/80">
                    {t("navbar.garageDashboard")}
                  </DropItem>
                )}
                <DropItem href="/profil" onClick={close}>
                  {t("navbar.myProfile")}
                </DropItem>
                {!isGaragiste && (
                  <DropItem href="/inscription-garage" onClick={close} className="text-primary/80 hover:text-primary">
                    {t("navbar.garagePartnerSignup")}
                  </DropItem>
                )}
              </div>

              {/* Déconnexion */}
              <div className="border-t border-border/40 px-1.5 py-1.5">
                <button
                  onClick={() => { close(); handleLogout() }}
                  className="flex w-full items-center rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  {t("navbar.logout")}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="py-1.5 px-1.5">
                <DropItem href="/inscription-garage" onClick={close} className="text-primary/80 hover:text-primary">
                  {t("navbar.garagePartnerSignup")}
                </DropItem>
              </div>
              {!isConnexionPage && (
                <div className="border-t border-border/40 px-3 py-2.5">
                  <Link href="/connexion" onClick={close}>
                    <Button size="sm" className="w-full h-8 min-h-8 text-xs">
                      {t("navbar.login")}
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
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

  const [user, setUser] = useState<{
    id: string
    name: string
    email: string
    role: string
    diagnosticCredits?: number
    pendingCompletion?: boolean
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
    if (pathname === "/") router.replace("/garage/dashboard")
  }, [authReady, isGaragiste, pathname, router])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    setUser(null)
    dispatchAuthSessionChanged()
    window.location.href = "/"
  }

  const diagnosticHref = authReady ? getDiagnosticEntryHref(user) : "/diagnostic"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex min-h-14 items-center gap-2 px-4 py-2">

        {/* Logo (masqué sur la home) */}
        {!isHome && (
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/images/pitstop-logo.png"
              alt="PitStop"
              width={130}
              height={40}
              className="h-8 w-auto select-none [-webkit-user-drag:none]"
              draggable={false}
              priority
            />
          </Link>
        )}

        {/* Badge Phase de test */}
        <span className="hidden sm:inline-flex shrink-0 items-center justify-center h-6 w-[7.5rem] text-center whitespace-nowrap rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300 sm:text-xs">
          {t("navbar.phaseTest")}
        </span>

        {/* Language switcher */}
        <LanguageSwitcher variant="header" className="shrink-0" />

        {/* Espaceur */}
        <div className="flex-1" />

        {/* Onglets Diagnostic / Vente (ou Espace garage) */}
        <DiagnosticVenteNavOrGarage
          isDiagnostic={isDiagnostic}
          isVente={isVente}
          diagnosticHref={diagnosticHref}
          isGaragiste={isGaragiste}
        />

        {/* Menu hamburger */}
        <NavMenu
          user={user}
          authReady={authReady}
          isConnexionPage={isConnexionPage}
          handleLogout={handleLogout}
        />
      </div>
    </header>
  )
}
