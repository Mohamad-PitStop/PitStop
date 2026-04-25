"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Shield,
  UserCheck,
  Users,
  Heart,
  Clock,
  Plus,
  Trash2,
  CalendarDays,
  FlaskConical,
  Coins,
  Tag,
  ToggleLeft,
  ToggleRight,
  MapPin,
  RefreshCw,
  Gift,
} from "lucide-react"
import Link from "next/link"
import { formatBrusselsDate } from "@/lib/format-brussels-date"

type UserRole = "admin" | "tester" | "user_friend" | "user"

type User = {
  id: string
  name: string
  email: string
  role: UserRole
  diagnosticCredits?: number
  createdAt: string | null
}

type Pending = {
  id: string
  email: string
  role: UserRole
  createdAt: string
}

type PromoCode = {
  id: string
  code: string
  discountType: "percent" | "fixed_cents"
  discountValue: number
  maxUses: number | null
  usedCount: number
  active: boolean
  createdAt: string
  /** Code personnel Merci (-30 %, 1 util.) : e-mail du compte lié. */
  reservedUserEmail?: string | null
}

type CreditGiftCode = {
  id: string
  code: string
  credits: number
  maxUses: number | null
  usedCount: number
  active: boolean
  createdAt: string
  label: string | null
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  tester: "Testeur officiel",
  user_friend: "Ami (−50%)",
  user: "Utilisateur",
}

const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  admin: "border-amber-500/50 text-amber-400",
  tester: "border-primary/50 text-primary",
  user_friend: "border-violet-500/50 text-violet-400",
  user: "border-border text-muted-foreground",
}

const ASSIGNABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: "tester", label: "Testeur officiel" },
  { value: "user_friend", label: "Ami (−50%)" },
  { value: "user", label: "Utilisateur" },
]

