import { randomUUID, createHash, randomBytes } from "node:crypto"
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
  /** Si renseigné : code personnel (ex. remerciement testeurs / page Merci), réservé à ce compte uniquement. */
  reservedForUserId: string | null
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
  const reservedCol = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM pragma_table_info('PromoCode') WHERE name = 'reservedForUserId'`
  )
  if (reservedCol.length === 0) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "PromoCode" ADD COLUMN "reservedForUserId" TEXT`)
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "PromoCode_reservedForUserId_key" ON "PromoCode" ("reservedForUserId")`
    )
  }
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
    reservedForUserId: row.reservedForUserId ?? null,
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

/** Liste admin : e-mail du compte pour les codes personnels (ex. PS-MERCI-… / page Merci). */
export type PromoCodeAdminRow = PromoCodeRow & {
  reservedUserEmail: string | null
}

export async function getAllPromoCodesForAdmin(): Promise<PromoCodeAdminRow[]> {
  await ensurePromoTables()
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT p.*, u."email" AS "reservedUserEmail"
     FROM "PromoCode" p
     LEFT JOIN "UserAccount" u ON u."id" = p."reservedForUserId"
     ORDER BY p."createdAt" DESC`
  )
  return rows.map((row) => ({
    ...normalizeRow(row),
    reservedUserEmail: row.reservedUserEmail != null ? String(row.reservedUserEmail) : null,
  }))
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

/** Code promo -30 %, 1 utilisation, lié au compte (page /merci, phase test). */
export async function getOrCreateMerciTesterPromo(userId: string): Promise<PromoCodeRow> {
  await ensurePromoTables()
  const existing = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "PromoCode" WHERE "reservedForUserId" = ? LIMIT 1`,
    userId
  )
  if (existing[0]) return normalizeRow(existing[0])

  for (let i = 0; i < 20; i++) {
    const suffix = randomBytes(5).toString("hex").toUpperCase()
    const code = `PS-MERCI-${suffix}`
    const id = randomUUID()
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "PromoCode" ("id", "code", "discountType", "discountValue", "maxUses", "usedCount", "active", "reservedForUserId")
         VALUES (?, ?, 'percent', 30, 1, 0, 1, ?)`,
        id,
        code,
        userId
      )
      const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "PromoCode" WHERE "id" = ? LIMIT 1`, id)
      return normalizeRow(rows[0])
    } catch {
      // collision rare sur code ou index utilisateur
    }
  }
  throw new Error("Impossible de générer un code promo Merci unique.")
}

export function assertPromoUsableByAccount(
  promo: PromoCodeRow,
  authenticatedUserId: string | undefined
): { ok: true } | { ok: false; error: string } {
  if (!promo.reservedForUserId) return { ok: true }
  if (!authenticatedUserId) {
    return { ok: false, error: "Connectez-vous pour utiliser ce code promo." }
  }
  if (authenticatedUserId !== promo.reservedForUserId) {
    return { ok: false, error: "Ce code promo est personnel et lié à un autre compte." }
  }
  return { ok: true }
}
