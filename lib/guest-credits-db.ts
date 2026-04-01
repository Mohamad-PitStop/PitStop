import { prisma } from "@/lib/prisma"

let ensuredPGS = false

async function ensurePaidGuestSessionTable() {
  if (ensuredPGS) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PaidGuestSession" (
      "stripeSessionId" TEXT PRIMARY KEY,
      "createdAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "used"            INTEGER  NOT NULL DEFAULT 0
    )
  `)
  ensuredPGS = true
}

/** Enregistre une session Stripe comme crédit invité valide (idempotent). */
export async function registerPaidGuestSession(stripeSessionId: string): Promise<void> {
  await ensurePaidGuestSessionTable()
  await prisma.$executeRawUnsafe(
    `INSERT OR IGNORE INTO "PaidGuestSession" ("stripeSessionId") VALUES (?)`,
    stripeSessionId
  )
}

/** Retourne true si la session existe et n'a pas encore été consommée. */
export async function isPaidGuestSessionValid(stripeSessionId: string): Promise<boolean> {
  await ensurePaidGuestSessionTable()
  const rows = await prisma.$queryRawUnsafe<Array<{ used: number }>>(
    `SELECT "used" FROM "PaidGuestSession" WHERE "stripeSessionId" = ? LIMIT 1`,
    stripeSessionId
  )
  if (rows.length === 0) return false
  return rows[0].used === 0
}

/** Marque la session comme utilisée (le diagnostic a été lancé). */
export async function markPaidGuestSessionUsed(stripeSessionId: string): Promise<void> {
  await ensurePaidGuestSessionTable()
  await prisma.$executeRawUnsafe(
    `UPDATE "PaidGuestSession" SET "used" = 1 WHERE "stripeSessionId" = ?`,
    stripeSessionId
  )
}