function formatDate(iso: string) {
  return formatBrusselsDate(iso)
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [counts, setCounts] = useState({ admin: 0, tester: 0, user_friend: 0, user: 0 })
  const [pending, setPending] = useState<Pending[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // User search (recherche partielle nom OU e-mail)
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<User[] | null>(null)
  const [roleChangingId, setRoleChangingId] = useState<string | null>(null)

  // Pending form
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState<UserRole>("tester")
  const [addPending, setAddPending] = useState(false)

  // Pending actions
  const [pendingActionId, setPendingActionId] = useState<string | null>(null)
  const [creditEmail, setCreditEmail] = useState("")
  const [creditAmount, setCreditAmount] = useState("1")
  const [crediting, setCrediting] = useState(false)
  const [creditMessage, setCreditMessage] = useState<string | null>(null)
  const [creditError, setCreditError] = useState<string | null>(null)
  const [creditReason, setCreditReason] = useState("")

  // Promo codes
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoNewCode, setPromoNewCode] = useState("")
  const [promoDiscountType, setPromoDiscountType] = useState<"percent" | "fixed_cents">("percent")
  const [promoDiscountValue, setPromoDiscountValue] = useState("10")
  const [promoMaxUses, setPromoMaxUses] = useState("")
  const [promoCreating, setPromoCreating] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null)
  const [promoTogglingId, setPromoTogglingId] = useState<string | null>(null)

  const [giftCodes, setGiftCodes] = useState<CreditGiftCode[]>([])
  const [giftLoading, setGiftLoading] = useState(false)
  const [giftNewCode, setGiftNewCode] = useState("")
  const [giftCredits, setGiftCredits] = useState("1")
  const [giftMaxUses, setGiftMaxUses] = useState("")
  const [giftLabel, setGiftLabel] = useState("")
  const [giftCreating, setGiftCreating] = useState(false)
  const [giftError, setGiftError] = useState<string | null>(null)
  const [giftSuccess, setGiftSuccess] = useState<string | null>(null)
  const [giftTogglingId, setGiftTogglingId] = useState<string | null>(null)

  const [locationStats, setLocationStats] = useState<{
    rows: Array<{ postalCode: string; city: string; count: number }>
    accountsWithoutLocation: number
    totalAccounts: number
    note?: string
  } | null>(null)
  const [locationLoading, setLocationLoading] = useState(true)

  async function fetchLocationStats() {
    setLocationLoading(true)
    try {
      const res = await fetch("/api/admin/signup-locations")
      if (res.status === 403) {
        router.replace("/")
        return
      }
      const data = await res.json().catch(() => null)
      if (data?.ok) {
        setLocationStats({
          rows: data.rows ?? [],
          accountsWithoutLocation: data.accountsWithoutLocation ?? 0,
          totalAccounts: data.totalAccounts ?? 0,
          note: data.note,
        })
      }
    } finally {
      setLocationLoading(false)
    }
  }

  async function fetchData() {
    const res = await fetch("/api/admin/users")
    if (res.status === 403) { router.replace("/"); return }
    const data = await res.json().catch(() => null)
    if (data?.counts) setCounts(data.counts)
    if (data?.pending) setPending(data.pending)
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json()).catch(() => null)
      .then(async (data) => {
        if (!data?.user || data.user.role !== "admin") { router.replace("/"); return }
        setCurrentUserId(data.user.id)
        // Parallélise les 4 appels : ils sont indépendants (counts, promo,
        // gift codes, location stats). Auparavant en cascade (> 2 s perçues).
        await Promise.all([fetchData(), fetchPromoCodes(), fetchGiftCodes(), fetchLocationStats()])
      })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function searchUser() {
    const q = searchQuery.trim()
    if (!q) return
    setSearching(true)
    setSearchResults(null)
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`)
      const data = await res.json().catch(() => null)
      setSearchResults(Array.isArray(data?.users) ? data.users : [])
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  async function setRole(userId: string, role: UserRole) {
    setRoleChangingId(userId)
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    })
    // Refresh counts + résultats de recherche en cours.
    await Promise.all([fetchData(), searchUser()])
    setRoleChangingId(null)
  }

  async function addAssignment() {
    if (!newEmail.trim()) return
    setAddPending(true)
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail.trim(), role: newRole }),
    })
    setNewEmail("")
    await fetchData()
    setAddPending(false)
  }

  async function removeAssignment(id: string) {
    setPendingActionId(id)
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    await fetchData()
    setPendingActionId(null)
  }

  async function fetchPromoCodes() {
    setPromoLoading(true)
    try {
      const res = await fetch("/api/admin/promo")
      const data = await res.json().catch(() => null)
      if (data?.codes) setPromoCodes(data.codes)
    } catch {
      // silent
    } finally {
      setPromoLoading(false)
    }
  }

  async function fetchGiftCodes() {
    setGiftLoading(true)
    try {
      const res = await fetch("/api/admin/credit-gift-codes")
      if (res.status === 403) {
        router.replace("/")
        return
      }
      const data = await res.json().catch(() => null)
      if (data?.codes) setGiftCodes(data.codes)
    } catch {
      // silent
    } finally {
      setGiftLoading(false)
    }
  }

  async function createGiftCodeAdmin() {
    const code = giftNewCode.trim().toUpperCase()
    const credits = Number(giftCredits)
    if (!code || code.length < 4) {
      setGiftError("Code : au moins 4 caractères.")
      return
    }
    if (!Number.isInteger(credits) || credits < 1 || credits > 100) {
      setGiftError("Crédits : entier entre 1 et 100.")
      return
    }
    setGiftCreating(true)
    setGiftError(null)
    setGiftSuccess(null)
    try {
      const res = await fetch("/api/admin/credit-gift-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          credits,
          maxUses: giftMaxUses.trim() ? Number(giftMaxUses) : null,
          label: giftLabel.trim() || null,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Échec création.")
      setGiftSuccess(`Code « ${data.code.code} » créé (${data.code.credits} crédit(s) par utilisation).`)
      setGiftNewCode("")
      setGiftCredits("1")
      setGiftMaxUses("")
      setGiftLabel("")
      await fetchGiftCodes()
    } catch (e) {
      setGiftError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setGiftCreating(false)
    }
  }

  async function toggleGiftCode(id: string, active: boolean) {
    setGiftTogglingId(id)
    try {
      await fetch("/api/admin/credit-gift-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active }),
      })
      await fetchGiftCodes()
    } finally {
      setGiftTogglingId(null)
    }
  }

  async function createPromo() {
    const code = promoNewCode.trim().toUpperCase()
    if (!code || !/^[A-Za-z]+[0-9]{2}$/i.test(code)) {
      setPromoError("Format requis : lettres + 2 chiffres (ex: PITSTOP25)")
      return
    }
    const value = Number(promoDiscountValue)
    if (!Number.isInteger(value) || value <= 0) {
      setPromoError("La valeur de la réduction doit être un entier positif.")
      return
    }
    setPromoCreating(true)
    setPromoError(null)
    setPromoSuccess(null)
    try {
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountType: promoDiscountType,
          discountValue: value,
          maxUses: promoMaxUses ? Number(promoMaxUses) : null,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Erreur lors de la création.")
      setPromoSuccess(`Code « ${data.code.code} » créé avec succès.`)
      setPromoNewCode("")
      setPromoDiscountValue("10")
      setPromoMaxUses("")
      await fetchPromoCodes()
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : "Erreur serveur.")
    } finally {
      setPromoCreating(false)
    }
  }

  async function togglePromo(id: string, active: boolean) {
    setPromoTogglingId(id)
    try {
      await fetch("/api/admin/promo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active }),
      })
      await fetchPromoCodes()
    } catch {
      // silent
    } finally {
      setPromoTogglingId(null)
    }
  }

  async function grantCredits() {
    const email = creditEmail.trim().toLowerCase()
    const amount = Number(creditAmount)
    if (!email || !Number.isInteger(amount) || amount <= 0) return

    setCrediting(true)
    setCreditMessage(null)
    setCreditError(null)
    try {
      const res = await fetch("/api/admin/users/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, credits: amount, reason: creditReason.trim() || undefined }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "Impossible d'ajouter les crédits.")
      }

      setCreditMessage(
        `${amount} crédit${amount > 1 ? "s" : ""} ajouté${amount > 1 ? "s" : ""} à ${data.user.email} (nouveau solde : ${data.user.newBalance}). Utilisé: ${data.dailyUsedAfterGrant}/${data.dailyLimit} crédits sur 24h.`
      )
      setCreditEmail("")
      setCreditAmount("1")
      setCreditReason("")
      await fetchData()
    } catch (err) {
      setCreditError(err instanceof Error ? err.message : "Impossible d'ajouter les crédits.")
    } finally {
      setCrediting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-10 space-y-10">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-amber-400 shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Panneau d&apos;administration</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Gestion des utilisateurs et des rôles</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/admin/agenda">
            <Button variant="outline" size="sm" className="gap-2 border-primary/40 text-primary hover:bg-primary/10">
              <CalendarDays className="h-4 w-4" />
              Gérer l&apos;agenda
            </Button>
          </Link>
          <Link href="/admin/test-booking">
            <Button variant="outline" size="sm" className="gap-2 border-amber-500/40 text-amber-400 hover:bg-amber-500/10">
              <FlaskConical className="h-4 w-4" />
              Test booking
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Admins", count: counts.admin, icon: Shield, cls: "text-amber-400" },
          { label: "Testeurs", count: counts.tester, icon: UserCheck, cls: "text-primary" },
          { label: "Amis", count: counts.user_friend, icon: Heart, cls: "text-violet-400" },
          { label: "Utilisateurs", count: counts.user, icon: Users, cls: "text-muted-foreground" },
        ].map(({ label, count, icon: Icon, cls }) => (
          <Card key={label} className="border-border/50">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <Icon className={`h-5 w-5 ${cls} shrink-0`} />
              <div>
                <p className="text-2xl font-bold text-foreground leading-none">{count}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Localisation des inscriptions (agrégats) */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            Localisation des inscriptions
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => fetchLocationStats()}
            disabled={locationLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${locationLoading ? "animate-spin" : ""}`} />
            {locationLoading ? "Chargement…" : "Actualiser"}
          </Button>
        </div>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-4 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Répartition des comptes créés selon le code postal et la commune indiqués à l&apos;inscription (statistiques
              agrégées — aucun nom ni e-mail n&apos;apparaît ici). Utile pour prioriser les garages partenaires par zone.
            </p>
            {locationLoading && !locationStats && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
                Chargement des statistiques…
              </p>
            )}
            {locationStats && (
              <>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Comptes total :{" "}
                    <strong className="text-foreground">{locationStats.totalAccounts}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    Sans localisation renseignée :{" "}
                    <strong className="text-foreground">{locationStats.accountsWithoutLocation}</strong>
                    <span className="text-xs ml-1">(comptes créés avant cette fonction ou incomplets)</span>
                  </span>
                </div>
                {locationStats.rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune donnée de localisation pour l&apos;instant.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border/60">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/60 bg-muted/30 text-left">
                          <th className="px-3 py-2 font-semibold text-foreground">Code postal</th>
                          <th className="px-3 py-2 font-semibold text-foreground">Commune / ville</th>
                          <th className="px-3 py-2 font-semibold text-foreground text-right">Comptes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {locationStats.rows.map((row) => (
                          <tr key={`${row.postalCode}-${row.city}`} className="border-b border-border/40 last:border-0">
                            <td className="px-3 py-2 tabular-nums">{row.postalCode}</td>
                            <td className="px-3 py-2">{row.city}</td>
                            <td className="px-3 py-2 text-right font-medium">{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {locationStats.note && (
                  <p className="text-xs text-muted-foreground italic">{locationStats.note}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Crédits offerts */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Crédits offerts (admin)</h2>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coins className="h-4 w-4 text-amber-400" />
              Ajouter des crédits gratuitement à un compte existant via son e-mail.
            </div>
            <div className="flex gap-2 flex-wrap items-end">
              <div className="flex-1 min-w-[220px] space-y-1">
                <label className="text-xs text-muted-foreground">Adresse e-mail du compte</label>
                <Input
                  type="email"
                  placeholder="Ex : client@email.com"
                  value={creditEmail}
                  onChange={(e) => setCreditEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") grantCredits() }}
                  className="h-9 text-sm"
                />
              </div>
              <div className="w-[120px] space-y-1">
                <label className="text-xs text-muted-foreground">Crédits à offrir</label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") grantCredits() }}
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex-1 min-w-[220px] space-y-1">
                <label className="text-xs text-muted-foreground">Motif (audit interne, optionnel)</label>
                <Input
                  type="text"
                  placeholder="Ex : geste commercial / test interne"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  className="h-9 text-sm"
                  maxLength={240}
                />
              </div>
              <Button
                size="sm"
                className="h-9 gap-1.5"
                onClick={grantCredits}
                disabled={crediting || !creditEmail.trim() || Number(creditAmount) <= 0}
              >
                <Plus className="h-4 w-4" />
                {crediting ? "Ajout..." : "Ajouter les crédits"}
              </Button>
            </div>
            {creditMessage && (
              <p className="text-xs text-green-400">{creditMessage}</p>
            )}
            {creditError && (
              <p className="text-xs text-destructive">{creditError}</p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Sécurité : plafond par admin = 1000 crédits / 24h (configurable via `ADMIN_FREE_CREDITS_DAILY_CAP`).
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ── Section : recherche utilisateur ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Rechercher un utilisateur</h2>

        <Card className="border-border/50">
          <CardContent className="pt-4 pb-4 space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Nom ou adresse e-mail (recherche partielle)"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchResults(null) }}
                onKeyDown={(e) => { if (e.key === "Enter") searchUser() }}
                className="h-9 text-sm flex-1"
              />
              <Button
                size="sm"
                className="h-9 gap-1.5 shrink-0"
                onClick={searchUser}
                disabled={searching || !searchQuery.trim()}
              >
                {searching ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                  </svg>
                )}
                Rechercher
              </Button>
            </div>

            {searchResults !== null && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun compte ne correspond à cette recherche.</p>
            )}

            {searchResults !== null && searchResults.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground">
                  {searchResults.length} résultat{searchResults.length > 1 ? "s" : ""}
                  {searchResults.length === 25 ? " (limité à 25, affinez la recherche pour en voir d'autres)" : ""}
                </p>
                <div className="space-y-2">
                  {searchResults.map((u) => {
                    const isMe = u.id === currentUserId
                    return (
                      <div
                        key={u.id}
                        className="rounded-lg border border-border/60 bg-secondary/10 p-4 flex items-center gap-4 flex-wrap cursor-pointer transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        role="link"
                        tabIndex={0}
                        aria-label={`Voir le profil et l'historique de ${u.name}`}
                        onClick={() => router.push(`/admin/users/${encodeURIComponent(u.id)}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            router.push(`/admin/users/${encodeURIComponent(u.id)}`)
                          }
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground">{u.name}</span>
                            {isMe && <span className="text-xs text-amber-400">(vous)</span>}
                            <Badge variant="outline" className={`text-xs ${ROLE_BADGE_CLASS[u.role]}`}>
                              {ROLE_LABELS[u.role]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            <span className="text-xs text-muted-foreground">{u.email}</span>
                            {u.createdAt && (
                              <span className="text-xs text-muted-foreground shrink-0">· Inscrit le {formatDate(u.createdAt)}</span>
                            )}
                          </div>
                        </div>

                        {!isMe && u.role !== "admin" && (
                          <div
                            className="flex items-center gap-2 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <select
                              disabled={roleChangingId === u.id}
                              value={u.role}
                              onChange={(e) => setRole(u.id, e.target.value as UserRole)}
                              onKeyDown={(e) => e.stopPropagation()}
                              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 [&>option]:bg-[#0a1628]"
                            >
                              {ASSIGNABLE_ROLES.map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                              ))}
                            </select>
                            {roleChangingId === u.id && (
                              <svg className="animate-spin h-4 w-4 text-muted-foreground" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Section : codes promo ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Codes promo</h2>

        {/* Formulaire de création */}
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tag className="h-4 w-4 text-violet-400" />
              Créer un code promo (format : lettres + 2 chiffres, ex: PITSTOP25)
            </div>
            <div className="flex gap-2 flex-wrap items-end">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Code</label>
                <Input
                  placeholder="PITSTOP25"
                  value={promoNewCode}
                  onChange={(e) => { setPromoNewCode(e.target.value.toUpperCase()); setPromoError(null) }}
                  className="h-9 text-sm uppercase w-[140px]"
                  maxLength={20}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Type de réduction</label>
                <select
                  value={promoDiscountType}
                  onChange={(e) => setPromoDiscountType(e.target.value as "percent" | "fixed_cents")}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary [&>option]:bg-[#0a1628]"
                >
                  <option value="percent">Pourcentage (%)</option>
                  <option value="fixed_cents">Montant fixe (centimes)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  {promoDiscountType === "percent" ? "Valeur (1–100)" : "Valeur en centimes"}
                </label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={promoDiscountValue}
                  onChange={(e) => setPromoDiscountValue(e.target.value)}
                  className="h-9 text-sm w-[120px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Utilisations max (optionnel)</label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Illimité"
                  value={promoMaxUses}
                  onChange={(e) => setPromoMaxUses(e.target.value)}
                  className="h-9 text-sm w-[120px]"
                />
              </div>
              <Button
                size="sm"
                className="h-9 gap-1.5"
                onClick={createPromo}
                disabled={promoCreating || !promoNewCode.trim()}
              >
                <Plus className="h-4 w-4" />
                {promoCreating ? "Création..." : "Créer"}
              </Button>
            </div>
            {promoError && <p className="text-xs text-destructive">{promoError}</p>}
            {promoSuccess && <p className="text-xs text-green-400">{promoSuccess}</p>}
          </CardContent>
        </Card>

        {/* Liste des codes existants */}
        {promoLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Chargement…</p>
        ) : promoCodes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 flex items-center justify-center gap-2">
            <Tag className="h-4 w-4" /> Aucun code promo créé.
          </p>
        ) : (
          <div className="space-y-2">
            {promoCodes.map((promo) => (
              <Card key={promo.id} className={`border-border/40 ${promo.active ? "bg-muted/5" : "bg-muted/20 opacity-60"}`}>
                <CardContent className="pt-3 pb-3 flex items-center gap-3 flex-wrap">
                  <Tag className="h-4 w-4 text-violet-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="min-w-0">
                        <span className="font-bold text-foreground text-sm">{promo.code}</span>
                        {promo.reservedUserEmail ? (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[min(100%,28rem)]" title={promo.reservedUserEmail}>
                            {promo.reservedUserEmail}
                          </p>
                        ) : null}
                      </div>
                      <Badge
                        variant="outline"
                        className={promo.active ? "border-green-500/50 text-green-400 text-xs" : "border-border text-muted-foreground text-xs"}
                      >
                        {promo.active ? "Actif" : "Inactif"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {promo.discountType === "percent"
                          ? `-${promo.discountValue}%`
                          : `-${(promo.discountValue / 100).toFixed(2).replace(".", ",")} €`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {promo.usedCount} utilisation{promo.usedCount !== 1 ? "s" : ""}
                        {promo.maxUses != null ? ` / ${promo.maxUses}` : " (illimité)"}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`h-8 gap-1.5 text-xs shrink-0 ${promo.active ? "text-muted-foreground hover:text-destructive" : "text-green-400 hover:text-green-300"}`}
                    disabled={promoTogglingId === promo.id}
                    onClick={() => togglePromo(promo.id, !promo.active)}
                  >
                    {promo.active ? (
                      <><ToggleLeft className="h-4 w-4" /> Désactiver</>
                    ) : (
                      <><ToggleRight className="h-4 w-4" /> Activer</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Codes cadeau crédits diagnostics */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Gift className="h-4 w-4 text-orange-400 shrink-0" />
          Codes cadeau (crédits diagnostics)
        </h2>
        <p className="text-xs text-muted-foreground">
          Les utilisateurs saisissent le code dans leur profil (section Crédits diagnostics). Un même compte ne peut utiliser un code qu&apos;une fois.
        </p>
        <Card className="border-dashed border-border/60 bg-muted/10">
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[140px] space-y-1">
                <label className="text-xs text-muted-foreground">Code (unique)</label>
                <Input
                  value={giftNewCode}
                  onChange={(e) => setGiftNewCode(e.target.value.toUpperCase())}
                  placeholder="PITSTOP-TEST-01"
                  className="h-9 text-sm font-sans"
                  maxLength={40}
                />
              </div>
              <div className="w-[88px] space-y-1">
                <label className="text-xs text-muted-foreground">Crédits</label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={giftCredits}
                  onChange={(e) => setGiftCredits(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="w-[100px] space-y-1">
                <label className="text-xs text-muted-foreground">Utilisations max</label>
                <Input
                  type="number"
                  min={1}
                  placeholder="∞"
                  value={giftMaxUses}
                  onChange={(e) => setGiftMaxUses(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex-1 min-w-[160px] space-y-1">
                <label className="text-xs text-muted-foreground">Libellé interne (optionnel)</label>
                <Input
                  value={giftLabel}
                  onChange={(e) => setGiftLabel(e.target.value)}
                  placeholder="Campagne partenaire X"
                  className="h-9 text-sm"
                  maxLength={120}
                />
              </div>
              <Button
                size="sm"
                className="h-9 gap-1.5"
                onClick={() => void createGiftCodeAdmin()}
                disabled={giftCreating || !giftNewCode.trim()}
              >
                <Plus className="h-4 w-4" />
                {giftCreating ? "Création…" : "Créer"}
              </Button>
            </div>
            {giftError && <p className="text-xs text-destructive">{giftError}</p>}
            {giftSuccess && <p className="text-xs text-green-400">{giftSuccess}</p>}
          </CardContent>
        </Card>
        {giftLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Chargement…</p>
        ) : giftCodes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun code cadeau.</p>
        ) : (
          <div className="space-y-2">
            {giftCodes.map((g) => (
              <Card key={g.id} className={`border-border/40 ${g.active ? "bg-muted/5" : "bg-muted/20 opacity-60"}`}>
                <CardContent className="pt-3 pb-3 flex items-center gap-3 flex-wrap">
                  <Gift className="h-4 w-4 text-orange-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="font-mono font-semibold text-foreground">{g.code}</span>
                      <Badge variant="outline" className="text-xs">
                        +{g.credits} crédit{g.credits !== 1 ? "s" : ""} / saisie
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {g.usedCount} utilisation{g.usedCount !== 1 ? "s" : ""}
                        {g.maxUses != null ? ` / ${g.maxUses}` : " (plafond illimité)"}
                      </span>
                      {g.label && <span className="text-xs text-muted-foreground italic">{g.label}</span>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`h-8 gap-1.5 text-xs shrink-0 ${g.active ? "text-muted-foreground hover:text-destructive" : "text-green-400 hover:text-green-300"}`}
                    disabled={giftTogglingId === g.id}
                    onClick={() => void toggleGiftCode(g.id, !g.active)}
                  >
                    {g.active ? (
                      <>
                        <ToggleLeft className="h-4 w-4" /> Désactiver
                      </>
                    ) : (
                      <>
                        <ToggleRight className="h-4 w-4" /> Activer
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── Section : préassignation ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Rôles préassignés</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Le rôle sera appliqué automatiquement à l&apos;inscription si l&apos;adresse e-mail correspond.
            </p>
          </div>
        </div>

        {/* Formulaire d'ajout */}
        <Card className="border-dashed border-border/60 bg-muted/10">
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-2 flex-wrap items-end">
              <div className="flex-1 min-w-[180px] space-y-1">
                <label className="text-xs text-muted-foreground">Adresse e-mail</label>
                <Input
                  type="email"
                  placeholder="Ex : jean.dupont@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addAssignment() }}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Rôle</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary [&>option]:bg-[#0a1628]"
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <Button
                size="sm"
                className="h-9 gap-1.5"
                disabled={addPending || !newEmail.trim()}
                onClick={addAssignment}
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liste des assignations en attente */}
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" /> Aucune préassignation en attente.
          </p>
        ) : (
          <div className="space-y-2">
            {pending.map((p) => (
              <Card key={p.id} className="border-border/40 bg-muted/5">
                <CardContent className="pt-3 pb-3 flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground text-sm">{p.email}</span>
                      <Badge variant="outline" className={`text-xs ${ROLE_BADGE_CLASS[p.role]}`}>
                        {ROLE_LABELS[p.role]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Ajouté le {formatDate(p.createdAt)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                    disabled={pendingActionId === p.id}
                    onClick={() => removeAssignment(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

    </main>
  )
}
