"use client"

import { useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/locale-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import {
  LayoutDashboard, Calendar, ClipboardList, Users, Settings, Wallet, Download, LogOut, Menu, X,
} from "lucide-react"

// La sidebar est rendue dans document.body pour échapper au wrapper
// PageTransition (qui a `transform:translateZ(0)` et casserait `position:fixed`).
function BodyPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted || typeof document === "undefined") return null
  return createPortal(children, document.body)
}

type User = { id: string; name: string; email: string; role: string; garageId: string | null }

const NAV_ITEMS = [
  { key: "dashboard", href: "/garage/dashboard", icon: LayoutDashboard },
  { key: "calendar", href: "/garage/calendar", icon: Calendar },
  { key: "reservations", href: "/garage/reservations", icon: ClipboardList },
  { key: "employees", href: "/garage/employees", icon: Users },
  { key: "settings", href: "/garage/settings", icon: Settings },
  { key: "payouts", href: "/garage/payouts", icon: Wallet },
] as const

export default function GarageLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!data.user || data.user.role !== "garagiste") {
          router.push("/")
          return
        }
        setUser(data.user)
        setLoading(false)
      })
      .catch(() => router.push("/"))
  }, [router])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    router.push("/")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen md:pl-64">
      {/* Sidebar - desktop (rendue dans document.body via portail) */}
      <BodyPortal>
      <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <Link href="/garage/dashboard" className="text-lg font-bold text-primary">PitStop</Link>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">GARAGE</span>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {t(`garage.nav.${item.key}`)}
              </Link>
            )
          })}
        </nav>
        <div className="shrink-0 space-y-2 border-t border-border p-3">
          <div className="px-3 py-1">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <LanguageSwitcher variant="embedded" />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            {t("navbar.logout")}
          </button>
        </div>
      </aside>
      </BodyPortal>

      {/* Mobile header + sidebar */}
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <div className="flex items-center gap-2">
            <Link href="/garage/dashboard" className="text-lg font-bold text-primary">PitStop</Link>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">GARAGE</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {sidebarOpen && (
          <nav className="border-b border-border bg-card p-3 md:hidden space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                    active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {t(`garage.nav.${item.key}`)}
                </Link>
              )
            })}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              {t("navbar.logout")}
            </button>
          </nav>
        )}

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
