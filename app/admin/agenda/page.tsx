"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { fr } from "date-fns/locale"
import { format, startOfDay, isBefore } from "date-fns"
import { fromZonedTime, toZonedTime } from "date-fns-tz"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CalendarDays, Lock, Unlock, User, ChevronLeft, Ban, Plus, Sparkles, ArrowRight, X } from "lucide-react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"

const TIME_ZONE = "Europe/Brussels"

type BlockedSlot  = { id: string; startAt: string; endAt: string; label: string | null }
type CustomSlot   = { id: string; startAt: string; endAt: string; label: string | null }
type Reservation  = { id: string; name: string; startAt: string; endAt: string }
type SlotStatus   = "free" | "blocked" | "reserved" | "custom"

type Slot = {
  time: string
  startIso: string
  endIso: string
  status: SlotStatus
  blockedId?: string
  blockedLabel?: string | null
  customId?: string
  customLabel?: string | null
  reservationId?: string
  reservationName?: string
}

function buildBusinessSlots(date: Date) {
  const dateStr = format(toZonedTime(date, TIME_ZONE), "yyyy-MM-dd")
  const weekday = toZonedTime(date, TIME_ZONE).getDay()
  if (weekday === 0) return []
  const endHour = weekday === 6 ? 12 : 17
  const slots = []
  for (let h = 9; h < endHour; h++) {
    for (const m of [0, 30]) {
      const p  = (n: number) => String(n).padStart(2, "0")
      const eh = m === 30 ? h + 1 : h
      const em = m === 30 ? 0 : 30
      slots.push({
        startIso: fromZonedTime(`${dateStr}T${p(h)}:${p(m)}:00`, TIME_ZONE).toISOString(),
        endIso:   fromZonedTime(`${dateStr}T${p(eh)}:${p(em)}:00`, TIME_ZONE).toISOString(),
        time: `${p(h)}:${p(m)}`,
      })
    }
  }
  return slots
}

function mergeSlots(
  base: ReturnType<typeof buildBusinessSlots>,
  blocked: BlockedSlot[],
  custom: CustomSlot[],
  reservations: Reservation[]
): Slot[] {
  // Merge base + custom, deduplicate by startIso
  const allMap = new Map<string, { startIso: string; endIso: string; time: string }>()
  for (const s of base) allMap.set(s.startIso, s)
  for (const c of custom) {
    if (!allMap.has(c.startAt)) {
      const d = toZonedTime(new Date(c.startAt), TIME_ZONE)
      allMap.set(c.startAt, {
        startIso: c.startAt,
        endIso:   c.endAt,
        time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      })
    }
  }
  const all = [...allMap.values()].sort((a, b) => new Date(a.startIso).getTime() - new Date(b.startIso).getTime())

  return all.map(s => {
    const res = reservations.find(r => new Date(r.startAt) <= new Date(s.startIso) && new Date(r.endAt) >= new Date(s.endIso))
    if (res) return { ...s, status: "reserved" as SlotStatus, reservationId: res.id, reservationName: res.name }

    const blk = blocked.find(b => new Date(b.startAt) <= new Date(s.startIso) && new Date(b.endAt) >= new Date(s.endIso))
    if (blk) return { ...s, status: "blocked" as SlotStatus, blockedId: blk.id, blockedLabel: blk.label }

    const cst = custom.find(c => c.startAt === s.startIso)
    if (cst) return { ...s, status: "custom" as SlotStatus, customId: cst.id, customLabel: cst.label }

    return { ...s, status: "free" as SlotStatus }
  })
}

