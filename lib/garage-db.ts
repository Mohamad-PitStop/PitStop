import { randomUUID, randomBytes } from "node:crypto"
import { prisma } from "@/lib/prisma"

// ── Types ────────────────────────────────────────────────────────────────────

export type GarageStatus = "pending" | "approved" | "suspended"

export type BusinessHoursDay = { start: string; end: string }[]

export type BusinessHours = {
  mon: BusinessHoursDay
  tue: BusinessHoursDay
  wed: BusinessHoursDay
  thu: BusinessHoursDay
  fri: BusinessHoursDay
  sat: BusinessHoursDay
  sun: BusinessHoursDay
}

export type GarageRow = {
  id: string
  createdAt: string
  garageCode: string
  companyName: string
  bceTvaNumber: string
  street: string
  postalCode: string
  city: string
  country: string
  iban: string
  professionalPhone: string
  professionalEmail: string
  managerName: string
  managerUserId: string | null
  specialties: string // JSON array
  businessHours: string // JSON
  status: GarageStatus
  approvedAt: string | null
  suspendedAt: string | null
  suspendedReason: string | null
}

// ── Table creation ───────────────────────────────────────────────────────────

let ensured = false

export async function ensureGarageTables() {
  if (ensured) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Garage" (
      "id" TEXT PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "garageCode" TEXT NOT NULL UNIQUE,
      "companyName" TEXT NOT NULL,
      "bceTvaNumber" TEXT NOT NULL,
      "street" TEXT NOT NULL,
      "postalCode" TEXT NOT NULL,
      "city" TEXT NOT NULL,
      "country" TEXT NOT NULL DEFAULT 'BE',
      "iban" TEXT NOT NULL,
      "professionalPhone" TEXT NOT NULL,
      "professionalEmail" TEXT NOT NULL,
      "managerName" TEXT NOT NULL,
      "managerUserId" TEXT,
      "specialties" TEXT NOT NULL DEFAULT '[]',
      "businessHours" TEXT NOT NULL DEFAULT '{}',
      "status" TEXT NOT NULL DEFAULT 'pending',
      "approvedAt" DATETIME,
      "suspendedAt" DATETIME,
      "suspendedReason" TEXT
    )
  `)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Garage_status_idx" ON "Garage" ("status")`)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Garage_postalCode_idx" ON "Garage" ("postalCode")`)

  // Migration : colonne garageId sur Reservation (Prisma-managed table)
  const resCols = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM pragma_table_info('Reservation') WHERE name = 'garageId'`
  )
  if (resCols.length === 0) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Reservation" ADD COLUMN "garageId" TEXT`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Reservation_garageId_startAt_idx" ON "Reservation" ("garageId", "startAt")`)
  }

  ensured = true
}

// ── Garage code generation ───────────────────────────────────────────────────

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const CODE_LENGTH = 8

export function generateGarageCode(): string {
  // Use rejection sampling to avoid modulo bias with cryptographically secure bytes
  const charCount = CODE_CHARS.length
  const maxUnbiased = 256 - (256 % charCount)
  let code = ""
  while (code.length < CODE_LENGTH) {
    const bytes = randomBytes((CODE_LENGTH - code.length) * 2)
    for (const byte of bytes) {
      if (byte < maxUnbiased && code.length < CODE_LENGTH) {
        code += CODE_CHARS[byte % charCount]
      }
    }
  }
  return code
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export async function createGarage(input: {
  companyName: string
  bceTvaNumber: string
  street: string
  postalCode: string
  city: string
  country?: string
  iban: string
  professionalPhone: string
  professionalEmail: string
  managerName: string
  managerUserId: string
  specialties: string[]
  businessHours: BusinessHours
}): Promise<GarageRow> {
  await ensureGarageTables()
  const id = randomUUID()
  const garageCode = generateGarageCode()
  const country = input.country ?? "BE"
  const specialtiesJson = JSON.stringify(input.specialties)
  const hoursJson = JSON.stringify(input.businessHours)

  await prisma.$executeRawUnsafe(
    `INSERT INTO "Garage" ("id", "garageCode", "companyName", "bceTvaNumber", "street", "postalCode", "city", "country", "iban", "professionalPhone", "professionalEmail", "managerName", "managerUserId", "specialties", "businessHours", "status")
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    id, garageCode,
    input.companyName, input.bceTvaNumber,
    input.street, input.postalCode, input.city, country,
    input.iban, input.professionalPhone, input.professionalEmail,
    input.managerName, input.managerUserId,
    specialtiesJson, hoursJson
  )

  return (await findGarageById(id))!
}

export async function findGarageById(id: string): Promise<GarageRow | null> {
  await ensureGarageTables()
  const rows = await prisma.$queryRawUnsafe<GarageRow[]>(
    `SELECT * FROM "Garage" WHERE "id" = ? LIMIT 1`, id
  )
  return rows[0] ?? null
}

export async function findGarageByCode(code: string): Promise<GarageRow | null> {
  await ensureGarageTables()
  const rows = await prisma.$queryRawUnsafe<GarageRow[]>(
    `SELECT * FROM "Garage" WHERE "garageCode" = ? LIMIT 1`, code.toUpperCase()
  )
  return rows[0] ?? null
}

export async function findGarageByManagerUserId(userId: string): Promise<GarageRow | null> {
  await ensureGarageTables()
  const rows = await prisma.$queryRawUnsafe<GarageRow[]>(
    `SELECT * FROM "Garage" WHERE "managerUserId" = ? LIMIT 1`, userId
  )
  return rows[0] ?? null
}

export async function listApprovedGarages(): Promise<GarageRow[]> {
  await ensureGarageTables()
  return prisma.$queryRawUnsafe<GarageRow[]>(
    `SELECT * FROM "Garage" WHERE "status" = 'approved' ORDER BY "companyName" ASC`
  )
}

export async function listAllGarages(): Promise<GarageRow[]> {
  await ensureGarageTables()
  return prisma.$queryRawUnsafe<GarageRow[]>(
    `SELECT * FROM "Garage" ORDER BY "createdAt" DESC`
  )
}

export async function updateGarageStatus(id: string, status: GarageStatus, reason?: string): Promise<void> {
  await ensureGarageTables()
  if (status === "approved") {
    await prisma.$executeRawUnsafe(
      `UPDATE "Garage" SET "status" = 'approved', "approvedAt" = CURRENT_TIMESTAMP WHERE "id" = ?`, id
    )
  } else if (status === "suspended") {
    await prisma.$executeRawUnsafe(
      `UPDATE "Garage" SET "status" = 'suspended', "suspendedAt" = CURRENT_TIMESTAMP, "suspendedReason" = ? WHERE "id" = ?`,
      reason ?? null, id
    )
  } else {
    await prisma.$executeRawUnsafe(
      `UPDATE "Garage" SET "status" = ? WHERE "id" = ?`, status, id
    )
  }
}

export async function updateGarageBusinessHours(id: string, hours: BusinessHours): Promise<void> {
  await ensureGarageTables()
  await prisma.$executeRawUnsafe(
    `UPDATE "Garage" SET "businessHours" = ? WHERE "id" = ?`,
    JSON.stringify(hours), id
  )
}
