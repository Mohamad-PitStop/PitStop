import { z } from "zod"
import { getStripe, getSiteUrl } from "@/lib/stripe"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { CREDIT_PACKAGES } from "@/lib/credit-packages"

export const runtime = "nodejs"

const BodySchema = z.object({
  packageId: z.enum(["1", "3", "6", "10"]),
  intent: z.enum(["credit_purchase", "guest_diagnostic"]),
  /** Chemin de retour après annulation (et succès pour certains cas). */
  returnPath: z.string().default("/diagnostic"),
})

export async function POST(req: Request) {
  try {
    const stripe = getStripe()
    const siteUrl = getSiteUrl()
    const body = BodySchema.parse(await req.json())

    const pkg = CREDIT_PACKAGES.find((p) => p.id === body.packageId)
    if (!pkg) return Response.json({ ok: false, error: "Package invalide" }, { status: 400 })

    const returnPath = body.returnPath.startsWith("/") ? body.returnPath : "/diagnostic"

    let userId: string | undefined

    if (body.intent === "credit_purchase") {
      const user = await getUserFromAuthCookie(req.headers.get("cookie"))
      if (!user) return Response.json({ ok: false, error: "Non authentifié" }, { status: 401 })
      userId = user.id
    }

    // URL de succès différente selon le contexte
    let successUrl: string
    if (body.intent === "guest_diagnostic") {
      successUrl = `${siteUrl}${returnPath}?paid_session={CHECKOUT_SESSION_ID}`
    } else if (returnPath === "/diagnostic") {
      // Achat 1 crédit depuis la modale (retour au formulaire)
      successUrl = `${siteUrl}/diagnostic?credits_added=1`
    } else {
      // Achat depuis la page /credits
      successUrl = `${siteUrl}/credits?success=1`
    }

    const productName =
      pkg.credits === 1
        ? "1 Crédit Diagnostic PitStop"
        : `${pkg.credits} Crédits Diagnostic PitStop`

    const productDescription =
      pkg.credits === 1
        ? "1 diagnostic automobile complet par IA"
        : `${pkg.credits} diagnostics automobiles complets par IA${pkg.saving ? ` : ${pkg.saving}` : ""}`

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: successUrl,
      cancel_url: `${siteUrl}${returnPath}`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: pkg.amountCents,
            product_data: {
              name: productName,
              description: productDescription,
            },
          },
        },
      ],
      metadata: {
        intent: body.intent,
        credits: String(pkg.credits),
        ...(userId ? { userId } : {}),
      },
    })

    return Response.json({ ok: true, url: session.url })
  } catch (error) {
    console.error("Erreur credits checkout:", error)
    return Response.json({ ok: false, error: "Erreur lors de la création du paiement" }, { status: 400 })
  }
}
