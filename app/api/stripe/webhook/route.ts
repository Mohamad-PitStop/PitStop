import { headers } from "next/headers"
import Stripe from "stripe"
import { prisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"
import { createCalendarEvent, getBusyIntervals } from "@/lib/google-calendar"
import { addCredits } from "@/lib/accounts-db"
import { registerPaidGuestSession } from "@/lib/guest-credits-db"

export const runtime = "nodejs"

async function ensureWebhookEventTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "StripeWebhookEvent" (
      "id" TEXT PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "type" TEXT NOT NULL
    )
  `)
}

async function markWebhookEventAsNew(eventId: string, eventType: string): Promise<boolean> {
  await ensureWebhookEventTable()
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "StripeWebhookEvent" ("id", "type") VALUES (?, ?)`,
      eventId,
      eventType
    )
    return true
  } catch {
    // id déjà vu => retry/replay, ignorer
    return false
  }
}

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET manquant")
  return secret
}

function reservationSummary(type: string) {
  if (type === "obd-scan") return "PitStop - Scan OBD (garage partenaire)"
  return `PitStop - Rendez-vous (${type})`
}

async function confirmReservationAfterPayment(
  reservationId: string,
  stripeUpdate: { stripeSessionId?: string; stripePaymentIntentId?: string }
) {
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } })
  if (!reservation) throw new Error("Réservation introuvable.")

  if (reservation.status === "confirmed" && reservation.calendarEventId) return

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: { status: "paid", ...stripeUpdate },
  })

  const calendarId = reservation.calendarId
  if (!calendarId) {
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        status: "confirmed",
        notes: "Paiement confirmé. Synchronisation Google Calendar non configurée.",
      },
    })
    return
  }

  if (!reservation.calendarEventId) {
    const busyNow = await getBusyIntervals({
      calendarId,
      timeMin: reservation.startAt.toISOString(),
      timeMax: reservation.endAt.toISOString(),
    })
    if (busyNow.length > 0) {
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: {
          status: "paid",
          notes:
            "Paiement reçu mais conflit de créneau détecté lors de la confirmation. Contacter le client pour reprogrammer.",
        },
      })
      return
    }

    const descriptionLines = [
      `Nom: ${reservation.name}`,
      `Téléphone: ${reservation.phone}`,
      reservation.email ? `Email: ${reservation.email}` : undefined,
      reservation.vehicleMarque ? `Véhicule: ${reservation.vehicleMarque} ${reservation.vehicleModele ?? ""}`.trim() : undefined,
      reservation.vehicleAnnee ? `Année: ${reservation.vehicleAnnee}` : undefined,
      reservation.vehicleKm != null ? `Km: ${reservation.vehicleKm}` : undefined,
      `Type: ${reservation.type}`,
      `Réservation: ${reservation.id}`,
    ].filter(Boolean)

    const { eventId } = await createCalendarEvent({
      calendarId,
      summary: reservationSummary(reservation.type),
      description: descriptionLines.join("\n"),
      startAtIso: reservation.startAt.toISOString(),
      endAtIso: reservation.endAt.toISOString(),
      timeZone: reservation.timeZone,
    })

    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { calendarEventId: eventId, status: "confirmed" },
    })
  } else {
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: "confirmed" },
    })
  }
}

export async function POST(req: Request) {
  const stripe = getStripe()
  const sig = (await headers()).get("stripe-signature")
  if (!sig) return Response.json({ ok: false, error: "Signature Stripe manquante" }, { status: 400 })

  const secret = getWebhookSecret()

  let event: Stripe.Event
  try {
    const rawBody = await req.text()
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (err) {
    console.error("Webhook Stripe invalide:", err)
    return Response.json({ ok: false }, { status: 400 })
  }

  try {
    const isNewEvent = await markWebhookEventAsNew(event.id, event.type)
    if (!isNewEvent) {
      return Response.json({ ok: true, duplicate: true })
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      const intent = session.metadata?.intent

      if (intent === "credit_purchase") {
        // Achat de crédits par un utilisateur connecté
        const userId = session.metadata?.userId
        const credits = parseInt(session.metadata?.credits ?? "0", 10)
        if (userId && credits > 0) {
          await addCredits(userId, credits)
        }
      } else if (intent === "guest_diagnostic") {
        // Paiement d'un diagnostic invité — enregistrement préventif en DB
        await registerPaidGuestSession(session.id)
      } else {
        // Flux réservation existant
        const reservationId = session.metadata?.reservationId
        if (!reservationId) throw new Error("reservationId manquant dans metadata Stripe.")

        const paymentIntentId =
          typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id

        await confirmReservationAfterPayment(reservationId, {
          stripeSessionId: session.id,
          stripePaymentIntentId: paymentIntentId ?? undefined,
        })
      }
    } else if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const intent = paymentIntent.metadata?.intent

      if (intent === "credit_purchase") {
        const userId = paymentIntent.metadata?.userId
        const credits = parseInt(paymentIntent.metadata?.credits ?? "0", 10)
        if (userId && credits > 0) {
          await addCredits(userId, credits)
        }
      } else if (intent === "guest_diagnostic") {
        await registerPaidGuestSession(paymentIntent.id)
      } else {
        // Flux réservation existant
        const reservationId = paymentIntent.metadata?.reservationId
        if (!reservationId) throw new Error("reservationId manquant dans metadata PaymentIntent.")

        await confirmReservationAfterPayment(reservationId, {
          stripePaymentIntentId: paymentIntent.id,
        })
      }
    }

    return Response.json({ ok: true })
  } catch (error) {
    console.error("Erreur traitement webhook:", error)
    return Response.json({ ok: false }, { status: 500 })
  }
}

