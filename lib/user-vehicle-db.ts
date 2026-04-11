import { prisma } from "@/lib/prisma"

export type UserVehicleRow = {
  id: string
  createdAt: string
  userId: string
  nickname: string | null
  marque: string
  modele: string
  variante: string | null
  carburant: string | null
  transmission: string | null
  annee: string | null
  kilometrage: string | null
}

let tableEnsured = false

export async function ensureUserVehicleTable() {
  if (tableEnsured) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserVehicle" (
      "id"           TEXT NOT NULL PRIMARY KEY,
      "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "userId"       TEXT NOT NULL,
      "nickname"     TEXT,
      "marque"       TEXT NOT NULL,
      "modele"       TEXT NOT NULL,
      "variante"     TEXT,
      "carburant"    TEXT,
      "transmission" TEXT,
      "annee"        TEXT,
      "kilometrage"  TEXT
    )
  `)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UserVehicle_userId_idx" ON "UserVehicle"("userId")`)
  tableEnsured = true
}

export async function getUserVehicles(userId: string): Promise<UserVehicleRow[]> {
  await ensureUserVehicleTable()
  const rows = await prisma.$queryRawUnsafe<UserVehicleRow[]>(
    `SELECT * FROM "UserVehicle" WHERE "userId" = ? ORDER BY "createdAt" ASC LIMIT 3`,
    userId
  )
  return rows
}

export async function countUserVehicles(userId: string): Promise<number> {
  await ensureUserVehicleTable()
  const rows = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
    `SELECT COUNT(*) as count FROM "UserVehicle" WHERE "userId" = ?`,
    userId
  )
  return Number(rows[0]?.count ?? 0)
}

export async function createUserVehicle(
  userId: string,
  data: {
    nickname?: string
    marque: string
    modele: string
    variante?: string
    carburant?: string
    transmission?: string
    annee?: string
    kilometrage?: string
  }
): Promise<UserVehicleRow> {
  await ensureUserVehicleTable()
  const { randomUUID } = await import("node:crypto")
  const id = randomUUID()
  await prisma.$executeRawUnsafe(
    `INSERT INTO "UserVehicle" ("id","userId","nickname","marque","modele","variante","carburant","transmission","annee","kilometrage")
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    id,
    userId,
    data.nickname ?? null,
    data.marque,
    data.modele,
    data.variante ?? null,
    data.carburant ?? null,
    data.transmission ?? null,
    data.annee ?? null,
    data.kilometrage ?? null
  )
  const rows = await prisma.$queryRawUnsafe<UserVehicleRow[]>(
    `SELECT * FROM "UserVehicle" WHERE "id" = ?`,
    id
  )
  return rows[0]
}

export async function deleteUserVehicle(userId: string, vehicleId: string): Promise<boolean> {
  await ensureUserVehicleTable()
  await prisma.$executeRawUnsafe(
    `DELETE FROM "UserVehicle" WHERE "id" = ? AND "userId" = ?`,
    vehicleId,
    userId
  )
  return true
}
