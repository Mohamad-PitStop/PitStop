import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"

let tableEnsured = false

export type GarageReviewRow = {
  id: string
  createdAt: string
  reservationId: string
  garageId: string
  userId: string | null
  token: string
  rating: number | null
  comment: string | null
  submittedAt: string | null
  emailSentAt: string | null
}

export async function ensureGarageReviewTable(): Promise<void> {
  if (tableEnsured) return

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "GarageReview" (
      "id"            TEXT NOT NULL PRIMARY KEY,
      "createdAt"     DATETIME NOT NULL DEFAULT (datetime('now')),
      "reservationId" TEXT NOT NULL UNIQUE,
      "garageId"      TEXT NOT NULL,
      "userId"        TEXT,
      "token"         TEXT NOT NULL UNIQUE,
      "rating"        INTEGER,
      "comment"       TEXT,
      "submittedAt"   DATETIME,
      "emailSentAt"   DATETIME
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ReviewEmailSent" (
      "id"            TEXT NOT NULL PRIMARY KEY,
      "createdAt"     DATETIME NOT NULL DEFAULT (datetime('now')),
      "reservationId" TEXT NOT NULL UNIQUE
    )
  `)

  tableEnsured = true
}

export async function createGarageReview(data: {
  reservationId: string
  garageId: string
  userId?: string | null
  token: string
}): Promise<GarageReviewRow> {
  await ensureGarageReviewTable()

  const id = randomUUID()
  const now = new Date().toISOString()

  await prisma.$executeRawUnsafe(
    `INSERT INTO "GarageReview" ("id", "createdAt", "reservationId", "garageId", "userId", "token")
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    now,
    data.reservationId,
    data.garageId,
    data.userId ?? null,
    data.token
  )

  const rows = await prisma.$queryRawUnsafe<GarageReviewRow[]>(
    `SELECT * FROM "GarageReview" WHERE "id" = ? LIMIT 1`,
    id
  )
  return rows[0]
}

export async function getGarageReviewByToken(token: string): Promise<GarageReviewRow | null> {
  await ensureGarageReviewTable()

  const rows = await prisma.$queryRawUnsafe<GarageReviewRow[]>(
    `SELECT * FROM "GarageReview" WHERE "token" = ? LIMIT 1`,
    token
  )
  return rows[0] ?? null
}

/**
 * Soumet l'avis (rating + comment) une seule fois — ne met à jour que si
 * submittedAt IS NULL pour éviter les doubles soumissions.
 * Retourne true si la mise à jour a bien eu lieu.
 */
export async function submitGarageReview(
  token: string,
  rating: number,
  comment?: string
): Promise<boolean> {
  await ensureGarageReviewTable()

  const submittedAt = new Date().toISOString()

  const result = await prisma.$executeRawUnsafe(
    `UPDATE "GarageReview"
     SET "rating" = ?, "comment" = ?, "submittedAt" = ?
     WHERE "token" = ? AND "submittedAt" IS NULL`,
    rating,
    comment ?? null,
    submittedAt,
    token
  )

  return (result as unknown as number) > 0
}

/**
 * Marque l'e-mail de demande d'avis comme envoyé :
 * - met à jour emailSentAt sur GarageReview
 * - insère un enregistrement ReviewEmailSent (idempotent via INSERT OR IGNORE)
 */
export async function markReviewEmailSent(
  reservationId: string,
  reviewId: string
): Promise<void> {
  await ensureGarageReviewTable()

  const now = new Date().toISOString()

  await prisma.$executeRawUnsafe(
    `UPDATE "GarageReview" SET "emailSentAt" = ? WHERE "id" = ?`,
    now,
    reviewId
  )

  const sentId = randomUUID()
  await prisma.$executeRawUnsafe(
    `INSERT OR IGNORE INTO "ReviewEmailSent" ("id", "createdAt", "reservationId")
     VALUES (?, ?, ?)`,
    sentId,
    now,
    reservationId
  )
}

export type ReviewAwaitingEmail = {
  reservationId: string
  endAt: string
  garageId: string
  token: string
  emailSentAt: string | null
}

/**
 * Retourne les réservations terminées pour lesquelles un e-mail d'avis
 * n'a pas encore été envoyé et l'avis n'a pas encore été soumis.
 */
export async function getReviewsAwaitingEmail(): Promise<ReviewAwaitingEmail[]> {
  await ensureGarageReviewTable()

  const rows = await prisma.$queryRawUnsafe<ReviewAwaitingEmail[]>(
    `SELECT r.id AS reservationId, r.endAt, r.garageId, gr.token, gr.emailSentAt
     FROM "Reservation" r
     JOIN "GarageReview" gr ON gr.reservationId = r.id
     WHERE gr.emailSentAt IS NULL
       AND gr.submittedAt IS NULL`
  )
  return rows
}

export async function isReviewEmailSent(reservationId: string): Promise<boolean> {
  await ensureGarageReviewTable()

  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT "id" FROM "ReviewEmailSent" WHERE "reservationId" = ? LIMIT 1`,
    reservationId
  )
  return rows.length > 0
}
