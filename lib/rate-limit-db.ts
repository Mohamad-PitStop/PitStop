/**
 * Rate limiter distribué basé sur Turso/LibSQL.
 * Fonctionne sur Vercel multi-instance car la DB est partagée.
 * Utilisé pour les routes sensibles : login, signup, contact, admin.
 */

import { prisma } from "@/lib/prisma"

let tableReady = false

async function ensureTable() {
  if (tableReady) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "RateLimit" (
      "id"        TEXT NOT NULL PRIMARY KEY,
      "name"      TEXT NOT NULL,
      "key"       TEXT NOT NULL,
      "createdAt" TEXT NOT NULL
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "idx_ratelimit_name_key_created"
    ON "RateLimit"("name", "key", "createdAt")
  `)
  tableReady = true
}

export interface RateLimitDbConfig {
  name: string
  maxRequests: number
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
}

/**
 * Vérifie et enregistre une tentative de rate limit dans Turso.
 * Chaque appel compte une requête et retourne si elle est autorisée.
 */
export async function checkRateLimitDb(
  config: RateLimitDbConfig,
  key: string
): Promise<RateLimitResult> {
  await ensureTable()

  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const windowStart = new Date(now - windowMs).toISOString()

  // Nettoyage opportuniste : supprimer les entrées trop vieilles (2x la fenêtre)
  const cutoff = new Date(now - windowMs * 2).toISOString()
  await prisma.$executeRawUnsafe(
    `DELETE FROM "RateLimit" WHERE "name" = ? AND "createdAt" < ?`,
    config.name,
    cutoff
  )

  // Compter les requêtes dans la fenêtre courante
  type CountRow = { cnt: number | bigint }
  const rows = await prisma.$queryRawUnsafe<CountRow[]>(
    `SELECT COUNT(*) AS cnt FROM "RateLimit" WHERE "name" = ? AND "key" = ? AND "createdAt" > ?`,
    config.name,
    key,
    windowStart
  )
  const count = Number(rows[0]?.cnt ?? 0)

  if (count >= config.maxRequests) {
    // Trouver la plus ancienne entrée dans la fenêtre pour calculer le retry
    type OldRow = { oldest: string | null }
    const oldRows = await prisma.$queryRawUnsafe<OldRow[]>(
      `SELECT MIN("createdAt") AS oldest FROM "RateLimit" WHERE "name" = ? AND "key" = ? AND "createdAt" > ?`,
      config.name,
      key,
      windowStart
    )
    const oldestTime = oldRows[0]?.oldest ? new Date(oldRows[0].oldest).getTime() : now
    const retryAfterMs = windowMs - (now - oldestTime)
    return { allowed: false, retryAfterSeconds: Math.ceil(Math.max(retryAfterMs, 1000) / 1000) }
  }

  // Enregistrer la tentative
  await prisma.$executeRawUnsafe(
    `INSERT INTO "RateLimit" ("id", "name", "key", "createdAt") VALUES (?, ?, ?, ?)`,
    crypto.randomUUID(),
    config.name,
    key,
    new Date(now).toISOString()
  )

  return { allowed: true, retryAfterSeconds: 0 }
}

export function rateLimitDbResponse(retryAfterSeconds: number): Response {
  return Response.json(
    { ok: false, error: "Trop de tentatives. Veuillez réessayer plus tard." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  )
}
