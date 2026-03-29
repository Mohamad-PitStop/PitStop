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

export function getDepositAmountCents() {
  const raw = process.env.STRIPE_DEPOSIT_AMOUNT_CENTS || "2500"
  const v = Number(raw)
  if (!Number.isFinite(v) || v <= 0) throw new Error("STRIPE_DEPOSIT_AMOUNT_CENTS invalide")
  return Math.round(v)
}

