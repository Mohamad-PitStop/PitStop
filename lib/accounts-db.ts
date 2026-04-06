import { randomUUID, createHash } from "node:crypto"
import { prisma } from "@/lib/prisma"

export type UserRole = "admin" | "tester" | "user" | "user_friend"

type AccountRow = {
  id: string
  name: string
  email: string
  passwordHash: string
  role: UserRole
  diagnosticCredits: number
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
  // Migration : colonne role
  const cols = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM pragma_table_info('UserAccount') WHERE name = 'role'`
  )
  if (cols.length === 0) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "UserAccount" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user'`)
  }
  // Migration : colonne diagnosticCredits
  const creditCols = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM pragma_table_info('UserAccount') WHERE name = 'diagnosticCredits'`
  )
  if (creditCols.length === 0) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "UserAccount" ADD COLUMN "diagnosticCredits" INTEGER NOT NULL DEFAULT 0`
    )
  }
  // Table anti-abus : crédit de bienvenue par IP (hash SHA-256)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "WelcomeCreditGrant" (
      "id" TEXT PRIMARY KEY,
      "ipHash" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "WelcomeCreditGrant_ipHash_idx" ON "WelcomeCreditGrant" ("ipHash")`
  )
  ensured = true
}

// ── Anti-abus crédit de bienvenue ────────────────────────────────────────────

const WELCOME_CREDIT_WINDOW_DAYS = 60

function hashIp(ip: string): string {
  return createHash("sha256").update(`pitstop-welcome:${ip}`).digest("hex")
}

export async function canGrantWelcomeCredit(ip: string): Promise<boolean> {
  await ensureAccountsTable()
  const ipHash = hashIp(ip)
  const since = new Date(Date.now() - WELCOME_CREDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT "id" FROM "WelcomeCreditGrant" WHERE "ipHash" = ? AND "createdAt" >= ? LIMIT 1`,
    ipHash,
    since
  )
  return rows.length === 0
}

export async function recordWelcomeCreditGrant(ip: string): Promise<void> {
  await ensureAccountsTable()
  await prisma.$executeRawUnsafe(
    `INSERT INTO "WelcomeCreditGrant" ("id", "ipHash") VALUES (?, ?)`,
    randomUUID(),
    hashIp(ip)
  )
}

function toRole(r: unknown): UserRole {
  if (r === "admin" || r === "tester" || r === "user_friend") return r
  return "user"
}

export async function findAccountByEmail(email: string): Promise<AccountRow | null> {
  await ensureAccountsTable()
  const rows = await prisma.$queryRawUnsafe<AccountRow[]>(
    `SELECT "id", "name", "email", "passwordHash", "role", "diagnosticCredits"
     FROM "UserAccount"
     WHERE lower("email") = lower(?)
     LIMIT 1`,
    email
  )
  const row = rows[0]
  if (!row) return null
  return { ...row, role: toRole(row.role), diagnosticCredits: Number(row.diagnosticCredits ?? 0) }
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
    `INSERT INTO "UserAccount" ("id", "name", "email", "passwordHash", "role", "diagnosticCredits") VALUES (?, ?, ?, ?, ?, 0)`,
    id,
    input.name,
    input.email,
    input.passwordHash,
    role
  )
  return { id, name: input.name, email: input.email, role }
}

export async function findAccountById(id: string): Promise<{ id: string; name: string; email: string; role: UserRole; diagnosticCredits: number } | null> {
  await ensureAccountsTable()
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; name: string; email: string; role: string; diagnosticCredits: number }>>(
    `SELECT "id", "name", "email", "role", "diagnosticCredits" FROM "UserAccount" WHERE "id" = ? LIMIT 1`,
    id
  )
  const row = rows[0]
  if (!row) return null
  return { ...row, role: toRole(row.role), diagnosticCredits: Number(row.diagnosticCredits ?? 0) }
}

// ── Crédits diagnostic ───────────────────────────────────────────────────────

