import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"

export type PayoutStatus = "pending" | "ready" | "requested" | "transferred" | "cancelled"

export type DepositPayoutRow = {
  id: string
  createdAt: string
  garageId: string
  reservationId: string
  amountCents: number
  status: PayoutStatus
  readyAt: string | null
  requestedAt: string | null
  transferredAt: string | null
  transferReference: string | null
  processedByUserId: string | null
}

let ensured = false

async function ensureTable() {
  if (ensured) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DepositPayout" (
      "id" TEXT PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "garageId" TEXT NOT NULL,
      "reservationId" TEXT NOT NULL,
      "amountCents" INTEGER NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "readyAt" DATETIME,
      "requestedAt" DATETIME,
      "transferredAt" DATETIME,
      "transferReference" TEXT,
      "processedByUserId" TEXT
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "DepositPayout_garageId_idx" ON "DepositPayout" ("garageId")`
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "DepositPayout_status_idx" ON "DepositPayout" ("status")`
  )
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "DepositPayout_reservationId_key" ON "DepositPayout" ("reservationId")`
  )
  ensured = true
}

export async function createDepositPayout(
  garageId: string,
  reservationId: string,
  amountCents: number
): Promise<string> {
  await ensureTable()
  const id = randomUUID()
  await prisma.$executeRawUnsafe(
    `INSERT OR IGNORE INTO "DepositPayout" ("id", "garageId", "reservationId", "amountCents", "status")
     VALUES (?, ?, ?, ?, 'pending')`,
    id, garageId, reservationId, amountCents
  )
  return id
}

export async function getPayoutByReservation(reservationId: string): Promise<DepositPayoutRow | null> {
  await ensureTable()
  const rows = await prisma.$queryRawUnsafe<DepositPayoutRow[]>(
    `SELECT * FROM "DepositPayout" WHERE "reservationId" = ? LIMIT 1`, reservationId
  )
  const row = rows[0]
  if (!row) return null
  return { ...row, amountCents: Number(row.amountCents) }
}

export async function listPayoutsForGarage(
  garageId: string,
  statusFilter?: PayoutStatus
): Promise<DepositPayoutRow[]> {
  await ensureTable()
  if (statusFilter) {
    return prisma.$queryRawUnsafe<DepositPayoutRow[]>(
      `SELECT * FROM "DepositPayout" WHERE "garageId" = ? AND "status" = ? ORDER BY "createdAt" DESC`,
      garageId, statusFilter
    )
  }
  return prisma.$queryRawUnsafe<DepositPayoutRow[]>(
    `SELECT * FROM "DepositPayout" WHERE "garageId" = ? ORDER BY "createdAt" DESC`,
    garageId
  )
}

export async function listPayoutRequests(): Promise<(DepositPayoutRow & { companyName?: string; iban?: string })[]> {
  await ensureTable()
  return prisma.$queryRawUnsafe<(DepositPayoutRow & { companyName?: string; iban?: string })[]>(
    `SELECT dp.*, g."companyName", g."iban"
     FROM "DepositPayout" dp
     JOIN "Garage" g ON g."id" = dp."garageId"
     WHERE dp."status" = 'requested'
     ORDER BY dp."requestedAt" ASC`
  )
}

/**
 * Le garage demande le retrait.
 * Vérifie que le statut est "ready" avant de passer à "requested".
 */
export async function requestPayout(id: string, garageId: string): Promise<boolean> {
  await ensureTable()
  const result = await prisma.$executeRawUnsafe(
    `UPDATE "DepositPayout" SET "status" = 'requested', "requestedAt" = CURRENT_TIMESTAMP
     WHERE "id" = ? AND "garageId" = ? AND "status" = 'ready'`,
    id, garageId
  )
  return (result as unknown as number) > 0
}

/**
 * L'admin confirme le virement bancaire.
 */
export async function confirmTransfer(id: string, adminUserId: string, reference: string): Promise<void> {
  await ensureTable()
  await prisma.$executeRawUnsafe(
    `UPDATE "DepositPayout" SET "status" = 'transferred', "transferredAt" = CURRENT_TIMESTAMP, "processedByUserId" = ?, "transferReference" = ?
     WHERE "id" = ? AND "status" = 'requested'`,
    adminUserId, reference, id
  )
}

/**
 * Annule le payout (remboursement client).
 */
export async function cancelPayout(reservationId: string): Promise<void> {
  await ensureTable()
  await prisma.$executeRawUnsafe(
    `UPDATE "DepositPayout" SET "status" = 'cancelled' WHERE "reservationId" = ? AND "status" IN ('pending', 'ready')`,
    reservationId
  )
}

/**
 * Marque le payout comme prêt (30 min après le RDV).
 * Appelé à la demande lors de la consultation des payouts.
 */
export async function markReadyPayouts(garageId: string): Promise<number> {
  await ensureTable()
  const result = await prisma.$executeRawUnsafe(
    `UPDATE "DepositPayout" SET "status" = 'ready', "readyAt" = CURRENT_TIMESTAMP
     WHERE "garageId" = ? AND "status" = 'pending'
     AND "reservationId" IN (
       SELECT "id" FROM "Reservation"
       WHERE datetime("endAt") <= datetime('now', '-30 minutes')
         AND "status" IN ('confirmed', 'paid')
     )`,
    garageId
  )
  return result as unknown as number
}
