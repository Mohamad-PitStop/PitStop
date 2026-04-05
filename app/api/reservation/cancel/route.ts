import { z } from "zod"
import { getStripe } from "@/lib/stripe"
import {
  findReservationByCancelToken,
  markReservationCancelled,
  getCancelWindow,
} from "@/lib/reservation-db"
import { deleteCalendarEvent } from "@/lib/google-calendar"
import nodemailer from "nodemailer"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export const runtime = "nodejs"

const BodySchema = z.object({
  cancelToken: z.string().min(10),
})

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: (process.env.SMTP_PASS ?? "").replace(/\s/g, ""),
    },
  })
}

function formatDate(iso: string, tz: string) {
  try {
    const d = new Date(iso)
    return format(d, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })
  } catch {
    return iso
  }
}

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json())
    const reservation = await findReservationByCancelToken(body.cancelToken)

    if (!reservation) {
      return Response.json({ ok: false, error: "Réservation introuvable." }, { status: 404 })
    }

    if (reservation.status === "cancelled") {
      return Response.json({ ok: false, error: "Cette réservation est déjà annulée." }, { status: 409 })
    }

    const startAt = new Date(reservation.startAt)
    const window = getCancelWindow(startAt)
    const dateLabel = formatDate(reservation.startAt, reservation.timeZone)

    if (window === "contact_garage") {
      return Response.json({
        ok: false,
        window: "contact_garage",
        error:
          "L'annulation en ligne n'est plus disponible (moins de 12h avant le rendez-vous). Veuillez contacter directement le garage.",
        garagePhone: process.env.GARAGE_PHONE ?? null,
        garageEmail: process.env.GARAGE_EMAIL ?? process.env.SMTP_USER ?? null,
      }, { status: 422 })
    }

    if (window === "too_late") {
      return Response.json({
        ok: false,
        window: "too_late",
        error:
          "L'annulation n'est plus possible (moins d'1h avant le rendez-vous). L'acompte est conservé conformément aux CGV.",
      }, { status: 422 })
    }

    // ── window === "allowed" : annulation + remboursement Stripe ────────────
    let refunded = false
    const stripe = getStripe()

    try {
      if (reservation.stripePaymentIntentId) {
        await stripe.refunds.create({ payment_intent: reservation.stripePaymentIntentId })
        refunded = true
      } else if (reservation.stripeSessionId) {
        const session = await stripe.checkout.sessions.retrieve(reservation.stripeSessionId)
        if (session.payment_intent && typeof session.payment_intent === "string") {
          await stripe.refunds.create({ payment_intent: session.payment_intent })
          refunded = true
        }
      }
    } catch (stripeErr) {
      console.error("Stripe refund error:", stripeErr)
      // On continue quand même pour marquer cancelled : le remboursement peut être fait manuellement
    }

    if (reservation.calendarId && reservation.calendarEventId) {
      try {
        await deleteCalendarEvent({
          calendarId: reservation.calendarId,
          eventId: reservation.calendarEventId,
        })
      } catch (calErr) {
        console.error("Google Calendar delete error:", calErr)
      }
    }

    await markReservationCancelled(reservation.id)

    // ── Emails ───────────────────────────────────────────────────────────────
    try {
      const transporter = getTransporter()
      const siteName = "PitStop"

      // Email client
      if (reservation.email) {
        await transporter.sendMail({
          from: `"${siteName}" <${process.env.SMTP_USER}>`,
          to: reservation.email,
          subject: `${siteName} : confirmation d'annulation de votre rendez-vous`,
          html: `
            <p>Bonjour ${reservation.name},</p>
            <p>Votre rendez-vous du <strong>${dateLabel}</strong> a bien été annulé.</p>
            ${refunded
              ? `<p>Votre acompte de <strong>25 EUR</strong> vous sera remboursé sous 5 à 10 jours ouvrés sur votre moyen de paiement d'origine.</p>`
              : `<p>Le remboursement de l'acompte sera traité manuellement. Contactez-nous à <a href="mailto:pitstopbelgique@gmail.com">pitstopbelgique@gmail.com</a> en cas de question.</p>`
            }
            <p>À bientôt sur PitStop.</p>
          `,
        })
      }

      // Email garage/admin
      const garageEmail = process.env.GARAGE_EMAIL ?? process.env.PARTNER_CONTACT_TO ?? process.env.SMTP_USER
      if (garageEmail) {
        await transporter.sendMail({
          from: `"${siteName}" <${process.env.SMTP_USER}>`,
          to: garageEmail,
          subject: `${siteName} : annulation de réservation (${dateLabel})`,
          html: `
            <p>Un rendez-vous a été annulé en ligne.</p>
            <ul>
              <li>Client : ${reservation.name} (${reservation.phone}${reservation.email ? ` / ${reservation.email}` : ""})</li>
              <li>Date : ${dateLabel}</li>
              <li>Type : ${reservation.type}</li>
              <li>Remboursement Stripe : ${refunded ? "effectué" : "à traiter manuellement"}</li>
            </ul>
          `,
        })
      }
    } catch (mailErr) {
      console.error("Email error:", mailErr)
      // Annulation déjà enregistrée, on ne bloque pas
    }

    return Response.json({
      ok: true,
      refunded,
      message: refunded
        ? "Votre rendez-vous a été annulé et votre acompte sera remboursé sous 5 à 10 jours ouvrés."
        : "Votre rendez-vous a été annulé. Le remboursement sera traité manuellement.",
    })
  } catch (err) {
    console.error("Cancel reservation error:", err)
    return Response.json({ ok: false, error: "Erreur lors de l'annulation." }, { status: 500 })
  }
}
