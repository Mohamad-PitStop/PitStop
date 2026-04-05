import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"

export const runtime = "nodejs"

const QuerySchema = z.object({
  session_id: z.string().min(5).optional(),
  payment_intent: z.string().min(10).optional(),
}).refine((d) => d.session_id ?? d.payment_intent, { message: "session_id ou payment_intent requis" })

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const parsed = QuerySchema.safeParse({
      session_id: url.searchParams.get("session_id") ?? undefined,
      payment_intent: url.searchParams.get("payment_intent") ?? undefined,
    })
    if (!parsed.success) {
      return Response.json({ ok: false, error: "session_id ou payment_intent requis." }, { status: 400 })
    }
    const { session_id, payment_intent } = parsed.data

    const stripe = getStripe()
    let reservationId: string | null = null
    let paymentInfo: {
      sessionId?: string
      status?: string
      paymentStatus?: string
      paymentIntentId?: string
      depositAmountCents?: number
      priceMinEuros?: number
      priceMaxEuros?: number
    } = {}

    if (session_id) {
      const session = await stripe.checkout.sessions.retrieve(session_id)
      reservationId = session.metadata?.reservationId ?? null
      const meta = session.metadata ?? {}
      paymentInfo = {
        sessionId: session.id,
        status: session.status ?? undefined,
        paymentStatus: session.payment_status ?? undefined,
        depositAmountCents: meta.depositAmountCents ? Number(meta.depositAmountCents) : undefined,
        priceMinEuros: meta.priceMinEuros ? Number(meta.priceMinEuros) : undefined,
        priceMaxEuros: meta.priceMaxEuros ? Number(meta.priceMaxEuros) : undefined,
      }
    } else if (payment_intent) {
      const pi = await stripe.paymentIntents.retrieve(payment_intent)
      reservationId = pi.metadata?.reservationId ?? null
      const meta = pi.metadata ?? {}
      paymentInfo = {
        paymentIntentId: pi.id,
        paymentStatus: pi.status,
        depositAmountCents: meta.depositAmountCents ? Number(meta.depositAmountCents) : undefined,
        priceMinEuros: meta.priceMinEuros ? Number(meta.priceMinEuros) : undefined,
        priceMaxEuros: meta.priceMaxEuros ? Number(meta.priceMaxEuros) : undefined,
      }
    }

    if (!reservationId) {
      return Response.json({ ok: false, error: "Réservation introuvable." }, { status: 404 })
    }

    const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } })
    if (!reservation) {
      return Response.json({ ok: false, error: "Réservation introuvable." }, { status: 404 })
    }

    return Response.json({
      ok: true,
      reservation: {
        id: reservation.id,
        type: reservation.type,
        status: reservation.status,
        startAt: reservation.startAt.toISOString(),
        endAt: reservation.endAt.toISOString(),
        timeZone: reservation.timeZone,
        name: reservation.name,
        phone: reservation.phone,
        email: reservation.email,
        cancelToken: reservation.cancelToken ?? null,
      },
      payment: paymentInfo,
    })
  } catch (error) {
    console.error("Erreur reservation status:", error)
    return Response.json({ ok: false, error: "Erreur lors de la récupération de la réservation." }, { status: 400 })
  }
}