// Calcule l'heure locale Bruxelles depuis un ISO UTC
function isoToLocalTime(iso: string) {
  const d = toZonedTime(new Date(iso), TIME_ZONE)
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`
}

export default function AdminAgendaPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate]     = useState<Date>(() => new Date())
  const [slots, setSlots]                   = useState<Slot[]>([])
  const [loading, setLoading]               = useState(false)
  const [actionId, setActionId]             = useState<string | null>(null)
  const [labelDraft, setLabelDraft]         = useState("")

  // Formulaire ajout créneau spécial
  const [showAddForm, setShowAddForm]       = useState(false)
  const [addTime, setAddTime]               = useState("09:00")
  const [addLabel, setAddLabel]             = useState("")

  // Formulaire déplacement réservation
  const [movingSlot, setMovingSlot]         = useState<Slot | null>(null)
  const [moveDate, setMoveDate]             = useState("")
  const [moveTime, setMoveTime]             = useState("")

  const dateStr   = format(toZonedTime(selectedDate, TIME_ZONE), "yyyy-MM-dd")
  const isWeekend = toZonedTime(selectedDate, TIME_ZONE).getDay() === 0
  const addTimeOptions = (() => {
    const startMinutes = 9 * 60
    const endMinutes = 20 * 60
    const out: string[] = []
    for (let m = startMinutes; m <= endMinutes; m += 10) {
      const hh = String(Math.floor(m / 60)).padStart(2, "0")
      const mm = String(m % 60).padStart(2, "0")
      out.push(`${hh}:${mm}`)
    }
    return out
  })()

  const fetchSlots = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/admin/blocked-slots?date=${dateStr}`)
      if (res.status === 403) { router.replace("/"); return }
      const data = await res.json()
      setSlots(mergeSlots(
        buildBusinessSlots(selectedDate),
        data.blockedSlots ?? [],
        data.customSlots  ?? [],
        data.reservations ?? []
      ))
    } finally { setLoading(false) }
  }, [dateStr, selectedDate, router])

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).catch(() => null).then(d => {
      if (!d?.user || d.user.role !== "admin") { router.replace("/"); return }
      fetchSlots()
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setMovingSlot(null)
    setShowAddForm(false)
    fetchSlots()
  }, [fetchSlots])

  async function blockSlot(s: Slot) {
    setActionId(s.time)
    await fetch("/api/admin/blocked-slots", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startAt: s.startIso, endAt: s.endIso, label: labelDraft.trim() || "Indisponible" }),
    })
    await fetchSlots(); setActionId(null)
  }

  async function unblockSlot(s: Slot) {
    if (!s.blockedId) return
    setActionId(s.time)
    await fetch("/api/admin/blocked-slots", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.blockedId }),
    })
    await fetchSlots(); setActionId(null)
  }

  async function deleteCustom(s: Slot) {
    if (!s.customId) return
    setActionId(s.time)
    await fetch("/api/admin/custom-slots", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.customId }),
    })
    await fetchSlots(); setActionId(null)
  }

  async function blockEntireDay() {
    const ds      = format(toZonedTime(selectedDate, TIME_ZONE), "yyyy-MM-dd")
    const weekday = toZonedTime(selectedDate, TIME_ZONE).getDay()
    if (weekday === 0) return
    const endHour  = weekday === 6 ? 12 : 17
    const startIso = fromZonedTime(`${ds}T09:00:00`, TIME_ZONE).toISOString()
    const endIso   = fromZonedTime(`${ds}T${String(endHour).padStart(2,"0")}:00:00`, TIME_ZONE).toISOString()
    setActionId("day")
    await fetch("/api/admin/blocked-slots", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startAt: startIso, endAt: endIso, label: labelDraft.trim() || "Journée bloquée" }),
    })
    await fetchSlots(); setActionId(null)
  }

  async function unblockEntireDay() {
    const ids = [...new Set(slots.filter(s => s.status === "blocked").map(s => s.blockedId!))]
    setActionId("day")
    await Promise.all(ids.map(id =>
      fetch("/api/admin/blocked-slots", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    ))
    await fetchSlots(); setActionId(null)
  }

  async function addCustomSlot() {
    if (!addTime) return
    const ds       = format(toZonedTime(selectedDate, TIME_ZONE), "yyyy-MM-dd")
    const startIso = fromZonedTime(`${ds}T${addTime}:00`, TIME_ZONE).toISOString()
    const endIso   = new Date(new Date(startIso).getTime() + 30 * 60 * 1000).toISOString()
    setActionId("add")
    await fetch("/api/admin/custom-slots", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startAt: startIso, endAt: endIso, label: addLabel.trim() || "Créneau spécial" }),
    })
    setShowAddForm(false); setAddTime("09:00"); setAddLabel("")
    await fetchSlots(); setActionId(null)
  }

  async function moveReservation() {
    if (!movingSlot?.reservationId || !moveDate || !moveTime) return
    const origDuration = new Date(movingSlot.endIso).getTime() - new Date(movingSlot.startIso).getTime()
    const startIso = fromZonedTime(`${moveDate}T${moveTime}:00`, TIME_ZONE).toISOString()
    const endIso   = new Date(new Date(startIso).getTime() + origDuration).toISOString()
    setActionId("move")
    await fetch("/api/admin/reservations", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: movingSlot.reservationId, startAt: startIso, endAt: endIso }),
    })
    setMovingSlot(null)
    await fetchSlots(); setActionId(null)
  }

  const freeCount     = slots.filter(s => s.status === "free").length
  const blockedCount  = slots.filter(s => s.status === "blocked").length
  const reservedCount = slots.filter(s => s.status === "reserved").length
  const allBlocked    = slots.length > 0 && freeCount === 0
  const hasBlocked    = blockedCount > 0

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-4xl px-4 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-primary shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Gestion de l&apos;agenda</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Bloquez, ajoutez ou déplacez des créneaux</p>
            </div>
          </div>
          <Link href="/admin/users">
            <Button variant="outline" size="sm" className="gap-1.5 border-border/60 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" /> Panneau admin
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Libres",   count: freeCount,     color: "text-primary" },
            { label: "Bloqués",  count: blockedCount,  color: "text-destructive" },
            { label: "Réservés", count: reservedCount, color: "text-amber-400" },
          ].map(({ label, count, color }) => (
            <Card key={label} className="border-border/50">
              <CardContent className="pt-4 pb-4 text-center">
                <p className={`text-2xl font-bold ${color} leading-none`}>{loading ? ":" : isWeekend && label !== "Libres" ? ":" : count}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Grille */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Calendrier */}
          <Card className="border-border/50">
            <CardContent className="pt-4 flex items-center justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                locale={fr}
                disabled={(d) => isBefore(startOfDay(d), startOfDay(new Date()))}
                className="[--cell-size:--spacing(9)]"
              />
            </CardContent>
          </Card>

          {/* Créneaux */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-base capitalize">
                    {format(toZonedTime(selectedDate, TIME_ZONE), "EEEE d MMMM", { locale: fr })}
                  </CardTitle>
                  <CardDescription>
                    {isWeekend ? "Fermé : créneaux spéciaux uniquement" : `${freeCount} créneau${freeCount !== 1 ? "x" : ""} disponible${freeCount !== 1 ? "s" : ""}`}
                  </CardDescription>
                </div>
                {!isWeekend && !loading && (
                  hasBlocked && allBlocked
                    ? <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 border-border/60" disabled={actionId === "day"} onClick={unblockEntireDay}>
                        <Unlock className="h-3.5 w-3.5" /> Tout débloquer
                      </Button>
                    : <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 border-destructive/50 text-destructive hover:bg-destructive/10" disabled={actionId === "day"} onClick={blockEntireDay}>
                        <Ban className="h-3.5 w-3.5" /> Bloquer la journée
                      </Button>
                )}
              </div>

              {/* Raison globale (hors dimanche) */}
              {!isWeekend && freeCount > 0 && (
                <Input
                  placeholder='Raison du blocage (ex : "Congé", "Formation"…)'
                  value={labelDraft}
                  onChange={e => setLabelDraft(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              )}
            </CardHeader>

            <CardContent className="pt-0 min-h-[220px] flex flex-col gap-3">

              {/* Grille des créneaux */}
              {loading ? (
                <div className="flex justify-center py-6">
                  <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </div>
              ) : (
                <>
                  {slots.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 content-start">
                      {slots.map(s => {
                        const busy = actionId === s.time
                        if (s.status === "reserved") return (
                          <button key={s.time}
                            title={`Réservé : ${s.reservationName} : cliquer pour déplacer`}
                            disabled={busy}
                            onClick={() => { setMovingSlot(s); setMoveDate(dateStr); setMoveTime(isoToLocalTime(s.startIso)) }}
                            className="flex flex-col items-center justify-center rounded-md border border-amber-500/40 bg-amber-500/10 px-1 py-2 hover:bg-amber-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <span className="text-xs font-semibold text-amber-300">{s.time}</span>
                            <User className="h-3 w-3 text-amber-400/60 mt-0.5" />
                          </button>
                        )
                        if (s.status === "blocked") return (
                          <button key={s.time}
                            title={`Bloqué : ${s.blockedLabel ?? "Indisponible"} : cliquer pour débloquer`}
                            disabled={busy}
                            onClick={() => unblockSlot(s)}
                            className="flex flex-col items-center justify-center rounded-md border border-destructive/40 bg-destructive/10 px-1 py-2 hover:bg-destructive/20 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <span className="text-xs font-semibold text-destructive/80">{s.time}</span>
                            <Lock className="h-3 w-3 text-destructive/60 mt-0.5" />
                          </button>
                        )
                        if (s.status === "custom") return (
                          <button key={s.time}
                            title={`Créneau spécial : ${s.customLabel ?? ""} : cliquer pour supprimer`}
                            disabled={busy}
                            onClick={() => deleteCustom(s)}
                            className="flex flex-col items-center justify-center rounded-md border border-violet-500/40 bg-violet-500/10 px-1 py-2 hover:bg-violet-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <span className="text-xs font-semibold text-violet-300">{s.time}</span>
                            <Sparkles className="h-3 w-3 text-violet-400/60 mt-0.5" />
                          </button>
                        )
                        // free
                        return (
                          <button key={s.time}
                            title="Cliquer pour bloquer"
                            disabled={busy}
                            onClick={() => blockSlot(s)}
                            className="flex flex-col items-center justify-center rounded-md border border-border/50 bg-secondary/30 px-1 py-2 hover:border-destructive/40 hover:bg-destructive/5 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <span className="text-xs font-semibold text-foreground">{s.time}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {isWeekend && slots.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucun créneau spécial ce jour.</p>
                  )}

                  {/* Légende */}
                  {slots.length > 0 && (
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1 border-t border-border/30">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-border/50 bg-secondary/30 inline-block"/> Libre</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-destructive/40 bg-destructive/10 inline-block"/> Bloqué</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-amber-500/40 bg-amber-500/10 inline-block"/> Réservé</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-violet-500/40 bg-violet-500/10 inline-block"/> Spécial</span>
                    </div>
                  )}
                </>
              )}

              {/* Formulaire déplacement réservation */}
              {movingSlot && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                      <ArrowRight className="h-3.5 w-3.5"/> Déplacer : {movingSlot.reservationName}
                    </p>
                    <button onClick={() => setMovingSlot(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5"/>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Input type="date" value={moveDate} min={dateStr}
                      onChange={e => setMoveDate(e.target.value)} className="h-8 text-xs flex-1" />
                    <Input type="time" value={moveTime} step={1800}
                      onChange={e => setMoveTime(e.target.value)} className="h-8 text-xs w-28" />
                  </div>
                  <Button size="sm" className="h-8 w-full text-xs gap-1.5" disabled={actionId === "move"} onClick={moveReservation}>
                    <ArrowRight className="h-3.5 w-3.5"/> Confirmer le déplacement
                  </Button>
                </div>
              )}

              {/* Bouton + formulaire ajout créneau spécial */}
              {!showAddForm ? (
                <Button variant="outline" size="sm" className="h-8 w-full text-xs gap-1.5 border-violet-500/40 text-violet-300 hover:bg-violet-500/10 mt-auto"
                  onClick={() => setShowAddForm(true)}>
                  <Plus className="h-3.5 w-3.5"/> Ajouter un créneau spécial
                </Button>
              ) : (
                <div className="rounded-md border border-violet-500/30 bg-violet-500/5 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-violet-300 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5"/> Nouveau créneau spécial
                    </p>
                    <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5"/>
                    </button>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Créneau</label>
                    <select
                      value={addTime}
                      onChange={e => setAddTime(e.target.value)}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground"
                    >
                      {addTimeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input placeholder='Label (ex : "Famille", "Ami")' value={addLabel}
                    onChange={e => setAddLabel(e.target.value)} className="h-8 text-xs"
                    onKeyDown={e => { if (e.key === "Enter") addCustomSlot() }}/>
                  <Button size="sm" className="h-8 w-full text-xs gap-1.5 bg-violet-600 hover:bg-violet-500 text-white"
                    disabled={actionId === "add" || !addTime} onClick={addCustomSlot}>
                    <Plus className="h-3.5 w-3.5"/> Ajouter
                  </Button>
                </div>
              )}

            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  )
}
