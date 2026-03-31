import Stripe from "stripe"

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY manquant")
  return new Stripe(key, {
    apiVersion: "2026-02-25.clover",
  })
}

export function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  return url.replace(/\/+$/, "")
}

const MIN_DEPOSIT_CENTS = 2500 // 25€ minimum

/** Calcule l'acompte : 15% du prix minimum du devis, avec un plancher de 25€.
 *  @param priceMinEuros  Prix minimum du devis en euros (optionnel). Si absent → 25€ fixe. */
export function getDepositAmountCents(priceMinEuros?: number): number {
  if (priceMinEuros != null && Number.isFinite(priceMinEuros) && priceMinEuros > 0) {
    const computed = Math.round(priceMinEuros * 0.15 * 100)
    return Math.max(MIN_DEPOSIT_CENTS, computed)
  }
  return MIN_DEPOSIT_CENTS
}

