"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/locale-context"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, addDays, startOfWeek, addWeeks, subWeeks, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns"
import { fr, enUS, nl } from "date-fns/locale"

type ViewType = "day" | "week" | "month"

type SlotData = {
  start: string
  end: string
  type: "available" | "booked" | "blocked"
  reservationName?: string
}

export default function GarageCalendarPage() {
  const { t, locale } = useTranslation()
  const dateFnsLocale = locale === "fr" ? fr : locale === "nl" ? nl : enUS
  const [view, setView] = useState<ViewType>("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [daySlots, setDaySlots] = useState<Record<string, SlotData[]>>({})

  const loadDay = useCallback(async (dateStr: string) => {
    const fetchOpts = { credentials: "include" as const }
    const [avail, blocked, reservations] = await Promise.all([
      fetch(`/api/availability?date=${encodeURIComponent(dateStr)}&garageView=true`, fetchOpts)
        .then((r) => r.json())
        .catch(() => ({ slots: [] })),
      fetch(
        `/api/garage/blocked-slots?from=${encodeURIComponent(dateStr)}T00:00:00&to=${encodeURIComponent(dateStr)}T23:59:59`,
        fetchOpts
      )
        .then((r) => r.json())
        .catch(() => ({ blockedSlots: [] })),
      fetch(
        `/api/garage/reservations?from=${encodeURIComponent(dateStr)}T00:00:00Z&to=${encodeURIComponent(dateStr)}T23:59:59Z`,
        fetchOpts
      )
        .then((r) => r.json())
        .catch(() => ({ reservations: [] })),
    ])
    const slots: SlotData[] = []
    for (const s of avail.slots || []) {
      slots.push({ start: s.start, end: s.end, type: "available" })
    }
    for (const b of blocked.blockedSlots || []) {
      slots.push({ start: b.startAt, end: b.endAt, type: "blocked" })
    }
    for (const r of reservations.reservations || []) {
      if (r.status !== "cancelled") {
        slots.push({ start: r.startAt, end: r.endAt, type: "booked", reservationName: r.name })
      }
    }
    slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    return slots
  }, [])

  useEffect(() => {
    async function loadAll() {
      const dates: string[] = []
      if (view === "day") {
        dates.push(format(currentDate, "yyyy-MM-dd"))
      } else if (view === "week") {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 })
        for (let i = 0; i < 7; i++) dates.push(format(addDays(start, i), "yyyy-MM-dd"))
      } else {
        const start = startOfMonth(currentDate)
        const end = endOfMonth(currentDate)
        const days = eachDayOfInterval({ start, end })
        for (const d of days) dates.push(format(d, "yyyy-MM-dd"))
      }
      const results: Record<string, SlotData[]> = {}
      // Load in batches of 7
      for (let i = 0; i < dates.length; i += 7) {
        const batch = dates.slice(i, i + 7)
        const loaded = await Promise.all(batch.map((d) => loadDay(d).then((slots) => ({ d, slots }))))
        for (const { d, slots } of loaded) results[d] = slots
      }
      setDaySlots(results)
    }
    loadAll()
  }, [view, currentDate, loadDay])

  const navigate = (dir: -1 | 1) => {
    if (view === "day") setCurrentDate((d) => addDays(d, dir))
    else if (view === "week") setCurrentDate((d) => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1))
    else setCurrentDate((d) => dir === 1 ? addMonths(d, 1) : subMonths(d, 1))
  }

  const handleBlockSlot = async (dateStr: string, start: string, end: string) => {
    await fetch("/api/garage/blocked-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ startAt: start, endAt: end }),
    })
    const slots = await loadDay(dateStr)
    setDaySlots((prev) => ({ ...prev, [dateStr]: slots }))
  }

  const slotColor = (type: string) => {
    if (type === "booked") return "border-blue-400/60 text-blue-200"
    if (type === "blocked") return "border-red-400/60 text-red-200"
    return "border-green-400/60 text-green-200"
  }

  const renderDayColumn = (dateStr: string) => {
    const slots = daySlots[dateStr] || []
    const day = new Date(dateStr + "T12:00:00")
    return (
      <div key={dateStr} className="flex-1 min-w-0">
        <div className={`mb-2 text-center text-xs font-medium ${isToday(day) ? "text-primary" : "text-muted-foreground"}`}>
          {format(day, "EEE dd", { locale: dateFnsLocale })}
        </div>
        <div className="space-y-1">
          {slots.length === 0 && (
            <div className="rounded border border-dashed border-border p-2 text-center text-xs text-muted-foreground">
              {t("garage.calendar.closed")}
            </div>
          )}
          {slots.map((slot, i) => (
            <div
              key={i}
              className={`mx-auto w-20 rounded border bg-transparent px-2 py-1 text-center text-xs ${slotColor(slot.type)} ${slot.type === "available" ? "cursor-pointer transition-colors hover:bg-white/5" : ""}`}
              onClick={() => slot.type === "available" && handleBlockSlot(dateStr, slot.start, slot.end)}
              title={slot.type === "available" ? t("garage.calendar.blockSlot") : ""}
            >
              <span>{format(new Date(slot.start), "HH:mm")}</span>
              {slot.reservationName && <span className="ml-1 truncate">{slot.reservationName}</span>}
              {slot.type === "blocked" && <span className="ml-1">{t("garage.calendar.blocked")}</span>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const visibleDates = Object.keys(daySlots).sort()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("garage.nav.calendar")}</h1>
        <div className="flex items-center gap-2">
          {(["day", "week", "month"] as ViewType[]).map((v) => (
            <Button key={v} variant={view === v ? "default" : "outline"} size="sm" onClick={() => setView(v)}>
              {t(`garage.calendar.${v}View`)}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
        <span className="text-sm font-medium">
          {view === "month"
            ? format(currentDate, "MMMM yyyy", { locale: dateFnsLocale })
            : view === "day"
              ? format(currentDate, "EEEE dd MMMM yyyy", { locale: dateFnsLocale })
              : `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "dd MMM", { locale: dateFnsLocale })} - ${format(addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6), "dd MMM yyyy", { locale: dateFnsLocale })}`}
        </span>
        <Button variant="ghost" size="icon" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>{t("garage.calendar.today")}</Button>

      <Card>
        <CardContent className="p-4">
          {view === "month" ? (
            <div className="grid grid-cols-7 gap-2">
              {visibleDates.map((dateStr) => {
                const day = new Date(dateStr + "T12:00:00")
                const slots = daySlots[dateStr] || []
                const booked = slots.filter((s) => s.type === "booked").length
                const blocked = slots.filter((s) => s.type === "blocked").length
                return (
                  <div
                    key={dateStr}
                    className={`rounded border p-2 text-center ${isSameMonth(day, currentDate) ? "" : "opacity-40"} ${isToday(day) ? "border-primary" : "border-border"}`}
                  >
                    <div className="text-xs font-medium">{format(day, "d")}</div>
                    {booked > 0 && <div className="mt-1 text-[10px] text-blue-600">{booked} RDV</div>}
                    {blocked > 0 && <div className="text-[10px] text-red-500">{blocked} bloq.</div>}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto">
              {visibleDates.map(renderDayColumn)}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-green-200 border border-green-300" /> {t("garage.calendar.available")}</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-blue-200 border border-blue-300" /> {t("garage.calendar.booked")}</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-200 border border-red-300" /> {t("garage.calendar.blocked")}</span>
      </div>
    </div>
  )
}
