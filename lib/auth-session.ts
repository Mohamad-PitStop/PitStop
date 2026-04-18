import { createHash, randomBytes } from "node:crypto"
import {
  createSession,
  deleteSessionByTokenHash,
  findAccountById,
  findSessionByTokenHash,
  type UserRole,
} from "@/lib/accounts-db"

export const AUTH_COOKIE_NAME = "pitstop_auth"
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 jours

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function buildSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  }
}

export function extractCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null
  const parts = cookieHeader.split(";")
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=")
    if (k === name) return decodeURIComponent(rest.join("="))
  }
  return null
}

export async function createAuthSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex")
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)
  await createSession({ userId, tokenHash, expiresAt })
  return token
}

/** Données compte exposées au client. */
export type SessionUser = {
  id: string
  name: string
  email: string
  role: UserRole
  diagnosticCredits: number
  garageId: string | null
  signupPostalCode: string | null
  pendingCompletion: boolean
}

export async function getUserFromAuthCookie(cookieHeader: string | null): Promise<SessionUser | null> {
  const token = extractCookieValue(cookieHeader, AUTH_COOKIE_NAME)
  if (!token) return null
  const tokenHash = hashToken(token)
  const session = await findSessionByTokenHash(tokenHash)
  if (!session) return null
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await deleteSessionByTokenHash(tokenHash)
    return null
  }
  const row = await findAccountById(session.userId)
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    diagnosticCredits: row.diagnosticCredits,
    garageId: row.garageId ?? null,
    signupPostalCode: row.signupPostalCode ?? null,
    pendingCompletion: row.pendingCompletion,
  }
}

export async function clearAuthSession(cookieHeader: string | null): Promise<void> {
  const token = extractCookieValue(cookieHeader, AUTH_COOKIE_NAME)
  if (!token) return
  await deleteSessionByTokenHash(hashToken(token))
}
