import { formatISO } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { fromZonedTime, toZonedTime } from "date-fns-tz"
import { buildSlotsForDay, subtractBusy, type Slot } from "@/lib/slots"
import { prisma } from "@/lib/prisma"
import { findGarageById, type BusinessHours } from "@/lib/garage-db"
import { getGarageBlockedSlotsForRange } from "@/lib/garage-blocked-slots-db"
import { getClosuresForRange } from "@/lib/garage-closure-db"

const TIME_ZONE = "Europe/Brussels"

/**
 * Calcule les créneaux disponibles pour un garage à une date donnée.
 * Soustrait les réservations existantes, les créneaux bloqués et les fermetures.
 */
export async function getGarageAvailability(
  garageId: string,
  dateStr: string, // YYYY-MM-DD
  opts?: { allowUnapproved?: boolean }
): Promise<{ slots: Slot[]; timeZone: string }> {
  const garage = await findGarageById(garageId)
  if (!garage) {
    return { slots: [], timeZone: TIME_ZONE }
  }
  if (!opts?.allowUnapproved && garage.status !== "approved") {
    return { slots: [], timeZone: TIME_ZONE }
  }

  const hours: BusinessHours = JSON.parse(garage.businessHours)

  // Vérifier si c'est un jour de fermeture
  const closures = await getClosuresForRange(garageId, dateStr, dateStr)
  if (closures.length > 0) {
    return { slots: [], timeZone: TIME_ZONE }
  }

  const dayUtc = fromZonedTime(`${dateStr}T00:00:00`, TIME_ZONE)
  const dayOfWeek = toZonedTime(dayUtc, TIME_ZONE).getDay()

  const dayMap: Record<number, keyof BusinessHours> = {
    0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
  }
  const dayKey = dayMap[dayOfWeek]
  const dayHours = hours[dayKey] ?? []

  if (dayHours.length === 0) {
    return { slots: [], timeZone: TIME_ZONE }
  }

  // Construire les créneaux depuis les horaires du garage
  let allSlots: Slot[] = []
  for (const range of dayHours) {
    const dayStart = fromZonedTime(`${dateStr}T${range.start}:00`, TIME_ZONE)
    const dayEnd = fromZonedTime(`${dateStr}T${range.end}:00`, TIME_ZONE)
    const rangeSlots = buildSlotsForDay({
      dayStartIso: formatISO(dayStart),
      dayEndIso: formatISO(dayEnd),
      slotMinutes: 30,
    })
    allSlots = allSlots.concat(rangeSlots)
  }

  // Plage horaire complète de la journée pour les requêtes
  const fullDayStart = fromZonedTime(`${dateStr}T00:00:00`, TIME_ZONE)
  const fullDayEnd = fromZonedTime(`${dateStr}T23:59:59`, TIME_ZONE)

  // Soustraire les créneaux bloqués par le garage
  const blockedSlots = await getGarageBlockedSlotsForRange(garageId, fullDayStart, fullDayEnd)
  const blockedBusy = blockedSlots.map((b) => ({ start: b.startAt, end: b.endAt }))

  // Soustraire les réservations existantes
  const reservations = await prisma.$queryRawUnsafe<{ startAt: string; endAt: string }[]>(
    `SELECT "startAt", "endAt" FROM "Reservation"
     WHERE "garageId" = ? AND "status" IN ('paid', 'confirmed')
     AND "startAt" < ? AND "endAt" > ?`,
    garageId,
    fullDayEnd.toISOString(),
    fullDayStart.toISOString()
  )
  const reservedBusy = reservations.map((r) => ({ start: r.startAt, end: r.endAt }))

  // Combiner toutes les indisponibilités
  const allBusy = [...blockedBusy, ...reservedBusy]
  let available = subtractBusy(allSlots, allBusy)

  // Filtrer les créneaux passés (minimum 12h à l'avance pour la réservation publique).
  // Pour la vue propre du garage, on affiche toute la journée sans contrainte d'avance.
  if (!opts?.allowUnapproved) {
    const minTime = Date.now() + 12 * 60 * 60 * 1000
    available = available.filter((s) => new Date(s.start).getTime() >= minTime)
  }

  return { slots: available, timeZone: TIME_ZONE }
}

/** Vérifie que le créneau demandé est encore proposé par getGarageAvailability (libre, dans les règles 12h, etc.). */
export async function isGarageSlotBookable(
  garageId: string,
  startAtIso: string,
  endAtIso: string
): Promise<boolean> {
  const dateStr = formatInTimeZone(new Date(startAtIso), TIME_ZONE, "yyyy-MM-dd")
  const { slots } = await getGarageAvailability(garageId, dateStr)
  const ts = new Date(startAtIso).getTime()
  const te = new Date(endAtIso).getTime()
  return slots.some((s) => new Date(s.start).getTime() === ts && new Date(s.end).getTime() === te)
}
