"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/lib/i18n/locale-context"
import { CalendarCheck, TrendingDown, Wallet, Clock } from "lucide-react"

type Stats = {
  totalAppointments: number
  revenue: number
  cancellationRate: number
  pendingPayouts: number
}

export default function GarageDashboardPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch("/api/garage/dashboard")
      .then((r) => r.json())
      .then((data) => { if (data.ok) setStats(data.stats) })
      .catch(() => {})
  }, [])

  const cards = [
    { key: "totalAppointments", icon: CalendarCheck, value: stats?.totalAppointments ?? 0, format: (v: number) => String(v) },
    { key: "revenue", icon: Wallet, value: stats?.revenue ?? 0, format: (v: number) => `${(v / 100).toFixed(2)} €` },
    { key: "cancellationRate", icon: TrendingDown, value: stats?.cancellationRate ?? 0, format: (v: number) => `${(v * 100).toFixed(1)}%` },
    { key: "pendingPayouts", icon: Clock, value: stats?.pendingPayouts ?? 0, format: (v: number) => String(v) },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("garage.dashboard.title")}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t(`garage.dashboard.${card.key}`)}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats ? card.format(card.value) : "—"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
