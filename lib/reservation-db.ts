import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"

let migrated = false

export async function ensureReservationMigrations() {
  if (migrated) return
  // cancelToken column
  const col1 = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM pragma_table_info('Reservation') WHERE name = 'cancelToken'`
  )
  if (col1.length === 0) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Reservation" ADD COLUMN "cancelToken" TEXT`
    )
  }
  // userId column
  const col2 = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM pragma_table_info('Reservation') WHERE name = 'userId'`
  )
  if (col2.length === 0) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Reservation" ADD COLUMN "userId" TEXT`
    )
  }
  const col3 = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM pragma_table_info('Reservation') WHERE name = 'garageId'`
  )
  if (col3.length === 0) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Reservation" ADD COLUMN "garageId" TEXT`)
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Reservation_garageId_startAt_idx" ON "Reservation" ("garageId", "startAt")`
    )
  }
  migrated = true
}

export function generateCancelToken(): string {
  return randomUUID()
}

/** Ligne réservation pour listes (profil) : pas besoin des champs calendrier. */
export type ReservationRow = {
  id: string
  type: string
  name: string
  phone: string
  email: string | null
  startAt: string
  endAt: string
  timeZone: string
  status: string
  stripePaymentIntentId: string | null
  stripeSessionId: string | null
  cancelToken: string | null
  userId: string | null
}

/** Détail réservation pour annulation (calendrier + Stripe). */
export type ReservationForCancelRow = ReservationRow & {
  calendarId: string | null
  calendarEventId: string | null
}

export async function findReservationByCancelToken(token: string): Promise<ReservationForCancelRow | null> {
  await ensureReservationMigrations()
  const rows = await prisma.$queryRawUnsafe<ReservationForCancelRow[]>(
    `SELECT id, type, name, phone, email, startAt, endAt, timeZone, status,
            stripePaymentIntentId, stripeSessionId, cancelToken, userId,
            calendarId, calendarEventId
     FROM "Reservation" WHERE "cancelToken" = ? LIMIT 1`,
    token
  )
  return rows[0] ?? null
}

export async function findReservationsByUserId(userId: string): Promise<ReservationRow[]> {
  await ensureReservationMigrations()
  const rows = await prisma.$queryRawUnsafe<ReservationRow[]>(
    `SELECT id, type, name, phone, email, startAt, endAt, timeZone, status,
            stripePaymentIntentId, stripeSessionId, cancelToken, userId
     FROM "Reservation" WHERE "userId" = ? ORDER BY startAt DESC`,
    userId
  )
  return rows
}

export async function markReservationCancelled(id: string): Promise<void> {
  await prisma.reservation.update({
    where: { id },
    data: {
      status: "cancelled",
      calendarEventId: null,
    },
  })
}

/** Délais d'annulation (en millisecondes) */
export const CANCEL_ONLINE_LIMIT_MS = 12 * 60 * 60 * 1000  // 12h
export const CANCEL_BLOCK_LIMIT_MS  =  1 * 60 * 60 * 1000  //  1h

export type CancelWindow = "allowed" | "contact_garage" | "too_late"

export function getCancelWindow(startAt: Date): CancelWindow {
  const now = Date.now()
  const remaining = startAt.getTime() - now
  if (remaining > CANCEL_ONLINE_LIMIT_MS) return "allowed"
  if (remaining > CANCEL_BLOCK_LIMIT_MS)  return "contact_garage"
  return "too_late"
}
