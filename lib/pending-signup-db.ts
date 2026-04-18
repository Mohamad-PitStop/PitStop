import { randomBytes, randomUUID, createHash } from "node:crypto"
import { prisma } from "@/lib/prisma"
import type { OAuthProfile, OAuthProviderId } from "@/lib/oauth"

/**
 * Table "PendingSignup" : stocke temporairement le profil OAuth d'un utilisateur
 * qui vient de passer Google mais n'a pas encore renseigné son code postal.
 *
 * Tant que cette étape n'est pas validée, AUCUN UserAccount n'est créé : seule
 * une ligne PendingSignup existe, référencée par un token random en cookie.
 * Si l'utilisateur abandonne (ferme l'onglet, revient à l'accueil, etc.), la
 * ligne expire naturellement — rien à nettoyer, rien à supprimer en cascade,
 * et aucun compte fantôme ne pollue la DB.
 */

export const PENDING_SIGNUP_COOKIE = "pitstop_pending_signup"
export const PENDING_SIGNUP_MAX_AGE_SECONDS = 60 * 30 // 30 minutes

export type PendingSignupRow = {
  id: string
  token: string
  provider: OAuthProviderId
  providerAccountId: string
  email: string | null
  emailVerified: number
  name: string | null
  avatarUrl: string | null
  expiresAt: string
}

let ensured = false

async function ensurePendingSignupTable() {
  if (ensured) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PendingSignup" (
      "id" TEXT PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "token" TEXT NOT NULL UNIQUE,
      "provider" TEXT NOT NULL,
      "providerAccountId" TEXT NOT NULL,
      "email" TEXT,
      "emailVerified" INTEGER NOT NULL DEFAULT 0,
      "name" TEXT,
      "avatarUrl" TEXT,
      "expiresAt" DATETIME NOT NULL
    )
  `)
  ensured = true
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

/**
 * Crée une ligne PendingSignup pour un profil OAuth et retourne le token
 * en clair à poser côté cookie. Seul le hash est stocké en DB.
 */
export async function createPendingSignup(input: {
  provider: OAuthProviderId
  profile: OAuthProfile
}): Promise<{ token: string; expiresAt: Date }> {
  await ensurePendingSignupTable()
  const token = randomBytes(32).toString("hex")
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + PENDING_SIGNUP_MAX_AGE_SECONDS * 1000)
  await prisma.$executeRawUnsafe(
    `INSERT INTO "PendingSignup"
      ("id", "token", "provider", "providerAccountId", "email", "emailVerified", "name", "avatarUrl", "expiresAt")
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    randomUUID(),
    tokenHash,
    input.provider,
    input.profile.providerAccountId,
    input.profile.email,
    input.profile.emailVerified ? 1 : 0,
    input.profile.name,
    input.profile.avatarUrl,
    expiresAt.toISOString()
  )
  return { token, expiresAt }
}

export async function findPendingSignupByToken(token: string): Promise<{
  provider: OAuthProviderId
  profile: OAuthProfile
  expiresAt: Date
} | null> {
  await ensurePendingSignupTable()
  const tokenHash = hashToken(token)
  const rows = await prisma.$queryRawUnsafe<PendingSignupRow[]>(
    `SELECT "id", "token", "provider", "providerAccountId", "email", "emailVerified", "name", "avatarUrl", "expiresAt"
     FROM "PendingSignup"
     WHERE "token" = ?
     LIMIT 1`,
    tokenHash
  )
  const row = rows[0]
  if (!row) return null
  const expiresAt = new Date(row.expiresAt)
  if (expiresAt.getTime() < Date.now()) {
    await deletePendingSignupByToken(token)
    return null
  }
  return {
    provider: row.provider as OAuthProviderId,
    profile: {
      providerAccountId: row.providerAccountId,
      email: row.email,
      emailVerified: Number(row.emailVerified) === 1,
      name: row.name,
      avatarUrl: row.avatarUrl,
    },
    expiresAt,
  }
}

export async function deletePendingSignupByToken(token: string): Promise<void> {
  await ensurePendingSignupTable()
  const tokenHash = hashToken(token)
  await prisma.$executeRawUnsafe(`DELETE FROM "PendingSignup" WHERE "token" = ?`, tokenHash)
}