export async function getUserCredits(userId: string): Promise<number> {
  await ensureAccountsTable()
  const rows = await prisma.$queryRawUnsafe<Array<{ diagnosticCredits: number }>>(
    `SELECT "diagnosticCredits" FROM "UserAccount" WHERE "id" = ? LIMIT 1`,
    userId
  )
  return Number(rows[0]?.diagnosticCredits ?? 0)
}

export async function addCredits(userId: string, amount: number): Promise<void> {
  await ensureAccountsTable()
  await prisma.$executeRawUnsafe(
    `UPDATE "UserAccount" SET "diagnosticCredits" = "diagnosticCredits" + ? WHERE "id" = ?`,
    amount,
    userId
  )
}

/**
 * Déduit 1 crédit si l'utilisateur en a au moins un.
 * @returns true si le crédit a été déduit, false si le solde était 0.
 */
export async function deductCredit(userId: string): Promise<boolean> {
  await ensureAccountsTable()
  const result = await prisma.$executeRawUnsafe(
    `UPDATE "UserAccount" SET "diagnosticCredits" = "diagnosticCredits" - 1
     WHERE "id" = ? AND "diagnosticCredits" > 0`,
    userId
  )
  return (result as unknown as number) > 0
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

export async function logAdminCreditGrant(input: {
  adminUserId: string
  targetUserId: string
  targetEmail: string
  credits: number
  reason: string | null
}): Promise<void> {
  await ensureAccountsTable()
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AdminCreditGrant" (
      "id" TEXT PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "adminUserId" TEXT NOT NULL,
      "targetUserId" TEXT NOT NULL,
      "targetEmail" TEXT NOT NULL,
      "credits" INTEGER NOT NULL,
      "reason" TEXT
    )
  `)
  await prisma.$executeRawUnsafe(
    `INSERT INTO "AdminCreditGrant" ("id", "adminUserId", "targetUserId", "targetEmail", "credits", "reason")
     VALUES (?, ?, ?, ?, ?, ?)`,
    randomUUID(),
    input.adminUserId,
    input.targetUserId,
    input.targetEmail,
    input.credits,
    input.reason
  )
}

export async function getAdminCreditGrantedLast24h(adminUserId: string): Promise<number> {
  await ensureAccountsTable()
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AdminCreditGrant" (
      "id" TEXT PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "adminUserId" TEXT NOT NULL,
      "targetUserId" TEXT NOT NULL,
      "targetEmail" TEXT NOT NULL,
      "credits" INTEGER NOT NULL,
      "reason" TEXT
    )
  `)
  const rows = await prisma.$queryRawUnsafe<Array<{ total: number | null }>>(
    `SELECT COALESCE(SUM("credits"), 0) AS total
     FROM "AdminCreditGrant"
     WHERE "adminUserId" = ?
       AND "createdAt" >= datetime('now', '-1 day')`,
    adminUserId
  )
  return Number(rows[0]?.total ?? 0)
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

export async function deleteAccountById(userId: string): Promise<void> {
  await ensureAccountsTable()
  await prisma.$executeRawUnsafe(`DELETE FROM "UserSession" WHERE "userId" = ?`, userId)
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
  await prisma.$executeRawUnsafe(`DELETE FROM "PasswordResetToken" WHERE "userId" = ?`, userId)
  await prisma.$executeRawUnsafe(`DELETE FROM "UserAccount" WHERE "id" = ?`, userId)
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

export async function updateAccountProfile(
  userId: string,
  input: { name?: string; email?: string }
): Promise<void> {
  await ensureAccountsTable()
  if (input.name) {
    await prisma.$executeRawUnsafe(
      `UPDATE "UserAccount" SET "name" = ? WHERE "id" = ?`,
      input.name,
      userId
    )
  }
  if (input.email) {
    await prisma.$executeRawUnsafe(
      `UPDATE "UserAccount" SET "email" = ? WHERE "id" = ?`,
      input.email,
      userId
    )
  }
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
