import { NextResponse } from "next/server"
import {
  findPromoCodeByCode,
  hasIpUsedPromo,
  hasUserUsedPromo,
  formatDiscount,
  assertPromoUsableByAccount,
} from "@/lib/promo-db"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { getClientIp } from "@/lib/rate-limit"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get("code")?.trim().toUpperCase()
    if (!code) return NextResponse.json({ ok: false, error: "Code manquant." }, { status: 400 })

    const promo = await findPromoCodeByCode(code)
    if (!promo || !promo.active) {
      return NextResponse.json({ ok: false, error: "Code promo invalide ou expiré." })
    }
    if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
      return NextResponse.json({ ok: false, error: "Ce code promo a atteint sa limite d'utilisation." })
    }

    const ip = getClientIp(req)
    if (await hasIpUsedPromo(promo.id, ip)) {
      return NextResponse.json({ ok: false, error: "Vous avez déjà utilisé ce code promo." })
    }

    const user = await getUserFromAuthCookie(req.headers.get("cookie"))
    const reserved = assertPromoUsableByAccount(promo, user?.id)
    if (!reserved.ok) {
      return NextResponse.json({ ok: false, error: reserved.error })
    }

    if (user && (await hasUserUsedPromo(promo.id, user.id))) {
      return NextResponse.json({ ok: false, error: "Vous avez déjà utilisé ce code promo." })
    }

    return NextResponse.json({
      ok: true,
      promoId: promo.id,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountLabel: formatDiscount(promo),
    })
  } catch (error) {
    console.error("promo/validate error:", error)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
