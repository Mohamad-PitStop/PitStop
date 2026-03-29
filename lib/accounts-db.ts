import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"

export type UserRole = "admin" | "tester" | "user" | "user_friend"

type AccountRow = {
  id: string
  name: string
  email: string
  passwordHash: string
  role: UserRole
}

type SessionRow = {
  id: string
  userId: string
  tokenHash: string
  expiresAt: string
}

let ensured = false

async function ensureAccountsTable() {
  if (ensured) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserAccount" (
      "id" TEXT PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "passwordHash" TEXT NOT NULL
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserSession" (
      "id" TEXT PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "userId" TEXT NOT NULL,
      "tokenHash" TEXT NOT NULL UNIQUE,
      "expiresAt" DATETIME NOT NULL
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PendingRoleAssignment" (
      "id" TEXT PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "email" TEXT NOT NULL UNIQUE,
      "role" TEXT NOT NULL
    )
  `)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UserSession_userId_idx" ON "UserSession" ("userId")`)
  // Migration : colonne role — on vérifie d'abord si elle existe pour éviter l'erreur SQLite
  const cols = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM pragma_table_info('UserAccount') WHERE name = 'role'`
  )
  if (cols.length === 0) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "UserAccount" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user'`)
  }
  ensured = true
}

function toRole(r: unknown): UserRole {
  if (r === "admin" || r === "tester" || r === "user_friend") return r
  return "user"
}

export async function findAccountByEmail(email: string): Promise<AccountRow | null> {
  await ensureAccountsTable()
  const rows = await prisma.$queryRawUnsafe<AccountRow[]>(
    `SELECT "id", "name", "email", "passwordHash", "role" FROM "UserAccount" WHERE "email" = ? LIMIT 1`,
    email
  )
  const row = rows[0]
  if (!row) return null
  return { ...row, role: toRole(row.role) }
}

export async function createAccount(input: {
  name: string
  email: string
  passwordHash: string
  role?: UserRole
}): Promise<{ id: string; name: string; email: string; role: UserRole }> {
  await ensureAccountsTable()
  const id = randomUUID()
  const role: UserRole = input.role ?? "user"
  await prisma.$executeRawUnsafe(
    `INSERT INTO "UserAccount" ("id", "name", "email", "passwordHash", "role") VALUES (?, ?, ?, ?, ?)`,
    id,
    input.name,
    input.email,
    input.passwordHash,
    role
  )
  return { id, name: input.name, email: input.email, role }
}

export async function findAccountById(id: string): Promise<{ id: string; name: string; email: string; role: UserRole } | null> {
  await ensureAccountsTable()
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; name: string; email: string; role: string }>>(
    `SELECT "id", "name", "email", "role" FROM "UserAccount" WHERE "id" = ? LIMIT 1`,
    id
  )
  const row = rows[0]
  if (!row) return null
  return { ...row, role: toRole(row.role) }
}

export async function getAllAccounts(): Promise<Array<{ id: string; name: string; email: string; role: UserRole; createdAt: string }>> {
  await ensureAccountsTable()
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; name: string; email: string; role: string; createdAt: string }>>(
    `SELECT "id", "name", "email", "role", "createdAt" FROM "UserAccount" ORDER BY "createdAt" DESC`
  )
  return rows.map((r) => ({ ...r, role: toRole(r.role) }))
}

export async function setUserRole(userId: string, role: UserRole): Promise<void> {
  await ensureAccountsTable()
  await prisma.$executeRawUnsafe(`UPDATE "UserAccount" SET "role" = ? WHERE "id" = ?`, role, userId)
}

export async function createSession(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
  await ensureAccountsTable()
  await prisma.$executeRawUnsafe(
    `INSERT INTO "UserSession" ("id", "userId", "tokenHash", "expiresAt") VALUES (?, ?, ?, ?)`,
    randomUUID(),
    input.userId,
    input.tokenHash,
    input.expiresAt.toISOString()
  )
}

export async function findSessionByTokenHash(tokenHash: string): Promise<SessionRow | null> {
  await ensureAccountsTable()
  const rows = await prisma.$queryRawUnsafe<SessionRow[]>(
    `SELECT "id", "userId", "tokenHash", "expiresAt" FROM "UserSession" WHERE "tokenHash" = ? LIMIT 1`,
    tokenHash
  )
  return rows[0] ?? null
}

