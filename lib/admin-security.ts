import { getUserFromAuthCookie } from "@/lib/auth-session"

const OWNER_ADMIN_EMAIL = (process.env.OWNER_ADMIN_EMAIL ?? "amoudialiahmad@gmail.com").trim().toLowerCase()

/**
 * Verrouille l'accès admin aux endpoints sensibles :
 * - rôle admin obligatoire
 * - e-mail admin propriétaire obligatoire
 */
export async function requireOwnerAdmin(req: Request) {
  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  if (!user || user.role !== "admin") return null
  if (user.email.trim().toLowerCase() !== OWNER_ADMIN_EMAIL) return null
  return user
}

