import { getUserFromAuthCookie } from "@/lib/auth-session"
import { getOrCreateMerciTesterPromo, formatDiscount } from "@/lib/promo-db"

export const runtime = "nodejs"

/**
 * Retourne (ou crée) le code promo personnel -30 % / 1 utilisation pour l’utilisateur connecté (page /merci).
 */
export async function GET(req: Request) {
  try {
    const user = await getUserFromAuthCookie(req.headers.get("cookie"))
    if (!user) {
      return Response.json({ ok: false, error: "auth" }, { status: 401 })
    }

    const promo = await getOrCreateMerciTesterPromo(user.id)
    const exhausted = promo.maxUses != null && promo.usedCount >= promo.maxUses

    return Response.json({
      ok: true,
      code: promo.code,
      promoId: promo.id,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountLabel: formatDiscount(promo),
      exhausted,
    })
  } catch (e) {
    console.error("merci-promo GET:", e)
    return Response.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
