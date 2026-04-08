import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"

export type GarageClosureRow = {
  id: string
  createdAt: string
  garageId: string
  date: string // YYYY-MM-DD
  reason: string | null
  createdByUserId: string
}

let ensured = false

async function ensureTable() {
  if (ensured) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "GarageClosure" (
      "id" TEXT PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "garageId" TEXT NOT NULL,
      "date" TEXT NOT NULL,
      "reason" TEXT,
      "createdByUserId" TEXT NOT NULL
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "GarageClosure_garageId_date_idx" ON "GarageClosure" ("garageId", "date")`
  )
  ensured = true
}

export async function createClosure(
  garageId: string,
  date: string,
  reason: string | null,
  createdByUserId: string
): Promise<GarageClosureRow> {
  await ensureTable()
  const id = randomUUID()
  await prisma.$executeRawUnsafe(
    `INSERT INTO "GarageClosure" ("id", "garageId", "date", "reason", "createdByUserId") VALUES (?, ?, ?, ?, ?)`,
    id, garageId, date, reason, createdByUserId
  )
  return { id, createdAt: new Date().toISOString(), garageId, date, reason, createdByUserId }
}

export async function deleteClosure(id: string): Promise<void> {
  await ensureTable()
  await prisma.$executeRawUnsafe(`DELETE FROM "GarageClosure" WHERE "id" = ?`, id)
}

export async function getClosuresForRange(
  garageId: string,
  fromDate: string,
  toDate: string
): Promise<GarageClosureRow[]> {
  await ensureTable()
  return prisma.$queryRawUnsafe<GarageClosureRow[]>(
    `SELECT * FROM "GarageClosure" WHERE "garageId" = ? AND "date" >= ? AND "date" <= ? ORDER BY "date" ASC`,
    garageId, fromDate, toDate
  )
}

export async function listClosures(garageId: string): Promise<GarageClosureRow[]> {
  await ensureTable()
  return prisma.$queryRawUnsafe<GarageClosureRow[]>(
    `SELECT * FROM "GarageClosure" WHERE "garageId" = ? ORDER BY "date" DESC`,
    garageId
  )
}
