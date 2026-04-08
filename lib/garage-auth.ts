import { getUserFromAuthCookie, type SessionUser } from "@/lib/auth-session"
import { findGarageById, type GarageRow } from "@/lib/garage-db"

/**
 * Vérifie que l'utilisateur est un garagiste avec un garageId valide.
 * Retourne le user et le garageId, ou null si non autorisé.
 */
export async function requireGaragiste(
  req: Request
): Promise<{ user: SessionUser; garageId: string } | null> {
  const cookieHeader = req.headers.get("cookie")
  const user = await getUserFromAuthCookie(cookieHeader)
  if (!user || user.role !== "garagiste" || !user.garageId) return null
  return { user, garageId: user.garageId }
}

/**
 * Vérifie que l'utilisateur est le manager (propriétaire) du garage.
 */
export async function requireGarageOwner(
  req: Request
): Promise<{ user: SessionUser; garage: GarageRow } | null> {
  const cookieHeader = req.headers.get("cookie")
  const user = await getUserFromAuthCookie(cookieHeader)
  if (!user || user.role !== "garagiste" || !user.garageId) return null

  const garage = await findGarageById(user.garageId)
  if (!garage || garage.managerUserId !== user.id) return null

  return { user, garage }
}
