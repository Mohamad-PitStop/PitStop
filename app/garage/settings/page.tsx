"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/lib/i18n/locale-context"
import { GarageHoursEditor } from "@/components/garage/garage-hours-editor"
import type { BusinessHours } from "@/lib/garage-db"
import { format, addHours } from "date-fns"
import { Trash2 } from "lucide-react"

type Closure = { id: string; date: string; reason: string | null }

const EMPTY_HOURS: BusinessHours = {
  mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [],
}

export default function GarageSettingsPage() {
  const { t } = useTranslation()
  const [currentHours, setCurrentHours] = useState<BusinessHours>(EMPTY_HOURS)
  const [proposedHours, setProposedHours] = useState<BusinessHours>(EMPTY_HOURS)
  const [editing, setEditing] = useState(false)
  const [changePending, setChangePending] = useState(false)
  const [changeSubmitted, setChangeSubmitted] = useState(false)
  const [garageInfo, setGarageInfo] = useState<{ companyName: string; garageCode: string } | null>(null)

  const [closures, setClosures] = useState<Closure[]>([])
  const [newClosureDate, setNewClosureDate] = useState("")
  const [newClosureReason, setNewClosureReason] = useState("")
  const [closureError, setClosureError] = useState<string | null>(null)

  const loadClosures = useCallback(() => {
    fetch("/api/garage/closures")
      .then((r) => r.json())
      .then((data) => { if (data.ok) setClosures(data.closures) })
  }, [])

  useEffect(() => {
    // Load garage info from dashboard
    fetch("/api/garage/dashboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.garage) {
          const hours = JSON.parse(data.garage.businessHours || "{}")
          setCurrentHours(hours)
          setProposedHours(hours)
          setGarageInfo({ companyName: data.garage.companyName, garageCode: data.garage.garageCode })
        }
      })
    // Load pending hours requests
    fetch("/api/garage/hours-change")
      .then((r) => r.json())
      .catch(() => {})
    loadClosures()
  }, [loadClosures])

  const handleSubmitHours = async () => {
    await fetch("/api/garage/hours-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposedHours }),
    })
    setEditing(false)
    setChangeSubmitted(true)
  }

  const handleAddClosure = async () => {
    setClosureError(null)
    if (!newClosureDate) return
    // Validate 12h minimum advance
    const closureTime = new Date(newClosureDate + "T00:00:00")
    if (closureTime.getTime() < addHours(new Date(), 12).getTime()) {
      setClosureError(t("garage.settings.closureMinAdvance"))
      return
    }
    const res = await fetch("/api/garage/closures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newClosureDate, reason: newClosureReason || null }),
    })
    if (res.ok) {
      setNewClosureDate("")
      setNewClosureReason("")
      loadClosures()
    }
  }

  const handleDeleteClosure = async (id: string) => {
    await fetch("/api/garage/closures", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    loadClosures()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("garage.settings.title")}</h1>

      {/* Garage info */}
      {garageInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("garage.settings.garageInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>{t("garage.registration.companyName")} :</strong> {garageInfo.companyName}</p>
            <p><strong>{t("garage.employees.garageCode")} :</strong> <code className="font-mono tracking-wider">{garageInfo.garageCode}</code></p>
          </CardContent>
        </Card>
      )}

      {/* Business hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("garage.settings.businessHours")}</CardTitle>
          <CardDescription>{t("garage.settings.businessHoursDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {changeSubmitted && (
            <div className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{t("garage.settings.changeRequested")}</div>
          )}
          {changePending && (
            <div className="rounded-md bg-yellow-100 px-3 py-2 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">{t("garage.settings.changePending")}</div>
          )}

          <GarageHoursEditor value={editing ? proposedHours : currentHours} onChange={editing ? setProposedHours : () => {}} />

          {!editing ? (
            <Button variant="outline" onClick={() => { setProposedHours(currentHours); setEditing(true) }}>
              {t("garage.settings.requestChange")}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSubmitHours}>{t("garage.settings.requestChange")}</Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>Annuler</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Closures */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("garage.settings.closures")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">{t("garage.settings.closureDate")}</label>
              <Input type="date" value={newClosureDate} onChange={(e) => setNewClosureDate(e.target.value)} />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">{t("garage.settings.closureReason")}</label>
              <Input value={newClosureReason} onChange={(e) => setNewClosureReason(e.target.value)} placeholder={t("garage.settings.closureReason")} />
            </div>
            <Button onClick={handleAddClosure}>{t("garage.settings.addClosure")}</Button>
          </div>
          {closureError && <p className="text-sm text-destructive">{closureError}</p>}
          <p className="text-xs text-muted-foreground">{t("garage.settings.closureMinAdvance")}</p>

          {closures.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("garage.settings.noClosure")}</p>
          ) : (
            <div className="space-y-2">
              {closures.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{format(new Date(c.date + "T12:00:00"), "dd/MM/yyyy")}</p>
                    {c.reason && <p className="text-xs text-muted-foreground">{c.reason}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteClosure(c.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
