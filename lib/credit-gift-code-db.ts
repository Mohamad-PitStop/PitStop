import { randomUUID, createHash } from "node:crypto"
import { prisma } from "@/lib/prisma"

let ensured = false

async function ensureTables() {
  if (ensured) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CreditGiftCode" (
      "id" TEXT PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "code" TEXT NOT NULL UNIQUE,
      "credits" INTEGER NOT NULL,
      "maxUses" INTEGER,
      "usedCount" INTEGER NOT NULL DEFAULT 0,
      "active" INTEGER NOT NULL DEFAULT 1,
      "label" TEXT
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CreditGiftRedemption" (
      "id" TEXT PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "giftCodeId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "creditsGranted" INTEGER NOT NULL,
      "ipHash" TEXT NOT NULL,
      UNIQUE("giftCodeId", "userId")
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "CreditGiftRedemption_userId_idx" ON "CreditGiftRedemption" ("userId")`
  )
  ensured = true
}

function hashIp(ip: string): string {
  return createHash("sha256").update(`pitstop-gift:${ip}`).digest("hex")
}

export type CreditGiftCodeRow = {
  id: string
  code: string
  credits: number
  maxUses: number | null
  usedCount: number
  active: boolean
  createdAt: string
  label: string | null
}

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase()
}

export async function findGiftCodeByNormalizedCode(normalized: string): Promise<CreditGiftCodeRow | null> {
  await ensureTables()
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string
      code: string
      credits: number
      maxUses: number | null
      usedCount: number
      active: number
      createdAt: string
      label: string | null
    }>
  >(`SELECT * FROM "CreditGiftCode" WHERE "code" = ? LIMIT 1`, normalized)
  const r = rows[0]
  if (!r) return null
  return {
    id: r.id,
    code: r.code,
    credits: Number(r.credits),
    maxUses: r.maxUses != null ? Number(r.maxUses) : null,
    usedCount: Number(r.usedCount),
    active: Number(r.active) === 1,
    createdAt: r.createdAt,
    label: r.label ?? null,
  }
}

export async function hasUserRedeemedGiftCode(giftCodeId: string, userId: string): Promise<boolean> {
  await ensureTables()
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT "id" FROM "CreditGiftRedemption" WHERE "giftCodeId" = ? AND "userId" = ? LIMIT 1`,
    giftCodeId,
    userId
  )
  return rows.length > 0
}

export async function createGiftCode(input: {
  code: string
  credits: number
  maxUses?: number | null
  label?: string | null
}): Promise<CreditGiftCodeRow> {
  await ensureTables()
  const normalized = normalizeCode(input.code)
  if (normalized.length < 4 || normalized.length > 40) {
    throw new Error("Code invalide.")
  }
  const id = randomUUID()
  await prisma.$executeRawUnsafe(
    `INSERT INTO "CreditGiftCode" ("id", "code", "credits", "maxUses", "label") VALUES (?, ?, ?, ?, ?)`,
    id,
    normalized,
    input.credits,
    input.maxUses ?? null,
    input.label?.trim() || null
  )
  const row = await findGiftCodeByNormalizedCode(normalized)
  if (!row) throw new Error("Insertion échouée.")
  return row
}

export async function listGiftCodes(): Promise<CreditGiftCodeRow[]> {
  await ensureTables()
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string
      code: string
      credits: number
      maxUses: number | null
      usedCount: number
      active: number
      createdAt: string
      label: string | null
    }>
  >(`SELECT * FROM "CreditGiftCode" ORDER BY "createdAt" DESC`)
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    credits: Number(r.credits),
    maxUses: r.maxUses != null ? Number(r.maxUses) : null,
    usedCount: Number(r.usedCount),
    active: Number(r.active) === 1,
    createdAt: r.createdAt,
    label: r.label ?? null,
  }))
}

export async function setGiftCodeActive(id: string, active: boolean): Promise<void> {
  await ensureTables()
  await prisma.$executeRawUnsafe(`UPDATE "CreditGiftCode" SET "active" = ? WHERE "id" = ?`, active ? 1 : 0, id)
}

/**
 * Attribue les crédits et enregistre l’utilisation en une transaction SQLite.
 * Appeler seulement après validations métier (code actif, plafond, pas déjà utilisé).
 */
export async function redeemGiftCodeForUser(opts: {
  giftCodeId: string
  userId: string
  credits: number
  ip: string
}): Promise<void> {
  await ensureTables()
  const id = randomUUID()
  const ipH = hashIp(opts.ip)
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `INSERT INTO "CreditGiftRedemption" ("id", "giftCodeId", "userId", "creditsGranted", "ipHash") VALUES (?, ?, ?, ?, ?)`,
      id,
      opts.giftCodeId,
      opts.userId,
      opts.credits,
      ipH
    )
    await tx.$executeRawUnsafe(
      `UPDATE "CreditGiftCode" SET "usedCount" = "usedCount" + 1 WHERE "id" = ?`,
      opts.giftCodeId
    )
    await tx.$executeRawUnsafe(
      `UPDATE "UserAccount" SET "diagnosticCredits" = "diagnosticCredits" + ? WHERE "id" = ?`,
      opts.credits,
      opts.userId
    )
  })
}
