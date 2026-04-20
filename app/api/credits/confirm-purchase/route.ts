import { z } from "zod"
import { getStripe } from "@/lib/stripe"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { applyStripeCreditPurchaseOnce } from "@/lib/accounts-db"
import { hashIpForPromoUsage, recordPromoUsageOnceForStripeDedupe } from "@/lib/promo-db"

export const runtime = "nodejs"

// Fallback côté client pour créditer les crédits immédiatement après le retour
// Stripe, sans attendre le webhook. Le webhook reste la source de vérité :
// l'idempotence via `payment_intent:<id>` garantit qu'on ne crédite jamais
// deux fois.
const BodySchema = z.object({
  paymentIntentId: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const user = await getUserFromAuthCookie(req.headers.get("cookie"))
    if (!user) return Response.json({ ok: false, error: "Non authentifié" }, { status: 401 })

    const body = BodySchema.parse(await req.json())
    const stripe = getStripe()
    const pi = await stripe.paymentIntents.retrieve(body.paymentIntentId)

    if (pi.status !== "succeeded") {
      return Response.json(
        { ok: false, error: "Paiement non confirmé", status: pi.status },
        { status: 400 }
      )
    }
    if (pi.metadata?.intent !== "credit_purchase") {
      return Response.json({ ok: false, error: "Intent invalide" }, { status: 400 })
    }
    if (pi.metadata?.userId !== user.id) {
      return Response.json({ ok: false, error: "Paiement non associé à cet utilisateur" }, { status: 403 })
    }

    const credits = parseInt(pi.metadata?.credits ?? "0", 10)
    if (!credits || credits <= 0) {
      return Response.json({ ok: false, error: "Crédits invalides" }, { status: 400 })
    }

    const promoId = pi.metadata?.promoId
    const promoIpHashMeta = pi.metadata?.promoIpHash
    const promo =
      promoId != null && promoId !== ""
        ? {
            promoCodeId: promoId,
            ipHash:
              promoIpHashMeta && promoIpHashMeta !== ""
                ? promoIpHashMeta
                : hashIpForPromoUsage(`legacy_payment_intent:${pi.id}`),
          }
        : undefined

    const applied = await applyStripeCreditPurchaseOnce(
      `payment_intent:${pi.id}`,
      user.id,
      credits,
      promo
    )

    // Si le promo n'a pas été enregistré ici (déjà appliqué ailleurs), on tente
    // quand même la trace promo (idempotente par dedupeContext)
    if (promoId && promoIpHashMeta) {
      await recordPromoUsageOnceForStripeDedupe({
        promoCodeId: promoId,
        ipHash: promoIpHashMeta,
        userId: user.id,
        dedupeContext: `credits:payment_intent:${pi.id}`,
      }).catch(() => null)
    }

    return Response.json({ ok: true, applied, credits })
  } catch (error) {
    console.error("Erreur confirm-purchase:", error)
    return Response.json({ ok: false, error: "Erreur de confirmation" }, { status: 400 })
  }
}
