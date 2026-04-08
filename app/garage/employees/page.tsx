"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/lib/i18n/locale-context"
import { Copy, UserPlus, Trash2 } from "lucide-react"

type Employee = {
  id: string
  email: string
  status: string
  userId: string | null
  createdAt: string
}

export default function GarageEmployeesPage() {
  const { t } = useTranslation()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [garageCode, setGarageCode] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  const load = useCallback(() => {
    fetch("/api/garage/employees")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setEmployees(data.employees)
          setGarageCode(data.garageCode || "")
          setIsOwner(data.isOwner ?? false)
        }
      })
  }, [])

  useEffect(() => { load() }, [load])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setError(null)
    const res = await fetch("/api/garage/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error)
    else { setInviteEmail(""); load() }
    setInviting(false)
  }

  const handleRemove = async (id: string) => {
    if (!confirm(t("garage.employees.removeConfirm"))) return
    await fetch("/api/garage/employees", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    load()
  }

  const copyCode = () => {
    navigator.clipboard.writeText(garageCode)
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      invited: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    }
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-muted"}`}>
        {t(`garage.employees.${status}`)}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("garage.employees.title")}</h1>

      {/* Garage code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("garage.employees.garageCode")}</CardTitle>
          <CardDescription>{t("garage.employees.garageCodeDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <code className="rounded bg-muted px-4 py-2 text-lg font-mono font-bold tracking-widest">{garageCode}</code>
            <Button variant="outline" size="icon" onClick={copyCode}><Copy className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Invite employee */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("garage.employees.invite")}</CardTitle>
            <CardDescription>{t("garage.employees.inviteDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder={t("garage.employees.emailPlaceholder")}
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleInvite} disabled={inviting}>
                <UserPlus className="mr-2 h-4 w-4" /> {t("garage.employees.invite")}
              </Button>
            </div>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}

      {/* Employee list */}
      <Card>
        <CardContent className="p-4">
          {employees.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">{t("garage.employees.noEmployees")}</p>
          ) : (
            <div className="space-y-2">
              {employees.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{emp.email}</p>
                    {statusBadge(emp.status)}
                  </div>
                  {isOwner && (
                    <Button variant="ghost" size="icon" onClick={() => handleRemove(emp.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
