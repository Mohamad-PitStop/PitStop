import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { registerPaidGuestSession, isPaidGuestSessionValid } from "@/lib/guest-credits-db"
import { GUEST_PAID_SESSION_COOKIE_NAME } from "@/lib/auth-session"

export const runtime = "nodejs"

/**
 * Vérifie qu'une session Stripe "guest_diagnostic" est bien payée,
 * l'enregistre en DB et pose un cookie httpOnly pour autoriser le diagnostic.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const sessionId = url.searchParams.get("session_id")
    if (!sessionId) {
      return NextResponse.json({ ok: false, error: "session_id manquant" }, { status: 400 })
    }

    // 1. Vérifier d'abord en DB (le webhook a peut-être déjà enregistré la session)
    const alreadyRegistered = await isPaidGuestSessionValid(sessionId)

    if (!alreadyRegistered) {
      // 2. Interroger Stripe directement (race condition webhook vs redirect)
      const stripe = getStripe()
      const session = await stripe.checkout.sessions.retrieve(sessionId)

      if (session.payment_status !== "paid") {
        return NextResponse.json({ ok: false, error: "Paiement non finalisé" }, { status: 400 })
      }
      if (session.metadata?.intent !== "guest_diagnostic") {
        return NextResponse.json({ ok: false, error: "Session invalide" }, { status: 400 })
      }

      // 3. Enregistrer la session valide en DB
      await registerPaidGuestSession(sessionId)
    }

    // 4. Poser le cookie httpOnly pour que le diagnostic API accepte cet invité
    const res = NextResponse.json({ ok: true })
    res.cookies.set(GUEST_PAID_SESSION_COOKIE_NAME, sessionId, {
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
