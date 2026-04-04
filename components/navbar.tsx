"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState, useEffect, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Wrench, Zap } from "lucide-react"
import { VENTE_TAB_ENABLED } from "@/lib/feature-flags"

const tabBase =
  "inline-flex h-[calc(100%-1px)] min-h-[2.25rem] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 min-w-0 sm:min-w-[7.5rem]"

const tabInactive =
  "text-foreground dark:text-muted-foreground hover:text-foreground/90"

const tabActive =
  "bg-background text-foreground shadow-sm border-input dark:bg-input/30 dark:text-foreground"

function TabNav({
  isDiagnostic,
  isVente,
  className,
}: {
  isDiagnostic: boolean
  isVente: boolean
  className?: string
}) {
  return (
    <nav
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-auto min-h-9 w-fit shrink-0 items-stretch rounded-lg p-[3px]",
        className
      )}
      aria-label="Navigation principale"
    >
      <Link
        href="/diagnostic"
        className={cn(tabBase, isDiagnostic ? tabActive : tabInactive)}
        aria-current={isDiagnostic ? "page" : undefined}
      >
        Diagnostic
      </Link>
      <Link
        href="/vente"
        className={cn(
          tabBase,
          isVente ? tabActive : tabInactive,
          !VENTE_TAB_ENABLED && "opacity-75"
        )}
        aria-current={isVente ? "page" : undefined}
        title={!VENTE_TAB_ENABLED ? "Fonctionnalité en cours de mise en production" : undefined}
      >
        <Wrench className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
        Vente
        {!VENTE_TAB_ENABLED && (
          <span className="ml-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 leading-none">
            Bientôt
          </span>
        )}
      </Link>
    </nav>
  )
}

export function Navbar() {
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
    fetch("/api/auth/me")
      .then((r) => r.json())
      .catch(() => null)
      .then((data) => {
        setUser(data?.user ?? null)
        setAuthReady(true)
      })
  }, [pathname])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    router.push("/")
    router.refresh()
  }

  const firstName = user?.name?.split(" ")[0] ?? ""

  const authBlock: ReactNode =
    authReady &&
    (user ? (
      <div className="flex min-w-0 max-w-full flex-nowrap items-center justify-end gap-1.5 sm:gap-x-2">
        {user.role === "admin" && (
          <Link
            href="/admin/users"
            className="shrink-0 text-[11px] font-medium text-amber-400 hover:text-amber-300 transition-colors sm:text-xs"
          >
            ⚙ Admin
          </Link>
        )}
        <Link
          href="/profil"
          className="hidden text-xs text-muted-foreground hover:text-foreground transition-colors sm:inline"
        >
          Mon profil
        </Link>
        {/* Mobile : prénom cliquable → Mon profil */}
        <Link
          href="/profil"
          className="min-w-0 max-w-[7.5rem] truncate text-xs text-foreground hover:text-foreground/80 transition-colors sm:hidden"
        >
          Bonjour, {firstName}
        </Link>
        {/* Desktop : prénom non cliquable */}
        <span className="hidden min-w-0 sm:inline sm:max-w-none sm:text-sm text-foreground">
          Bonjour, {firstName}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleLogout}
          className="h-7 shrink-0 px-2 text-[11px] sm:h-8 sm:px-3 sm:text-xs"
        >
          Déconnexion
        </Button>
      </div>
    ) : (
      <Link href="/connexion" className={cn(isConnexionPage && "hidden")}>
        <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
          Connexion
        </Button>
      </Link>
    ))

  // Indicateur crédits pour la page d'accueil et la page diagnostic (desktop)
  const creditsIndicator =
    user && (isHome || isDiagnostic) ? (
      <div className="hidden sm:flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400">
          <Zap className="h-3.5 w-3.5" />
          {user.diagnosticCredits ?? 0} crédit{(user.diagnosticCredits ?? 0) !== 1 ? "s" : ""}
        </div>
        <Link href="/credits">
          <Button size="sm" className="h-7 px-2.5 text-[11px] bg-orange-500 hover:bg-orange-600 text-white">
            Acheter
          </Button>
        </Link>
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
                <TabNav isDiagnostic={isDiagnostic} isVente={isVente} />
              </div>
              {/* Ligne 2 : infos connexion */}
              <div className="flex w-full min-w-0 items-center justify-between">
                <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300 shrink-0">
                  Phase de test
                </span>
                {authBlock}
              </div>
            </>
          ) : (
            <>
              {/* Ligne 1 : Phase de test + connexion */}
              <div className="flex w-full min-w-0 items-center justify-between">
                <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300 shrink-0">
                  Phase de test
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
                  <TabNav isDiagnostic={isDiagnostic} isVente={isVente} />
                </div>
              )}
            </>
          )}
        </div>

        {/* PC : une ligne — logo (hors accueil) | badge | [infos connexion][onglets] alignés à droite */}
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
          <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300 shrink-0">
            Phase de test
          </span>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
            {creditsIndicator}
            {authBlock}
            <TabNav isDiagnostic={isDiagnostic} isVente={isVente} />
          </div>
        </div>
      </div>
    </header>
  )
}
