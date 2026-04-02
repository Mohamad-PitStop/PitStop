import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { registerPaidGuestSession, isPaidGuestSessionValid } from "@/lib/guest-credits-db"
import { GUEST_PAID_SESSION_COOKIE_NAME } from "@/lib/auth-session"

export const runtime = "nodejs"

/**
 * Vérifie qu'un paiement "guest_diagnostic" est bien réussi,
 * l'enregistre en DB et pose un cookie httpOnly pour autoriser le diagnostic.
 *
 * Supporte les deux identifiants :
 * - payment_intent (nouveau flux PaymentIntent + Elements)
 * - session_id      (ancien flux Checkout Session, rétro-compatibilité)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const paymentIntentId = url.searchParams.get("payment_intent")
    const sessionId = url.searchParams.get("session_id")

    const id = paymentIntentId || sessionId
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "payment_intent ou session_id manquant" },
        { status: 400 }
      )
    }

    // 1. Vérifier d'abord en DB (le webhook a peut-être déjà enregistré)
    const alreadyRegistered = await isPaidGuestSessionValid(id)

    if (!alreadyRegistered) {
      const stripe = getStripe()

      if (paymentIntentId) {
        // Nouveau flux : vérifier via PaymentIntent
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
        if (pi.status !== "succeeded") {
          return NextResponse.json({ ok: false, error: "Paiement non finalisé" }, { status: 400 })
        }
        if (pi.metadata?.intent !== "guest_diagnostic") {
          return NextResponse.json({ ok: false, error: "Paiement invalide" }, { status: 400 })
        }
      } else {
        // Ancien flux : vérifier via Checkout Session
        const session = await stripe.checkout.sessions.retrieve(sessionId!)
        if (session.payment_status !== "paid") {
          return NextResponse.json({ ok: false, error: "Paiement non finalisé" }, { status: 400 })
        }
        if (session.metadata?.intent !== "guest_diagnostic") {
          return NextResponse.json({ ok: false, error: "Session invalide" }, { status: 400 })
        }
      }

      // 3. Enregistrer en DB
      await registerPaidGuestSession(id)
    }

    // 4. Poser le cookie httpOnly pour que le diagnostic API accepte cet invité
    const res = NextResponse.json({ ok: true })
    res.cookies.set(GUEST_PAID_SESSION_COOKIE_NAME, id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 2, // 2 heures
    })
    return res
  } catch (error) {
    console.error("Erreur verify-guest-payment:", error)
    return NextResponse.json({ ok: false, error: "Erreur de vérification" }, { status: 500 })
  }
}
