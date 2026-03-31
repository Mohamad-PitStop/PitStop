import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getStripe, getDepositAmountCents, getSiteUrl } from "@/lib/stripe"
import { getBusyIntervals, getCalendarIdIfConfigured } from "@/lib/google-calendar"

export const runtime = "nodejs"

const BodySchema = z.object({
  type: z.string().default("obd-scan"),
  name: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }),
  timeZone: z.string().default("Europe/Brussels"),
  priceMin: z.number().positive().optional(),
  vehicle: z
    .object({
      marque: z.string().optional(),
      modele: z.string().optional(),
      annee: z.number().int().optional(),
      km: z.number().int().optional(),
    })
    .optional(),
})

async function isSlotFree({
  calendarId,
  startAt,
  endAt,
}: {
  calendarId: string
  startAt: string
  endAt: string
}) {
  const busy = await getBusyIntervals({
    calendarId,
    timeMin: startAt,
    timeMax: endAt,
  })
  return busy.length === 0
}

export async function POST(req: Request) {
  try {
    const stripe = getStripe()
    const siteUrl = getSiteUrl()
    const body = BodySchema.parse(await req.json())
    const amount = getDepositAmountCents(body.priceMin)

    const calendarId = getCalendarIdIfConfigured()
    if (calendarId) {
      const ok = await isSlotFree({ calendarId, startAt: body.startAt, endAt: body.endAt })
      if (!ok) {
        return Response.json(
          { ok: false, error: "Ce créneau n’est plus disponible. Merci d’en choisir un autre." },
          { status: 409 }
        )
      }
    }

    const reservation = await prisma.reservation.create({
      data: {
        type: body.type,
        name: body.name,
        phone: body.phone,
        email: body.email,
        startAt: new Date(body.startAt),
        endAt: new Date(body.endAt),
        timeZone: body.timeZone,
        vehicleMarque: body.vehicle?.marque,
        vehicleModele: body.vehicle?.modele,
        vehicleAnnee: body.vehicle?.annee,
        vehicleKm: body.vehicle?.km,
        status: "pending",
        calendarId: calendarId ?? undefined,
      },
    })

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${siteUrl}/rendez-vous/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/rendez-vous?cancelled=1`,
      customer_email: body.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: amount,
            product_data: {
              name: "Acompte de réservation",
              description: "Réservation d’un créneau au garage partenaire.",
            },
          },
        },
      ],
      metadata: {
        reservationId: reservation.id,
        type: body.type,
        startAt: body.startAt,
        endAt: body.endAt,
        timeZone: body.timeZone,
      },
    })

    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { stripeSessionId: session.id },
    })

    return Response.json({ ok: true, url: session.url })
  } catch (error) {
    console.error("Erreur stripe checkout:", error)
    return Response.json({ ok: false, error: "Erreur lors de la création du paiement" }, { status: 400 })
  }
}

