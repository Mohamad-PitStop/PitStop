"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Shield, UserCheck, UserX, Users, Heart, Clock, Plus, Trash2, CalendarDays } from "lucide-react"
import Link from "next/link"

type UserRole = "admin" | "tester" | "user_friend" | "user"

type User = {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

type Pending = {
  id: string
  email: string
  role: UserRole
  createdAt: string
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
  try {
    return new Intl.DateTimeFormat("fr-BE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso))
  } catch { return iso }
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [pending, setPending] = useState<Pending[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Pending form
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState<UserRole>("tester")
  const [addPending, setAddPending] = useState(false)

  // Pending actions
  const [pendingActionId, setPendingActionId] = useState<string | null>(null)

  async function fetchData() {
    const res = await fetch("/api/admin/users")
    if (res.status === 403) { router.replace("/"); return }
    const data = await res.json().catch(() => null)
    if (data?.users) setUsers(data.users)
    if (data?.pending) setPending(data.pending)
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json()).catch(() => null)
      .then((data) => {
        if (!data?.user || data.user.role !== "admin") { router.replace("/"); return }
        setCurrentUserId(data.user.id)
        return fetchData()
      })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function setRole(userId: string, role: UserRole) {
    setPendingActionId(userId)
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    })
    await fetchData()
    setPendingActionId(null)
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

  const admins = users.filter((u) => u.role === "admin")
  const testers = users.filter((u) => u.role === "tester")
  const friends = users.filter((u) => u.role === "user_friend")
  const regularUsers = users.filter((u) => u.role === "user")

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
        <Link href="/admin/agenda">
          <Button variant="outline" size="sm" className="gap-2 border-primary/40 text-primary hover:bg-primary/10">
            <CalendarDays className="h-4 w-4" />
            Gérer l&apos;agenda
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Admins", count: admins.length, icon: Shield, cls: "text-amber-400" },
          { label: "Testeurs", count: testers.length, icon: UserCheck, cls: "text-primary" },
          { label: "Amis", count: friends.length, icon: Heart, cls: "text-violet-400" },
          { label: "Utilisateurs", count: regularUsers.length, icon: Users, cls: "text-muted-foreground" },
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

      {/* ── Section : utilisateurs inscrits ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Utilisateurs inscrits</h2>

        {users.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">Aucun utilisateur enregistré.</p>
        )}

        {users.map((u) => {
          const isMe = u.id === currentUserId
          const isPending = pendingActionId === u.id
          return (
            <Card key={u.id} className="border-border/50">
              <CardContent className="pt-3 pb-3 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground truncate">{u.name}</span>
                    {isMe && <span className="text-xs text-amber-400">(vous)</span>}
                    <Badge variant="outline" className={`text-xs ${ROLE_BADGE_CLASS[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                    <span className="text-xs text-muted-foreground shrink-0">· {formatDate(u.createdAt)}</span>
                  </div>
                </div>

                {!isMe && u.role !== "admin" && (
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    <select
                      disabled={isPending}
                      defaultValue={u.role}
                      key={u.role}
                      onChange={(e) => setRole(u.id, e.target.value as UserRole)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 [&>option]:bg-[#0a1628]"
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    {isPending && (
                      <svg className="animate-spin h-4 w-4 text-muted-foreground" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
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
