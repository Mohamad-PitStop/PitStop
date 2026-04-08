"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/locale-context"
import { format } from "date-fns"

type Payout = {
  id: string
  reservationId: string
  amountCents: number
  status: string
  readyAt: string | null
  requestedAt: string | null
  transferredAt: string | null
  createdAt: string
  reservationStartAt?: string
  reservationName?: string
}

export default function GaragePayoutsPage() {
  const { t } = useTranslation()
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [requesting, setRequesting] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch("/api/garage/payout")
      .then((r) => r.json())
      .then((data) => { if (data.ok) setPayouts(data.payouts) })
  }, [])

  useEffect(() => { load() }, [load])

  const handleWithdraw = async (payoutId: string) => {
    const payout = payouts.find((p) => p.id === payoutId)
    if (!payout) return
    const amountStr = `${(payout.amountCents / 100).toFixed(2)} €`
    if (!confirm(t("garage.payouts.withdrawConfirm", { amount: amountStr }))) return
    setRequesting(payoutId)
    await fetch("/api/garage/payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutId }),
    })
    setRequesting(null)
    load()
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      ready: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      requested: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      transferred: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    }
    const key = `garage.payouts.status${status.charAt(0).toUpperCase() + status.slice(1)}` as string
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-muted"}`}>
        {t(key)}
      </span>
    )
  }

  const totalReady = payouts.filter((p) => p.status === "ready").reduce((sum, p) => sum + Number(p.amountCents), 0)
  const totalTransferred = payouts.filter((p) => p.status === "transferred").reduce((sum, p) => sum + Number(p.amountCents), 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("garage.payouts.title")}</h1>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("garage.payouts.totalReady")}</p>
            <p className="text-2xl font-bold text-green-600">{(totalReady / 100).toFixed(2)} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("garage.payouts.totalTransferred")}</p>
            <p className="text-2xl font-bold">{(totalTransferred / 100).toFixed(2)} €</p>
          </CardContent>
        </Card>
      </div>

      {/* Payout list */}
      {payouts.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">{t("garage.payouts.noPayouts")}</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {payouts.map((p) => {
            const isReady = p.status === "ready"
            const isPending = p.status === "pending"
            return (
              <Card key={p.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{(Number(p.amountCents) / 100).toFixed(2)} €</span>
                      {statusBadge(p.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {p.reservationName && `${p.reservationName} — `}
                      {p.reservationStartAt && format(new Date(p.reservationStartAt), "dd/MM/yyyy HH:mm")}
                    </p>
                    {p.transferredAt && (
                      <p className="text-xs text-muted-foreground">
                        {t("garage.payouts.statusTransferred")} : {format(new Date(p.transferredAt), "dd/MM/yyyy")}
                      </p>
                    )}
                  </div>
                  <div>
                    {isReady && (
                      <Button onClick={() => handleWithdraw(p.id)} disabled={requesting === p.id}>
                        {t("garage.payouts.withdraw")}
                      </Button>
                    )}
                    {isPending && (
                      <Button disabled className="cursor-not-allowed opacity-50" title={t("garage.payouts.withdrawDisabledTooltip")}>
                        {t("garage.payouts.withdraw")}
                      </Button>
                    )}
                  </div>
                </CardContent>
                {isPending && (
                  <div className="border-t border-border px-4 py-2">
                    <p className="text-xs text-muted-foreground">{t("garage.payouts.withdrawDisabledTooltip")}</p>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
