import { z } from "zod"
import { getStripe } from "@/lib/stripe"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { CREDIT_PACKAGES } from "@/lib/credit-packages"
import {
  findPromoCodeByCode,
  hasIpUsedPromo,
  hasUserUsedPromo,
  recordPromoUsage,
  applyPromoDiscount,
  formatDiscount,
} from "@/lib/promo-db"
import { getClientIp } from "@/lib/rate-limit"
import { CREDIT_PURCHASES_ENABLED } from "@/lib/feature-flags"

export const runtime = "nodejs"

const BodySchema = z.object({
  packageId: z.enum(["1", "3", "6", "10"]),
  intent: z.enum(["credit_purchase", "guest_diagnostic"]),
  promoCode: z.string().trim().optional().nullable(),
})

export async function POST(req: Request) {
  try {
    if (!CREDIT_PURCHASES_ENABLED) {
      return Response.json(
        {
          ok: false,
          error:
            "L'achat de crédits est temporairement indisponible. Réessayez lorsque le service sera ouvert à la vente.",
          code: "CREDIT_PURCHASES_DISABLED",
        },
        { status: 403 }
      )
    }
    const stripe = getStripe()
    const body = BodySchema.parse(await req.json())

    const pkg = CREDIT_PACKAGES.find((p) => p.id === body.packageId)
    if (!pkg) return Response.json({ ok: false, error: "Package invalide" }, { status: 400 })

    let userId: string | undefined

    if (body.intent === "credit_purchase") {
      const user = await getUserFromAuthCookie(req.headers.get("cookie"))
      if (!user) return Response.json({ ok: false, error: "Non authentifié" }, { status: 401 })
      userId = user.id
    }

    const ip = getClientIp(req)
    let finalAmount: number = pkg.amountCents
    let promoId: string | null = null
    let appliedDiscountLabel: string | null = null

    if (body.promoCode) {
      const promo = await findPromoCodeByCode(body.promoCode)
      if (!promo || !promo.active || (promo.maxUses != null && promo.usedCount >= promo.maxUses)) {
        return Response.json({ ok: false, error: "Code promo invalide ou expiré." }, { status: 400 })
      }
      if (await hasIpUsedPromo(promo.id, ip)) {
        return Response.json({ ok: false, error: "Vous avez déjà utilisé ce code promo." }, { status: 400 })
      }
      if (userId && (await hasUserUsedPromo(promo.id, userId))) {
        return Response.json({ ok: false, error: "Vous avez déjà utilisé ce code promo." }, { status: 400 })
      }
      finalAmount = applyPromoDiscount(pkg.amountCents, promo)
      promoId = promo.id
      appliedDiscountLabel = formatDiscount(promo)
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      metadata: {
        intent: body.intent,
        credits: String(pkg.credits),
        ...(userId ? { userId } : {}),
        ...(promoId ? { promoId } : {}),
      },
    })

    if (!paymentIntent.client_secret) {
      throw new Error("Stripe n'a pas renvoyé de client_secret")
    }

    // Record promo usage immediately (prevents multi-use before webhook)
    if (promoId) {
      await recordPromoUsage({ promoCodeId: promoId, ip, userId: userId ?? null, context: "credits" })
    }

    return Response.json({
      ok: true,
      clientSecret: paymentIntent.client_secret,
      finalAmount,
      appliedDiscountLabel,
    })
  } catch (error) {
    console.error("Erreur credits create-payment-intent:", error)
    return Response.json(
      { ok: false, error: "Erreur lors de la création du paiement" },
      { status: 400 }
    )
  }
}
