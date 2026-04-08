import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"

export type GarageEmployeeStatus = "invited" | "active" | "removed"

export type GarageEmployeeRow = {
  id: string
  createdAt: string
  garageId: string
  email: string
  userId: string | null
  invitedByUserId: string
  status: GarageEmployeeStatus
}

let ensured = false

async function ensureTable() {
  if (ensured) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "GarageEmployee" (
      "id" TEXT PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "garageId" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "userId" TEXT,
      "invitedByUserId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'invited'
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "GarageEmployee_garageId_email_key" ON "GarageEmployee" ("garageId", "email")`
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "GarageEmployee_email_idx" ON "GarageEmployee" ("email")`
  )
  ensured = true
}

export async function inviteEmployee(garageId: string, email: string, invitedByUserId: string): Promise<void> {
  await ensureTable()
  const existing = await prisma.$queryRawUnsafe<GarageEmployeeRow[]>(
    `SELECT * FROM "GarageEmployee" WHERE "garageId" = ? AND lower("email") = lower(?) LIMIT 1`,
    garageId, email
  )
  if (existing.length > 0) {
    if (existing[0].status === "removed") {
      await prisma.$executeRawUnsafe(
        `UPDATE "GarageEmployee" SET "status" = 'invited', "userId" = NULL, "invitedByUserId" = ? WHERE "id" = ?`,
        invitedByUserId, existing[0].id
      )
    }
    return // already invited or active
  }
  await prisma.$executeRawUnsafe(
    `INSERT INTO "GarageEmployee" ("id", "garageId", "email", "invitedByUserId", "status") VALUES (?, ?, ?, ?, 'invited')`,
    randomUUID(), garageId, email.toLowerCase().trim(), invitedByUserId
  )
}

export async function findInvitationByEmail(email: string): Promise<(GarageEmployeeRow & { garageCode?: string }) | null> {
  await ensureTable()
  const rows = await prisma.$queryRawUnsafe<(GarageEmployeeRow & { garageCode?: string })[]>(
    `SELECT ge.*, g."garageCode" FROM "GarageEmployee" ge
     JOIN "Garage" g ON g."id" = ge."garageId"
     WHERE lower(ge."email") = lower(?) AND ge."status" = 'invited' LIMIT 1`,
    email
  )
  return rows[0] ?? null
}

export async function findInvitationByEmailAndCode(email: string, garageCode: string): Promise<GarageEmployeeRow | null> {
  await ensureTable()
  const rows = await prisma.$queryRawUnsafe<GarageEmployeeRow[]>(
    `SELECT ge.* FROM "GarageEmployee" ge
     JOIN "Garage" g ON g."id" = ge."garageId"
     WHERE lower(ge."email") = lower(?) AND g."garageCode" = ? AND ge."status" = 'invited' LIMIT 1`,
    email, garageCode.toUpperCase()
  )
  return rows[0] ?? null
}

export async function activateEmployee(garageId: string, email: string, userId: string): Promise<void> {
  await ensureTable()
  await prisma.$executeRawUnsafe(
    `UPDATE "GarageEmployee" SET "status" = 'active', "userId" = ? WHERE "garageId" = ? AND lower("email") = lower(?) AND "status" = 'invited'`,
    userId, garageId, email
  )
}

export async function listEmployees(garageId: string): Promise<GarageEmployeeRow[]> {
  await ensureTable()
  return prisma.$queryRawUnsafe<GarageEmployeeRow[]>(
    `SELECT * FROM "GarageEmployee" WHERE "garageId" = ? AND "status" != 'removed' ORDER BY "createdAt" ASC`,
    garageId
  )
}

export async function removeEmployee(id: string): Promise<void> {
  await ensureTable()
  await prisma.$executeRawUnsafe(
    `UPDATE "GarageEmployee" SET "status" = 'removed', "userId" = NULL WHERE "id" = ?`, id
  )
}
