import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"
import { createAccount, findAccountByEmail, findAccountById, type UserRole } from "@/lib/accounts-db"
import type { OAuthProfile, OAuthProviderId } from "@/lib/oauth"

/**
 * Marqueur stocké dans `UserAccount.passwordHash` pour les comptes créés via OAuth
 * sans mot de passe local. `verifyPassword` (scrypt$salt$hash) renverra toujours false
 * pour cette valeur : l'utilisateur ne peut donc pas se connecter via formulaire classique
 * sans d'abord passer par /mot-de-passe-oublie pour définir un mot de passe.
 */
export const OAUTH_ONLY_PASSWORD_MARKER = "oauth$none"

type OAuthAccountRow = {
  id: string
  userId: string
  provider: string
  providerAccountId: string
  email: string | null
  name: string | null
  avatarUrl: string | null
}

let oauthTableEnsured = false

async function ensureOAuthTable() {
  if (oauthTableEnsured) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "OAuthAccount" (
      "id" TEXT PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "userId" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "providerAccountId" TEXT NOT NULL,
      "email" TEXT,
      "name" TEXT,
      "avatarUrl" TEXT,
      UNIQUE ("provider", "providerAccountId")
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "OAuthAccount_userId_idx" ON "OAuthAccount" ("userId")`
  )
  oauthTableEnsured = true
}

export async function findOAuthAccount(
  provider: OAuthProviderId,
  providerAccountId: string
): Promise<OAuthAccountRow | null> {
  await ensureOAuthTable()
  const rows = await prisma.$queryRawUnsafe<OAuthAccountRow[]>(
    `SELECT "id", "userId", "provider", "providerAccountId", "email", "name", "avatarUrl"
     FROM "OAuthAccount"
     WHERE "provider" = ? AND "providerAccountId" = ?
     LIMIT 1`,
    provider,
    providerAccountId
  )
  return rows[0] ?? null
}

export async function linkOAuthAccount(input: {
  userId: string
  provider: OAuthProviderId
  profile: OAuthProfile
}): Promise<void> {
  await ensureOAuthTable()
  await prisma.$executeRawUnsafe(
    `INSERT INTO "OAuthAccount" ("id", "userId", "provider", "providerAccountId", "email", "name", "avatarUrl")
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    randomUUID(),
    input.userId,
    input.provider,
    input.profile.providerAccountId,
    input.profile.email,
    input.profile.name,
    input.profile.avatarUrl
  )
}

export type OAuthResolveResult = {
  userId: string
  /** "login_existing" : compte + OAuth déjà liés.
   *  "linked_by_email" : compte existant trouvé par email → OAuth lié.
   *  "created" : nouveau compte créé via OAuth. */
  kind: "login_existing" | "linked_by_email" | "created"
}

/**
 * Résout un profil OAuth en compte utilisateur :
 *   1) Si `(provider, providerAccountId)` est déjà lié → login de ce compte.
 *   2) Sinon si un `UserAccount` existe avec le même email ET l'email est vérifié par le provider → lier.
 *   3) Sinon créer un nouveau compte (sans mot de passe local).
 *
 * Si l'email n'est pas vérifié et qu'un compte existe avec cet email, on refuse la liaison
 * automatique pour empêcher un pirate qui contrôle un compte OAuth de détourner un compte local.
 */
export async function resolveOAuthSignIn(input: {
  provider: OAuthProviderId
  profile: OAuthProfile
}): Promise<
  | { ok: true; result: OAuthResolveResult }
  | { ok: false; error: "email_conflict_unverified" | "missing_email" }
> {
  const { provider, profile } = input

  // 1) OAuth déjà lié
  const existingOAuth = await findOAuthAccount(provider, profile.providerAccountId)
  if (existingOAuth) {
    // Garde-fou : si le UserAccount pointé a été supprimé, on nettoie le lien
    // orphelin et on retombe sur la création/liaison normale plutôt que de
    // retourner un userId fantôme (symptôme : session créée mais /api/auth/me
    // renvoie user=null → utilisateur "connecté mais invisible").
    const linkedAccount = await findAccountById(existingOAuth.userId)
    if (linkedAccount) {
      return { ok: true, result: { userId: existingOAuth.userId, kind: "login_existing" } }
    }
    await prisma.$executeRawUnsafe(
      `DELETE FROM "OAuthAccount" WHERE "provider" = ? AND "providerAccountId" = ?`,
      provider,
      profile.providerAccountId
    )
  }

  // 2) Tentative de liaison par email (si vérifié par le provider)
  if (profile.email) {
    const existingAccount = await findAccountByEmail(profile.email)
    if (existingAccount) {
      if (!profile.emailVerified) {
        return { ok: false, error: "email_conflict_unverified" }
      }
      await linkOAuthAccount({ userId: existingAccount.id, provider, profile })
      return { ok: true, result: { userId: existingAccount.id, kind: "linked_by_email" } }
    }
  } else {
    // Pas d'email du tout → on ne peut pas créer un compte cohérent avec le reste du système.
    return { ok: false, error: "missing_email" }
  }

  // 3) Création d'un nouveau compte
  const defaultRole: UserRole = "user"
  const created = await createAccount({
    name: profile.name?.trim() || profile.email.split("@")[0] || "Utilisateur",
    email: profile.email.toLowerCase(),
    passwordHash: OAUTH_ONLY_PASSWORD_MARKER,
    role: defaultRole,
    signupPostalCode: null,
    signupCity: null,
    garageId: null,
  })
  await linkOAuthAccount({ userId: created.id, provider, profile })
  return { ok: true, result: { userId: created.id, kind: "created" } }
}
