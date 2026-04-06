import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"

let ensuredEV = false

async function ensureTable() {
  if (ensuredEV) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PendingEmailVerification" (
      "id"           TEXT PRIMARY KEY,
      "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "email"        TEXT NOT NULL UNIQUE,
      "name"         TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "tokenHash"    TEXT NOT NULL UNIQUE,
      "expiresAt"    DATETIME NOT NULL
    )
  `)
  const locCols = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM pragma_table_info('PendingEmailVerification') WHERE name IN ('postalCode', 'city')`
  )
  const have = new Set(locCols.map((c) => c.name))
  if (!have.has("postalCode")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "PendingEmailVerification" ADD COLUMN "postalCode" TEXT NOT NULL DEFAULT ''`
    )
  }
  if (!have.has("city")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "PendingEmailVerification" ADD COLUMN "city" TEXT NOT NULL DEFAULT ''`
    )
  }
  ensuredEV = true
}

export type PendingVerification = {
  id: string
  email: string
  name: string
  passwordHash: string
  tokenHash: string
  expiresAt: string
  postalCode: string
  city: string
}

/**
 * Crée ou remplace l'entrée pour cet email (utile pour le renvoi d'email).
 * Le renvoi génère un nouveau token et repousse l'expiration.
 */
export async function upsertPendingVerification(input: {
  email: string
  name: string
  passwordHash: string
  tokenHash: string
  expiresAt: Date
  postalCode: string
  city: string
}): Promise<void> {
  await ensureTable()
  await prisma.$executeRawUnsafe(`
    INSERT INTO "PendingEmailVerification"
      ("id", "email", "name", "passwordHash", "tokenHash", "expiresAt", "postalCode", "city")
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT("email") DO UPDATE SET
      "name"         = excluded."name",
      "passwordHash" = excluded."passwordHash",
      "tokenHash"    = excluded."tokenHash",
      "expiresAt"    = excluded."expiresAt",
      "postalCode"   = excluded."postalCode",
      "city"         = excluded."city",
      "createdAt"    = CURRENT_TIMESTAMP
  `,
    randomUUID(),
    input.email,
    input.name,
    input.passwordHash,
    input.tokenHash,
    input.expiresAt.toISOString(),
    input.postalCode,
    input.city
  )
}

/** Trouve une vérification à partir du hash du token, si non expirée. */
export async function findPendingVerificationByTokenHash(
  tokenHash: string
): Promise<PendingVerification | null> {
  await ensureTable()
  const rows = await prisma.$queryRawUnsafe<
    (Omit<PendingVerification, "postalCode" | "city"> & { postalCode: string | null; city: string | null })[]
  >(
    `SELECT "id", "email", "name", "passwordHash", "tokenHash", "expiresAt", "postalCode", "city"
     FROM "PendingEmailVerification"
     WHERE "tokenHash" = ?
     LIMIT 1`,
    tokenHash
  )
  const row = rows[0]
  if (!row) return null
  return {
    ...row,
    postalCode: row.postalCode ?? "",
    city: row.city ?? "",
  }
}

/** Trouve une vérification en attente par email (pour le renvoi). */
export async function findPendingVerificationByEmail(
  email: string
): Promise<PendingVerification | null> {
  await ensureTable()
  const rows = await prisma.$queryRawUnsafe<
    (Omit<PendingVerification, "postalCode" | "city"> & { postalCode: string | null; city: string | null })[]
  >(
    `SELECT "id", "email", "name", "passwordHash", "tokenHash", "expiresAt", "postalCode", "city"
     FROM "PendingEmailVerification"
     WHERE "email" = ?
     LIMIT 1`,
    email
  )
  const row = rows[0]
  if (!row) return null
  return {
    ...row,
    postalCode: row.postalCode ?? "",
    city: row.city ?? "",
  }
}

/** Supprime la vérification en attente une fois consommée. */
export async function deletePendingVerification(email: string): Promise<void> {
  await ensureTable()
  await prisma.$executeRawUnsafe(
    `DELETE FROM "PendingEmailVerification" WHERE "email" = ?`,
    email
  )
}
