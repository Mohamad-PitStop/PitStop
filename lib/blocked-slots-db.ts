import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"

export type BlockedSlot = {
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
    CREATE TABLE IF NOT EXISTS "BlockedSlot" (
      "id" TEXT PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "startAt" DATETIME NOT NULL,
      "endAt" DATETIME NOT NULL,
      "label" TEXT
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "BlockedSlot_startAt_idx" ON "BlockedSlot" ("startAt")
  `)
  ensured = true
}

export async function getBlockedSlotsForRange(from: Date, to: Date): Promise<BlockedSlot[]> {
  await ensureTable()
  const rows = await prisma.$queryRawUnsafe<BlockedSlot[]>(
    `SELECT * FROM "BlockedSlot" WHERE "startAt" < ? AND "endAt" > ? ORDER BY "startAt" ASC`,
    to.toISOString(),
    from.toISOString()
  )
  return rows
}

export async function createBlockedSlot(startAt: Date, endAt: Date, label?: string): Promise<BlockedSlot> {
  await ensureTable()
  const id = randomUUID()
  const now = new Date().toISOString()
  await prisma.$executeRawUnsafe(
    `INSERT INTO "BlockedSlot" ("id", "createdAt", "startAt", "endAt", "label") VALUES (?, ?, ?, ?, ?)`,
    id, now, startAt.toISOString(), endAt.toISOString(), label ?? null
  )
  return { id, createdAt: now, startAt: startAt.toISOString(), endAt: endAt.toISOString(), label: label ?? null }
}

export async function deleteBlockedSlot(id: string): Promise<void> {
  await ensureTable()
  await prisma.$executeRawUnsafe(`DELETE FROM "BlockedSlot" WHERE "id" = ?`, id)
}
