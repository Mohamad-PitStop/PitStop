"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/lib/i18n/locale-context"
import { Mail, Phone, AlertTriangle, X as XIcon } from "lucide-react"
import { format } from "date-fns"

type Reservation = {
  id: string
  name: string
  phone: string
  email: string | null
  vehicleMarque: string | null
  vehicleModele: string | null
  vehicleAnnee: number | null
  startAt: string
  endAt: string
  status: string
  payoutStatus: string | null
  payoutAmountCents: number | null
}

type FilterType = "all" | "upcoming" | "past"

export default function GarageReservationsPage() {
  const { t } = useTranslation()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [filter, setFilter] = useState<FilterType>("upcoming")
  const [emailModal, setEmailModal] = useState<{ reservationId: string; clientEmail: string } | null>(null)
  const [emailMessage, setEmailMessage] = useState("")
  const [sending, setSending] = useState(false)

  const load = useCallback(() => {
    const params = new URLSearchParams()
    if (filter === "upcoming") params.set("from", new Date().toISOString())
    if (filter === "past") params.set("to", new Date().toISOString())
    fetch(`/api/garage/reservations?${params}`)
      .then((r) => r.json())
      .then((data) => { if (data.ok) setReservations(data.reservations) })
  }, [filter])

  useEffect(() => { load() }, [load])

  const handleCancel = async (id: string) => {
    if (!confirm(t("garage.reservations.cancelConfirm"))) return
    await fetch("/api/garage/cancel-reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId: id }),
    })
    load()
  }

  const handleDispute = async (id: string) => {
    const msg = prompt(t("garage.reservations.dispute"))
    if (!msg) return
    await fetch("/api/garage/dispute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId: id, message: msg }),
    })
    alert(t("garage.reservations.disputeSent"))
  }

  const handleSendEmail = async () => {
    if (!emailModal || !emailMessage.trim()) return
    setSending(true)
    await fetch("/api/garage/contact-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId: emailModal.reservationId, message: emailMessage }),
    })
    setSending(false)
    setEmailModal(null)
    setEmailMessage("")
    alert(t("garage.reservations.emailSent"))
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      paid: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    }
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-muted text-muted-foreground"}`}>
        {t(`garage.reservations.status.${status}`)}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("garage.reservations.title")}</h1>
        <div className="flex gap-2">
          {(["all", "upcoming", "past"] as FilterType[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {t(`garage.reservations.filter.${f}`)}
            </Button>
          ))}
        </div>
      </div>

      {reservations.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">{t("garage.reservations.noReservations")}</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.name}</span>
                    {statusBadge(r.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(r.startAt), "dd/MM/yyyy HH:mm")}
                    {r.vehicleMarque && ` — ${r.vehicleMarque} ${r.vehicleModele || ""}`}
                  </p>
                  {r.payoutAmountCents != null && (
                    <p className="text-xs text-muted-foreground">
                      {t("garage.reservations.deposit")} : {(r.payoutAmountCents / 100).toFixed(2)} €
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.email && (
                    <Button size="sm" variant="outline" onClick={() => setEmailModal({ reservationId: r.id, clientEmail: r.email! })}>
                      <Mail className="mr-1 h-3 w-3" /> {t("garage.reservations.contactClient")}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" asChild>
                    <a href={`tel:${r.phone}`}>
                      <Phone className="mr-1 h-3 w-3" /> {r.phone}
                    </a>
                  </Button>
                  {r.status !== "cancelled" && (
                    <>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleCancel(r.id)}>
                        {t("garage.reservations.cancelReservation")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDispute(r.id)}>
                        <AlertTriangle className="mr-1 h-3 w-3" /> {t("garage.reservations.dispute")}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Email modal */}
      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t("garage.reservations.contactClient")}</CardTitle>
              <button onClick={() => setEmailModal(null)}><XIcon className="h-4 w-4" /></button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{emailModal.clientEmail}</p>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={4}
                placeholder={t("garage.reservations.emailPlaceholder")}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
              />
              <Button onClick={handleSendEmail} disabled={sending || !emailMessage.trim()} className="w-full">
                {sending ? "…" : t("garage.reservations.contactClient")}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
