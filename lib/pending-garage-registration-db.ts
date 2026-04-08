import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"

/**
 * Stocke les données d'inscription garage en attente de vérification email.
 * Liée par email à PendingEmailVerification.
 * Pour les propriétaires : contient toutes les données entreprise.
 * Pour les employés : contient le garageId cible.
 */

export type PendingGarageRegistrationRow = {
  id: string
  email: string
  type: "owner" | "employee" // owner = nouveau garage, employee = rejoindre un garage
  garageData: string | null // JSON pour owner (company info, specialties, hours)
  garageId: string | null // Pour les employés : ID du garage à rejoindre
}

let ensured = false

async function ensureTable() {
  if (ensured) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PendingGarageRegistration" (
      "id" TEXT PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "email" TEXT NOT NULL UNIQUE,
      "type" TEXT NOT NULL DEFAULT 'owner',
      "garageData" TEXT,
      "garageId" TEXT
    )
  `)
  ensured = true
}

export async function upsertPendingGarageRegistration(input: {
  email: string
  type: "owner" | "employee"
  garageData?: Record<string, unknown> | null
  garageId?: string | null
}): Promise<void> {
  await ensureTable()
  await prisma.$executeRawUnsafe(
    `INSERT INTO "PendingGarageRegistration" ("id", "email", "type", "garageData", "garageId")
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT("email") DO UPDATE SET
       "type" = excluded."type",
       "garageData" = excluded."garageData",
       "garageId" = excluded."garageId",
       "createdAt" = CURRENT_TIMESTAMP`,
    randomUUID(),
    input.email,
    input.type,
    input.garageData ? JSON.stringify(input.garageData) : null,
    input.garageId ?? null
  )
}

export async function findPendingGarageRegistration(
  email: string
): Promise<PendingGarageRegistrationRow | null> {
  await ensureTable()
  const rows = await prisma.$queryRawUnsafe<PendingGarageRegistrationRow[]>(
    `SELECT "id", "email", "type", "garageData", "garageId" FROM "PendingGarageRegistration" WHERE "email" = ? LIMIT 1`,
    email
  )
  return rows[0] ?? null
}

export async function deletePendingGarageRegistration(email: string): Promise<void> {
  await ensureTable()
  await prisma.$executeRawUnsafe(
    `DELETE FROM "PendingGarageRegistration" WHERE "email" = ?`, email
  )
}
