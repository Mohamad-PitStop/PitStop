import { z } from "zod"
import { fromZonedTime, toZonedTime } from "date-fns-tz"
import { formatISO } from "date-fns"
import { buildSlotsForDay, subtractBusy } from "@/lib/slots"
import { prisma } from "@/lib/prisma"
import { getBlockedSlotsForRange } from "@/lib/blocked-slots-db"
import { getCustomSlotsForRange } from "@/lib/custom-slots-db"

export const runtime = "nodejs"

const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    const url    = new URL(req.url)
    const parsed = QuerySchema.parse({
      date: url.searchParams.get("date") ?? "",
      type: url.searchParams.get("type") ?? undefined,
    })

    const timeZone = "Europe/Brussels"
    const dayUtc   = fromZonedTime(`${parsed.date}T00:00:00`, timeZone)
    const weekday  = toZonedTime(dayUtc, timeZone).getDay()

    // Plage horaire de la journée complète (pour custom slots et busy intervals)
    const fullDayStart = fromZonedTime(`${parsed.date}T00:00:00`, timeZone)
    const fullDayEnd   = fromZonedTime(`${parsed.date}T23:59:59`, timeZone)

    // Créneaux business hours (vide le dimanche)
    let allSlots: { start: string; end: string }[] = []
    if (weekday !== 0) {
      const startHour = 9
      const endHour   = weekday === 6 ? 12 : 17
      const dayStart  = fromZonedTime(`${parsed.date}T${String(startHour).padStart(2, "0")}:00:00`, timeZone)
      const dayEnd    = fromZonedTime(`${parsed.date}T${String(endHour).padStart(2, "0")}:00:00`, timeZone)
      allSlots = buildSlotsForDay({ dayStartIso: formatISO(dayStart), dayEndIso: formatISO(dayEnd), slotMinutes: 30 })
    }

    // Ajouter les créneaux spéciaux (custom) — valables tous les jours
    const customSlots = await getCustomSlotsForRange(fullDayStart, fullDayEnd)
    const existingStarts = new Set(allSlots.map(s => s.start))
    for (const cs of customSlots) {
      if (!existingStarts.has(cs.startAt)) {
        allSlots.push({ start: cs.startAt, end: cs.endAt })
      }
    }
    allSlots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

    // Filtrer les créneaux passés si c'est aujourd'hui (heure Bruxelles)
    const nowUtc      = new Date()
    const nowBrussels = toZonedTime(nowUtc, timeZone)
    const todayStr    = [
      nowBrussels.getFullYear(),
      String(nowBrussels.getMonth() + 1).padStart(2, "0"),
      String(nowBrussels.getDate()).padStart(2, "0"),
    ].join("-")
    if (parsed.date === todayStr) {
      allSlots = allSlots.filter(s => new Date(s.start) > nowUtc)
    }

    if (allSlots.length === 0) {
      return Response.json({ ok: true, timeZone, slots: [] })
    }

    // Créneaux occupés = réservations payées/confirmées + créneaux bloqués
    const rangeStart = allSlots[0].start
    const rangeEnd   = allSlots[allSlots.length - 1].end

    const [reservations, blockedSlots] = await Promise.all([
      prisma.$queryRawUnsafe<{ startAt: string; endAt: string }[]>(
        `SELECT "startAt", "endAt" FROM "Reservation"
         WHERE "status" IN ('paid', 'confirmed')
           AND "startAt" < ? AND "endAt" > ?`,
        rangeEnd, rangeStart
      ),
      getBlockedSlotsForRange(new Date(rangeStart), new Date(rangeEnd)),
    ])

    const busy = [
      ...reservations.map(r => ({ start: r.startAt, end: r.endAt })),
      ...blockedSlots.map(b => ({ start: b.startAt, end: b.endAt })),
    ]

    const freeSlots = subtractBusy(allSlots, busy)
    return Response.json({ ok: true, timeZone, slots: freeSlots })
  } catch (error) {
    console.error("Erreur availability:", error)
    return Response.json({ ok: false, error: "Erreur lors du chargement des disponibilités" }, { status: 400 })
  }
}
