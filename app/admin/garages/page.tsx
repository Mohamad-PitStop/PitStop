"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/lib/i18n/locale-context"
import { Navbar } from "@/components/navbar"
import { CheckCircle, XCircle, Clock, Users, ChevronDown, ChevronUp } from "lucide-react"

type GarageMember = { email: string; role: "manager" | "employee"; status: string }
type Garage = {
  id: string; companyName: string; garageCode: string; bceTvaNumber: string;
  postalCode: string; city: string; status: string; createdAt: string;
  professionalEmail: string; professionalPhone: string; managerName: string;
  members: GarageMember[]
}
type HoursRequest = {
  id: string; garageId: string; currentHours: string; proposedHours: string;
  status: string; createdAt: string; garageCompanyName?: string
}
type PayoutRequest = {
  id: string; garageId: string; reservationId: string; amountCents: number;
  companyName?: string; iban?: string; requestedAt: string
}

export default function AdminGaragesPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [user, setUser] = useState<{ role: string } | null>(null)
  const [garages, setGarages] = useState<Garage[]>([])
  const [hoursRequests, setHoursRequests] = useState<HoursRequest[]>([])
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([])
  const [expandedGarage, setExpandedGarage] = useState<string | null>(null)
  const [transferRef, setTransferRef] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((data) => {
      if (!data.user || data.user.role !== "admin") { router.push("/"); return }
      setUser(data.user)
    })
  }, [router])

  const loadAll = useCallback(() => {
    fetch("/api/admin/garages").then((r) => r.json()).then((d) => { if (d.ok) setGarages(d.garages) })
    fetch("/api/admin/garages/hours-requests").then((r) => r.json()).then((d) => { if (d.ok) setHoursRequests(d.requests) })
    fetch("/api/admin/payouts").then((r) => r.json()).then((d) => { if (d.ok) setPayoutRequests(d.payouts) })
  }, [])

  useEffect(() => { if (user) loadAll() }, [user, loadAll])

  const handleGarageAction = async (garageId: string, action: "approve" | "suspend") => {
    await fetch("/api/admin/garages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ garageId, action }),
    })
    loadAll()
  }

  const handleHoursAction = async (requestId: string, action: "approve" | "reject") => {
    await fetch("/api/admin/garages/hours-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    })
    loadAll()
  }

  const handleConfirmPayout = async (payoutId: string) => {
    const ref = transferRef[payoutId]
    if (!ref?.trim()) return
    await fetch("/api/admin/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutId, reference: ref }),
    })
    loadAll()
  }

  const statusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle className="h-4 w-4 text-green-600" />
    if (status === "suspended") return <XCircle className="h-4 w-4 text-red-600" />
    return <Clock className="h-4 w-4 text-yellow-600" />
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold">{t("garage.admin.title")}</h1>

        {/* Garages list */}
        <section className="space-y-3">
          {garages.map((g) => (
            <Card key={g.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {statusIcon(g.status)}
                    <div>
                      <p className="font-medium">{g.companyName}</p>
                      <p className="text-xs text-muted-foreground">{g.garageCode} — {g.postalCode} {g.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {g.status === "pending" && (
                      <Button size="sm" onClick={() => handleGarageAction(g.id, "approve")}>{t("garage.admin.approve")}</Button>
                    )}
                    {g.status === "approved" && (
                      <Button size="sm" variant="destructive" onClick={() => handleGarageAction(g.id, "suspend")}>{t("garage.admin.suspend")}</Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setExpandedGarage(expandedGarage === g.id ? null : g.id)}>
                      {expandedGarage === g.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {expandedGarage === g.id && (
                  <div className="mt-4 space-y-3 border-t pt-3">
                    <div className="grid gap-2 text-sm">
                      <p><strong>BCE/TVA :</strong> {g.bceTvaNumber}</p>
                      <p><strong>{t("garage.admin.manager")} :</strong> {g.managerName} ({g.professionalEmail})</p>
                      <p><strong>Tel :</strong> {g.professionalPhone}</p>
                    </div>
                    <div>
                      <p className="flex items-center gap-1 text-sm font-medium"><Users className="h-3 w-3" /> {t("garage.admin.members")}</p>
                      <div className="mt-1 space-y-1">
                        {g.members.map((m, i) => (
                          <p key={i} className="text-sm text-muted-foreground">
                            {m.email} — <span className="capitalize">{m.role}</span>
                            {m.status !== "active" && m.role !== "manager" && ` (${m.status})`}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Hours change requests */}
        {hoursRequests.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{t("garage.admin.hoursRequests")}</h2>
            {hoursRequests.map((hr) => (
              <Card key={hr.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{hr.garageCompanyName || hr.garageId}</p>
                    <p className="text-xs text-muted-foreground">{new Date(hr.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleHoursAction(hr.id, "approve")}>{t("garage.admin.approveHours")}</Button>
                    <Button size="sm" variant="outline" onClick={() => handleHoursAction(hr.id, "reject")}>{t("garage.admin.rejectHours")}</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        )}

        {/* Payout requests */}
        {payoutRequests.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{t("garage.admin.payoutRequests")}</h2>
            {payoutRequests.map((pr) => (
              <Card key={pr.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{pr.companyName}</p>
                      <p className="text-sm">{(Number(pr.amountCents) / 100).toFixed(2)} €</p>
                      <p className="text-xs text-muted-foreground">IBAN : {pr.iban}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t("garage.admin.transferReference")}
                      value={transferRef[pr.id] || ""}
                      onChange={(e) => setTransferRef((prev) => ({ ...prev, [pr.id]: e.target.value }))}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={() => handleConfirmPayout(pr.id)} disabled={!transferRef[pr.id]?.trim()}>
                      {t("garage.admin.confirmTransfer")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
