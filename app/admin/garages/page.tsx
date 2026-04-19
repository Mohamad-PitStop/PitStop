"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/lib/i18n/locale-context"
import { Navbar } from "@/components/navbar"
import { CheckCircle, XCircle, Clock, Users, ChevronDown, ChevronUp, Building2 } from "lucide-react"

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
  const [dataLoading, setDataLoading] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!data.user || data.user.role !== "admin") {
          router.push("/")
          return
        }
        setUser(data.user)
      })
  }, [router])

  const loadAll = useCallback(async () => {
    setDataLoading(true)
    try {
      const [d1, d2, d3] = await Promise.all([
        fetch("/api/admin/garages", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/admin/garages/hours-requests", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/admin/payouts", { credentials: "include" }).then((r) => r.json()),
      ])
      if (d1.ok) setGarages(d1.garages)
      if (d2.ok) setHoursRequests(d2.requests)
      if (d3.ok) setPayoutRequests(d3.payouts)
    } finally {
      setDataLoading(false)
    }
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
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold">{t("garage.admin.title")}</h1>

        {dataLoading ? (
          <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
            <p>{t("garage.admin.loading")}</p>
          </div>
        ) : null}

        {/* Garages list */}
        <section className="space-y-3">
          {!dataLoading && garages.length > 0 ? (
            <h2 className="text-lg font-semibold">{t("garage.admin.garagesList")}</h2>
          ) : null}

          {!dataLoading && garages.length === 0 ? (
            <Card className="border-dashed border-primary/25 bg-muted/10">
              <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center sm:flex-row sm:text-left">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Building2 className="h-7 w-7" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-base font-semibold text-foreground">{t("garage.admin.emptyGaragesTitle")}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{t("garage.admin.emptyGaragesDescription")}</p>
                  <Button asChild variant="outline" size="sm" className="mt-2 w-full sm:w-auto">
                    <Link href="/inscription-garage" target="_blank" rel="noopener noreferrer">
                      {t("garage.admin.emptyGaragesLink")}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {!dataLoading &&
            garages.map((g) => (
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
