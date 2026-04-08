import { NextResponse } from "next/server"
import { requireGaragiste } from "@/lib/garage-auth"
import { prisma } from "@/lib/prisma"
import { cancelPayout } from "@/lib/deposit-payout-db"
import { getStripe } from "@/lib/stripe"

export const runtime = "nodejs"

type ReservationRow = {
  id: string
  status: string
  garageId: string | null
  stripePaymentIntentId: string | null
}

export async function POST(req: Request) {
  const auth = await requireGaragiste(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })
  const { garageId } = auth

  try {
    const body = await req.json().catch(() => null)
    if (!body?.reservationId) {
      return NextResponse.json({ ok: false, error: "reservationId requis." }, { status: 400 })
    }

    // Fetch the reservation
    const rows = await prisma.$queryRawUnsafe<ReservationRow[]>(
      `SELECT "id", "status", "garageId", "stripePaymentIntentId" FROM "Reservation" WHERE "id" = ? LIMIT 1`,
      body.reservationId
    )
    const reservation = rows[0]

    if (!reservation) {
      return NextResponse.json({ ok: false, error: "Réservation introuvable." }, { status: 404 })
    }

    // Verify the reservation belongs to this garage
    if (reservation.garageId !== garageId) {
      return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 403 })
    }

    // Only allow cancellation for confirmed/paid reservations
    if (reservation.status !== "confirmed" && reservation.status !== "paid") {
      return NextResponse.json(
        { ok: false, error: "Seules les réservations confirmées ou payées peuvent être annulées." },
        { status: 400 }
      )
    }

    // Stripe refund
    let refunded = false
    const stripe = getStripe()
    if (reservation.stripePaymentIntentId) {
      try {
        await stripe.refunds.create({ payment_intent: reservation.stripePaymentIntentId })
        refunded = true
      } catch (stripeErr) {
        console.error("Stripe refund error:", stripeErr)
      }
    }

    // Cancel the deposit payout (client gets refund)
    await cancelPayout(body.reservationId)

    // Update reservation status to cancelled
    await prisma.$executeRawUnsafe(
      `UPDATE "Reservation" SET "status" = 'cancelled', "updatedAt" = ? WHERE "id" = ?`,
      new Date().toISOString(),
      body.reservationId
    )

    return NextResponse.json({
      ok: true,
      refunded,
      message: refunded
        ? "Réservation annulée et acompte remboursé."
        : "Réservation annulée. Le remboursement sera traité manuellement si nécessaire.",
    })
  } catch (err) {
    console.error("Garage cancel-reservation error:", err)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
