import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getStripe, getDepositAmountCents } from "@/lib/stripe"
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
  priceMax: z.number().positive().optional(),
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
    const body = BodySchema.parse(await req.json())
    const amount = getDepositAmountCents(body.priceMin)

    const calendarId = getCalendarIdIfConfigured()
    if (calendarId) {
      const ok = await isSlotFree({ calendarId, startAt: body.startAt, endAt: body.endAt })
      if (!ok) {
        return Response.json(
          { ok: false, error: "Ce créneau n'est plus disponible. Merci d'en choisir un autre." },
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

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      metadata: {
        reservationId: reservation.id,
        type: body.type,
        startAt: body.startAt,
        endAt: body.endAt,
        timeZone: body.timeZone,
        depositAmountCents: String(amount),
        ...(body.priceMin != null ? { priceMinEuros: String(body.priceMin) } : {}),
        ...(body.priceMax != null ? { priceMaxEuros: String(body.priceMax) } : {}),
      },
    })

    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    })

    if (!paymentIntent.client_secret) {
      throw new Error("Stripe n'a pas renvoyé de client_secret")
    }

    return Response.json({
      ok: true,
      clientSecret: paymentIntent.client_secret,
      reservationId: reservation.id,
    })
  } catch (error) {
    console.error("Erreur create-payment-intent:", error)
    return Response.json(
      { ok: false, error: "Erreur lors de la création du paiement" },
      { status: 400 }
    )
  }
}
