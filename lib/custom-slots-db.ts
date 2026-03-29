import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"

export type CustomSlot = {
  id: string
  createdAt: string
  startAt: string
  endAt: string
  label: string | null
}

let ensured = false

async function ensureTable() {
  if (ensured) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CustomSlot" (
      "id" TEXT PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "startAt" DATETIME NOT NULL,
      "endAt" DATETIME NOT NULL,
      "label" TEXT
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "CustomSlot_startAt_idx" ON "CustomSlot" ("startAt")`
  )
  ensured = true
}

export async function getCustomSlotsForRange(from: Date, to: Date): Promise<CustomSlot[]> {
  await ensureTable()
  return prisma.$queryRawUnsafe<CustomSlot[]>(
    `SELECT * FROM "CustomSlot" WHERE "startAt" < ? AND "endAt" > ? ORDER BY "startAt" ASC`,
    to.toISOString(), from.toISOString()
  )
}

export async function createCustomSlot(startAt: Date, endAt: Date, label?: string): Promise<CustomSlot> {
  await ensureTable()
  const id  = randomUUID()
  const now = new Date().toISOString()
  await prisma.$executeRawUnsafe(
    `INSERT INTO "CustomSlot" ("id","createdAt","startAt","endAt","label") VALUES (?,?,?,?,?)`,
    id, now, startAt.toISOString(), endAt.toISOString(), label ?? null
  )
  return { id, createdAt: now, startAt: startAt.toISOString(), endAt: endAt.toISOString(), label: label ?? null }
}

export async function deleteCustomSlot(id: string): Promise<void> {
  await ensureTable()
  await prisma.$executeRawUnsafe(`DELETE FROM "CustomSlot" WHERE "id" = ?`, id)
}
