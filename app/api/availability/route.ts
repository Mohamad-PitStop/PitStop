import { z } from "zod"
import { fromZonedTime, toZonedTime } from "date-fns-tz"
import { formatISO } from "date-fns"
import { buildSlotsForDay, subtractBusy } from "@/lib/slots"
import { prisma } from "@/lib/prisma"
import { getBlockedSlotsForRange } from "@/lib/blocked-slots-db"
import { getCustomSlotsForRange } from "@/lib/custom-slots-db"
import { getGarageAvailability } from "@/lib/garage-availability"
import { getUserFromAuthCookie } from "@/lib/auth-session"

export const runtime = "nodejs"

const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.string().optional(),
  garageId: z.string().min(1).optional(),
  garageView: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const parsed = QuerySchema.parse({
      date: url.searchParams.get("date") ?? "",
      type: url.searchParams.get("type") ?? undefined,
      garageId: url.searchParams.get("garageId") ?? undefined,
      garageView: url.searchParams.get("garageView") ?? undefined,
    })

    const timeZone = "Europe/Brussels"

    // ── Créneaux pour un garage précis (réservation client) ───────────────
    if (parsed.garageId) {
      const { slots, timeZone: tz } = await getGarageAvailability(parsed.garageId, parsed.date)
      return Response.json({ ok: true, timeZone: tz, slots })
    }

    // ── Vue calendrier garagiste connecté (son garage) ────────────────────
    if (parsed.garageView === "true" || parsed.garageView === "1") {
      const user = await getUserFromAuthCookie(req.headers.get("cookie"))
      if (!user?.garageId) {
        return Response.json(
          { ok: false, error: "Non autorisé ou aucun garage associé." },
          { status: 401 }
        )
      }
      const { slots, timeZone: tz } = await getGarageAvailability(user.garageId, parsed.date, {
        allowUnapproved: true,
      })
      return Response.json({ ok: true, timeZone: tz, slots })
    }

    const dayUtc = fromZonedTime(`${parsed.date}T00:00:00`, timeZone)
    const weekday = toZonedTime(dayUtc, timeZone).getDay()

    const fullDayStart = fromZonedTime(`${parsed.date}T00:00:00`, timeZone)
    const fullDayEnd = fromZonedTime(`${parsed.date}T23:59:59`, timeZone)

    let allSlots: { start: string; end: string }[] = []
    if (weekday !== 0) {
      const startHour = 9
      const endHour = weekday === 6 ? 12 : 17
      const dayStart = fromZonedTime(`${parsed.date}T${String(startHour).padStart(2, "0")}:00:00`, timeZone)
      const dayEnd = fromZonedTime(`${parsed.date}T${String(endHour).padStart(2, "0")}:00:00`, timeZone)
      allSlots = buildSlotsForDay({ dayStartIso: formatISO(dayStart), dayEndIso: formatISO(dayEnd), slotMinutes: 30 })
    }

    const customSlots = await getCustomSlotsForRange(fullDayStart, fullDayEnd)
    const existingStarts = new Set(allSlots.map((s) => s.start))
    for (const cs of customSlots) {
      if (!existingStarts.has(cs.startAt)) {
        allSlots.push({ start: cs.startAt, end: cs.endAt })
      }
    }
    allSlots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

    const nowUtc = new Date()
    const minBookingTime = new Date(nowUtc.getTime() + 18 * 60 * 60 * 1000)
    allSlots = allSlots.filter((s) => new Date(s.start) >= minBookingTime)

    if (allSlots.length === 0) {
      return Response.json({ ok: true, timeZone, slots: [] })
    }

    const rangeStart = allSlots[0].start
    const rangeEnd = allSlots[allSlots.length - 1].end

    const [reservations, blockedSlots] = await Promise.all([
      prisma.$queryRawUnsafe<{ startAt: string; endAt: string }[]>(
        `SELECT "startAt", "endAt" FROM "Reservation"
         WHERE "status" IN ('paid', 'confirmed')
           AND "garageId" IS NULL
           AND "startAt" < ? AND "endAt" > ?`,
        rangeEnd,
        rangeStart
      ),
      getBlockedSlotsForRange(new Date(rangeStart), new Date(rangeEnd)),
    ])

    const busy = [
      ...reservations.map((r) => ({ start: r.startAt, end: r.endAt })),
      ...blockedSlots.map((b) => ({ start: b.startAt, end: b.endAt })),
    ]

    const freeSlots = subtractBusy(allSlots, busy)
    return Response.json({ ok: true, timeZone, slots: freeSlots })
  } catch (error) {
    console.error("Erreur availability:", error)
    return Response.json({ ok: false, error: "Erreur lors du chargement des disponibilités" }, { status: 400 })
  }
}