export async function deleteSessionByTokenHash(tokenHash: string): Promise<void> {
  await ensureAccountsTable()
  await prisma.$executeRawUnsafe(`DELETE FROM "UserSession" WHERE "tokenHash" = ?`, tokenHash)
}

// ── Password reset tokens ────────────────────────────────────────────────────

export async function createPasswordResetToken(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
  await ensureAccountsTable()
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
      "id" TEXT PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "userId" TEXT NOT NULL,
      "tokenHash" TEXT NOT NULL UNIQUE,
      "expiresAt" DATETIME NOT NULL,
      "used" INTEGER NOT NULL DEFAULT 0
    )
  `)
  // Supprimer les anciens tokens de cet utilisateur
  await prisma.$executeRawUnsafe(`DELETE FROM "PasswordResetToken" WHERE "userId" = ?`, input.userId)
  await prisma.$executeRawUnsafe(
    `INSERT INTO "PasswordResetToken" ("id", "userId", "tokenHash", "expiresAt") VALUES (?, ?, ?, ?)`,
    randomUUID(),
    input.userId,
    input.tokenHash,
    input.expiresAt.toISOString()
  )
}

export async function findPasswordResetToken(tokenHash: string): Promise<{ id: string; userId: string; expiresAt: string; used: number } | null> {
  await ensureAccountsTable()
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
      "id" TEXT PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "userId" TEXT NOT NULL,
      "tokenHash" TEXT NOT NULL UNIQUE,
      "expiresAt" DATETIME NOT NULL,
      "used" INTEGER NOT NULL DEFAULT 0
    )
  `)
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; userId: string; expiresAt: string; used: number }>>(
    `SELECT "id", "userId", "expiresAt", "used" FROM "PasswordResetToken" WHERE "tokenHash" = ? LIMIT 1`,
    tokenHash
  )
  return rows[0] ?? null
}

export async function consumePasswordResetToken(tokenHash: string): Promise<void> {
  await prisma.$executeRawUnsafe(`DELETE FROM "PasswordResetToken" WHERE "tokenHash" = ?`, tokenHash)
}

export async function updateAccountPassword(userId: string, passwordHash: string): Promise<void> {
  await prisma.$executeRawUnsafe(`UPDATE "UserAccount" SET "passwordHash" = ? WHERE "id" = ?`, passwordHash, userId)
}

// ── Pending role assignments ─────────────────────────────────────────────────

export type PendingAssignment = {
  id: string
  createdAt: string
  email: string
  role: UserRole
}

export async function getAllPendingAssignments(): Promise<PendingAssignment[]> {
  await ensureAccountsTable()
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; createdAt: string; email: string; role: string }>>(
    `SELECT "id", "createdAt", "email", "role" FROM "PendingRoleAssignment" ORDER BY "createdAt" DESC`
  )
  return rows.map((r) => ({ ...r, role: toRole(r.role) }))
}

export async function findPendingAssignmentByEmail(email: string): Promise<PendingAssignment | null> {
  await ensureAccountsTable()
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; createdAt: string; email: string; role: string }>>(
    `SELECT "id", "createdAt", "email", "role" FROM "PendingRoleAssignment" WHERE "email" = ? LIMIT 1`,
    email
  )
  const row = rows[0]
  if (!row) return null
  return { ...row, role: toRole(row.role) }
}

export async function upsertPendingAssignment(email: string, role: UserRole): Promise<void> {
  await ensureAccountsTable()
  const existing = await findPendingAssignmentByEmail(email)
  if (existing) {
    await prisma.$executeRawUnsafe(`UPDATE "PendingRoleAssignment" SET "role" = ? WHERE "email" = ?`, role, email)
  } else {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "PendingRoleAssignment" ("id", "email", "role") VALUES (?, ?, ?)`,
      randomUUID(), email, role
    )
  }
}

export async function deletePendingAssignment(id: string): Promise<void> {
  await ensureAccountsTable()
  await prisma.$executeRawUnsafe(`DELETE FROM "PendingRoleAssignment" WHERE "id" = ?`, id)
}
