import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"

export type GarageBlockedSlotRow = {
  id: string
  createdAt: string
  garageId: string
  startAt: string
  endAt: string
  label: string | null
  createdByUserId: string
}

let ensured = false

async function ensureTable() {
  if (ensured) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "GarageBlockedSlot" (
      "id" TEXT PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "garageId" TEXT NOT NULL,
      "startAt" DATETIME NOT NULL,
      "endAt" DATETIME NOT NULL,
      "label" TEXT,
      "createdByUserId" TEXT NOT NULL
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "GarageBlockedSlot_garageId_startAt_idx" ON "GarageBlockedSlot" ("garageId", "startAt")`
  )
  ensured = true
}

export async function createGarageBlockedSlot(
  garageId: string,
  startAt: Date,
  endAt: Date,
  label: string | null,
  createdByUserId: string
): Promise<GarageBlockedSlotRow> {
  await ensureTable()
  const id = randomUUID()
  await prisma.$executeRawUnsafe(
    `INSERT INTO "GarageBlockedSlot" ("id", "garageId", "startAt", "endAt", "label", "createdByUserId") VALUES (?, ?, ?, ?, ?, ?)`,
    id, garageId, startAt.toISOString(), endAt.toISOString(), label, createdByUserId
  )
  return { id, createdAt: new Date().toISOString(), garageId, startAt: startAt.toISOString(), endAt: endAt.toISOString(), label, createdByUserId }
}

export async function deleteGarageBlockedSlot(id: string): Promise<void> {
  await ensureTable()
  await prisma.$executeRawUnsafe(`DELETE FROM "GarageBlockedSlot" WHERE "id" = ?`, id)
}

export async function getGarageBlockedSlotsForRange(
  garageId: string,
  from: Date,
  to: Date
): Promise<GarageBlockedSlotRow[]> {
  await ensureTable()
  return prisma.$queryRawUnsafe<GarageBlockedSlotRow[]>(
    `SELECT * FROM "GarageBlockedSlot"
     WHERE "garageId" = ? AND "startAt" < ? AND "endAt" > ?
     ORDER BY "startAt" ASC`,
    garageId, to.toISOString(), from.toISOString()
  )
}
