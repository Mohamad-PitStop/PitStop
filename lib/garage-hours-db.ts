import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"

export type HoursChangeStatus = "pending" | "approved" | "rejected"

export type GarageHoursChangeRequestRow = {
  id: string
  createdAt: string
  garageId: string
  requestedByUserId: string
  currentHours: string // JSON
  proposedHours: string // JSON
  status: HoursChangeStatus
  adminNote: string | null
  processedAt: string | null
  processedByUserId: string | null
}

let ensured = false

async function ensureTable() {
  if (ensured) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "GarageHoursChangeRequest" (
      "id" TEXT PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "garageId" TEXT NOT NULL,
      "requestedByUserId" TEXT NOT NULL,
      "currentHours" TEXT NOT NULL,
      "proposedHours" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "adminNote" TEXT,
      "processedAt" DATETIME,
      "processedByUserId" TEXT
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "GarageHoursChangeRequest_garageId_idx" ON "GarageHoursChangeRequest" ("garageId")`
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "GarageHoursChangeRequest_status_idx" ON "GarageHoursChangeRequest" ("status")`
  )
  ensured = true
}

export async function requestHoursChange(
  garageId: string,
  requestedByUserId: string,
  currentHours: string,
  proposedHours: string
): Promise<string> {
  await ensureTable()
  const id = randomUUID()
  await prisma.$executeRawUnsafe(
    `INSERT INTO "GarageHoursChangeRequest" ("id", "garageId", "requestedByUserId", "currentHours", "proposedHours", "status")
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    id, garageId, requestedByUserId, currentHours, proposedHours
  )
  return id
}

export async function listPendingHoursRequests(): Promise<GarageHoursChangeRequestRow[]> {
  await ensureTable()
  return prisma.$queryRawUnsafe<GarageHoursChangeRequestRow[]>(
    `SELECT hr.*, g."companyName" as "garageCompanyName" FROM "GarageHoursChangeRequest" hr
     LEFT JOIN "Garage" g ON g."id" = hr."garageId"
     WHERE hr."status" = 'pending' ORDER BY hr."createdAt" ASC`
  )
}

export async function listHoursRequestsForGarage(garageId: string): Promise<GarageHoursChangeRequestRow[]> {
  await ensureTable()
  return prisma.$queryRawUnsafe<GarageHoursChangeRequestRow[]>(
    `SELECT * FROM "GarageHoursChangeRequest" WHERE "garageId" = ? ORDER BY "createdAt" DESC LIMIT 20`,
    garageId
  )
}

export async function approveHoursChange(requestId: string, adminUserId: string): Promise<void> {
  await ensureTable()
  // Get the request to apply the proposed hours
  const rows = await prisma.$queryRawUnsafe<GarageHoursChangeRequestRow[]>(
    `SELECT * FROM "GarageHoursChangeRequest" WHERE "id" = ? AND "status" = 'pending' LIMIT 1`,
    requestId
  )
  const req = rows[0]
  if (!req) throw new Error("Request not found or already processed")

  // Update garage hours
  await prisma.$executeRawUnsafe(
    `UPDATE "Garage" SET "businessHours" = ? WHERE "id" = ?`,
    req.proposedHours, req.garageId
  )
  // Mark request as approved
  await prisma.$executeRawUnsafe(
    `UPDATE "GarageHoursChangeRequest" SET "status" = 'approved', "processedAt" = CURRENT_TIMESTAMP, "processedByUserId" = ? WHERE "id" = ?`,
    adminUserId, requestId
  )
}

export async function rejectHoursChange(requestId: string, adminUserId: string, note: string | null): Promise<void> {
  await ensureTable()
  await prisma.$executeRawUnsafe(
    `UPDATE "GarageHoursChangeRequest" SET "status" = 'rejected', "processedAt" = CURRENT_TIMESTAMP, "processedByUserId" = ?, "adminNote" = ? WHERE "id" = ?`,
    adminUserId, note, requestId
  )
}
