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
  ensuredEV = true
}

export type PendingVerification = {
  id: string
  email: string
  name: string
  passwordHash: string
  tokenHash: string
  expiresAt: string
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
}): Promise<void> {
  await ensureTable()
  // INSERT OR REPLACE gère l'unicité sur email ET tokenHash (SQLite)
  await prisma.$executeRawUnsafe(`
    INSERT INTO "PendingEmailVerification"
      ("id", "email", "name", "passwordHash", "tokenHash", "expiresAt")
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT("email") DO UPDATE SET
      "name"         = excluded."name",
      "passwordHash" = excluded."passwordHash",
      "tokenHash"    = excluded."tokenHash",
      "expiresAt"    = excluded."expiresAt",
      "createdAt"    = CURRENT_TIMESTAMP
  `,
    randomUUID(),
    input.email,
    input.name,
    input.passwordHash,
    input.tokenHash,
    input.expiresAt.toISOString()
  )
}

/** Trouve une vérification à partir du hash du token, si non expirée. */
export async function findPendingVerificationByTokenHash(
  tokenHash: string
): Promise<PendingVerification | null> {
  await ensureTable()
  const rows = await prisma.$queryRawUnsafe<PendingVerification[]>(
    `SELECT "id", "email", "name", "passwordHash", "tokenHash", "expiresAt"
     FROM "PendingEmailVerification"
     WHERE "tokenHash" = ?
     LIMIT 1`,
    tokenHash
  )
  return rows[0] ?? null
}

/** Trouve une vérification en attente par email (pour le renvoi). */
export async function findPendingVerificationByEmail(
  email: string
): Promise<PendingVerification | null> {
  await ensureTable()
  const rows = await prisma.$queryRawUnsafe<PendingVerification[]>(
    `SELECT "id", "email", "name", "passwordHash", "tokenHash", "expiresAt"
     FROM "PendingEmailVerification"
     WHERE "email" = ?
     LIMIT 1`,
    email
  )
  return rows[0] ?? null
}

/** Supprime la vérification en attente une fois consommée. */
export async function deletePendingVerification(email: string): Promise<void> {
  await ensureTable()
  await prisma.$executeRawUnsafe(
    `DELETE FROM "PendingEmailVerification" WHERE "email" = ?`,
    email
  )
}
