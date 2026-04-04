import { randomUUID, createHash } from "node:crypto"
import { prisma } from "@/lib/prisma"

export type DiscountType = "percent" | "fixed_cents"

export type PromoCodeRow = {
  id: string
  code: string
  discountType: DiscountType
  discountValue: number
  maxUses: number | null
  usedCount: number
  active: boolean
  createdAt: string
}

const PROMO_ABUSE_WINDOW_DAYS = 60

let ensured = false

async function ensurePromoTables() {
  if (ensured) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PromoCode" (
      "id" TEXT PRIMARY KEY,
      "code" TEXT NOT NULL UNIQUE,
      "discountType" TEXT NOT NULL,
      "discountValue" INTEGER NOT NULL,
      "maxUses" INTEGER,
      "usedCount" INTEGER NOT NULL DEFAULT 0,
      "active" INTEGER NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PromoCodeUsage" (
      "id" TEXT PRIMARY KEY,
      "promoCodeId" TEXT NOT NULL,
      "ipHash" TEXT NOT NULL,
      "userId" TEXT,
      "context" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "PromoCodeUsage_promoCodeId_idx" ON "PromoCodeUsage" ("promoCodeId")`
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "PromoCodeUsage_ipHash_idx" ON "PromoCodeUsage" ("ipHash")`
  )
  ensured = true
}

function hashIp(ip: string): string {
  return createHash("sha256").update(`pitstop-promo:${ip}`).digest("hex")
}

function normalizeRow(row: any): PromoCodeRow {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discountType as DiscountType,
    discountValue: Number(row.discountValue),
    maxUses: row.maxUses != null ? Number(row.maxUses) : null,
    usedCount: Number(row.usedCount),
    active: Number(row.active) === 1,
    createdAt: row.createdAt,
  }
}

export async function createPromoCode(input: {
  code: string
  discountType: DiscountType
  discountValue: number
  maxUses?: number | null
}): Promise<PromoCodeRow> {
  await ensurePromoTables()
  const id = randomUUID()
  await prisma.$executeRawUnsafe(
    `INSERT INTO "PromoCode" ("id", "code", "discountType", "discountValue", "maxUses") VALUES (?, upper(?), ?, ?, ?)`,
    id, input.code, input.discountType, input.discountValue, input.maxUses ?? null
  )
  const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "PromoCode" WHERE "id" = ? LIMIT 1`, id)
  return normalizeRow(rows[0])
}

export async function findPromoCodeByCode(code: string): Promise<PromoCodeRow | null> {
  await ensurePromoTables()
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "PromoCode" WHERE upper("code") = upper(?) LIMIT 1`, code
  )
  if (!rows[0]) return null
  return normalizeRow(rows[0])
}

export async function getAllPromoCodes(): Promise<PromoCodeRow[]> {
  await ensurePromoTables()
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "PromoCode" ORDER BY "createdAt" DESC`
  )
  return rows.map(normalizeRow)
}

export async function setPromoCodeActive(id: string, active: boolean): Promise<void> {
  await ensurePromoTables()
  await prisma.$executeRawUnsafe(
    `UPDATE "PromoCode" SET "active" = ? WHERE "id" = ?`,
    active ? 1 : 0, id
  )
}

export async function hasIpUsedPromo(promoCodeId: string, ip: string): Promise<boolean> {
  await ensurePromoTables()
  const ipHash = hashIp(ip)
  const since = new Date(Date.now() - PROMO_ABUSE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT "id" FROM "PromoCodeUsage" WHERE "promoCodeId" = ? AND "ipHash" = ? AND "createdAt" >= ? LIMIT 1`,
    promoCodeId, ipHash, since
  )
  return rows.length > 0
}

export async function hasUserUsedPromo(promoCodeId: string, userId: string): Promise<boolean> {
  await ensurePromoTables()
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT "id" FROM "PromoCodeUsage" WHERE "promoCodeId" = ? AND "userId" = ? LIMIT 1`,
    promoCodeId, userId
  )
  return rows.length > 0
}

export async function recordPromoUsage(opts: {
  promoCodeId: string
  ip: string
  userId?: string | null
  context: string
}): Promise<void> {
  await ensurePromoTables()
  await prisma.$executeRawUnsafe(
    `INSERT INTO "PromoCodeUsage" ("id", "promoCodeId", "ipHash", "userId", "context") VALUES (?, ?, ?, ?, ?)`,
    randomUUID(), opts.promoCodeId, hashIp(opts.ip), opts.userId ?? null, opts.context
  )
  await prisma.$executeRawUnsafe(
    `UPDATE "PromoCode" SET "usedCount" = "usedCount" + 1 WHERE "id" = ?`,
    opts.promoCodeId
  )
}

export function applyPromoDiscount(amountCents: number, promo: PromoCodeRow): number {
  if (promo.discountType === "percent") {
    return Math.max(50, Math.round(amountCents * (1 - promo.discountValue / 100)))
  }
  return Math.max(50, amountCents - promo.discountValue)
}

export function formatDiscount(promo: PromoCodeRow): string {
  if (promo.discountType === "percent") return `-${promo.discountValue}%`
  const euros = (promo.discountValue / 100).toFixed(2).replace(".", ",")
  return `-${euros} €`
}
