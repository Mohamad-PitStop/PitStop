import { z } from "zod"
import { getStripe } from "@/lib/stripe"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { CREDIT_PACKAGES } from "@/lib/credit-packages"

export const runtime = "nodejs"

const BodySchema = z.object({
  packageId: z.enum(["1", "3", "6", "10"]),
  intent: z.enum(["credit_purchase", "guest_diagnostic"]),
})

export async function POST(req: Request) {
  try {
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

    const paymentIntent = await stripe.paymentIntents.create({
      amount: pkg.amountCents,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      metadata: {
        intent: body.intent,
        credits: String(pkg.credits),
        ...(userId ? { userId } : {}),
      },
    })

    if (!paymentIntent.client_secret) {
      throw new Error("Stripe n'a pas renvoyé de client_secret")
    }

    return Response.json({ ok: true, clientSecret: paymentIntent.client_secret })
  } catch (error) {
    console.error("Erreur credits create-payment-intent:", error)
    return Response.json(
      { ok: false, error: "Erreur lors de la création du paiement" },
      { status: 400 }
    )
  }
}
