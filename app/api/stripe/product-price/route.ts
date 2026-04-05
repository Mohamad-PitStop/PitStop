import { getStripe } from "@/lib/stripe"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
// Revalidate every hour : price changes are rare
export const revalidate = 3600

const PRODUCT_ID = "prod_UFXxyva072Ms0Y"

export async function GET() {
  try {
    const stripe = getStripe()
    const prices = await stripe.prices.list({
      product: PRODUCT_ID,
      active: true,
      limit: 10,
    })

    // Pick the lowest-unit recurring or one-time price in EUR
    const eurPrices = prices.data.filter((p) => p.currency === "eur" && p.unit_amount != null)
    if (eurPrices.length === 0) {
      return NextResponse.json({ ok: false, error: "Aucun prix EUR actif trouvé." }, { status: 404 })
    }

    // Sort by unit_amount ascending, take the first (cheapest = 1-credit price)
    eurPrices.sort((a, b) => (a.unit_amount ?? 0) - (b.unit_amount ?? 0))
    const price = eurPrices[0]
    const amountCents = price.unit_amount!
    const amountEuros = amountCents / 100

    // French locale formatting: 5,99 €
    const formatted = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(amountEuros)

    return NextResponse.json({ ok: true, amountCents, amountEuros, formatted })
  } catch (error) {
    console.error("Erreur product-price:", error)
    return NextResponse.json({ ok: false, error: "Impossible de récupérer le prix." }, { status: 500 })
  }
}
