import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getStripe, getDepositAmountCents } from "@/lib/stripe"
import { getBusyIntervals, getCalendarIdIfConfigured } from "@/lib/google-calendar"
import {
  findPromoCodeByCode,
  hasIpUsedPromo,
  hasUserUsedPromo,
  recordPromoUsage,
  applyPromoDiscount,
} from "@/lib/promo-db"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { getClientIp } from "@/lib/rate-limit"
import { generateCancelToken, ensureReservationMigrations } from "@/lib/reservation-db"
import { ensureGarageTables, findGarageById } from "@/lib/garage-db"
import { createDepositPayout } from "@/lib/deposit-payout-db"
import { isGarageSlotBookable } from "@/lib/garage-availability"

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
  promoCode: z.string().trim().optional().nullable(),
  garageId: z.string().optional().nullable(),
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
    let amount = getDepositAmountCents(body.priceMin)

    const calendarId = getCalendarIdIfConfigured()
    if (body.garageId) {
      await ensureGarageTables()
      const garage = await findGarageById(body.garageId)
      if (!garage || garage.status !== "approved") {
        return Response.json({ ok: false, error: "Garage invalide ou non disponible." }, { status: 400 })
      }
      const slotOk = await isGarageSlotBookable(body.garageId, body.startAt, body.endAt)
      if (!slotOk) {
        return Response.json(
          { ok: false, error: "Ce créneau n'est plus disponible. Merci d'en choisir un autre." },
          { status: 409 }
        )
      }
    } else if (calendarId) {
      const ok = await isSlotFree({ calendarId, startAt: body.startAt, endAt: body.endAt })
      if (!ok) {
        return Response.json(
          { ok: false, error: "Ce créneau n'est plus disponible. Merci d'en choisir un autre." },
          { status: 409 }
        )
      }
    }

    const ip = getClientIp(req)
    const user = await getUserFromAuthCookie(req.headers.get("cookie"))
    let promoId: string | null = null

    if (body.promoCode) {
      const promo = await findPromoCodeByCode(body.promoCode)
      if (!promo || !promo.active || (promo.maxUses != null && promo.usedCount >= promo.maxUses)) {
        return Response.json({ ok: false, error: "Code promo invalide ou expiré." }, { status: 400 })
      }
      if (await hasIpUsedPromo(promo.id, ip)) {
        return Response.json({ ok: false, error: "Vous avez déjà utilisé ce code promo." }, { status: 400 })
      }
      if (user && (await hasUserUsedPromo(promo.id, user.id))) {
        return Response.json({ ok: false, error: "Vous avez déjà utilisé ce code promo." }, { status: 400 })
      }
      amount = applyPromoDiscount(amount, promo)
      promoId = promo.id
    }

    await ensureReservationMigrations()
    if (body.garageId) await ensureGarageTables()
    const cancelToken = generateCancelToken()

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
        calendarId: body.garageId ? undefined : calendarId ?? undefined,
        cancelToken,
        userId: user?.id ?? undefined,
        garageId: body.garageId ?? undefined,
      },
    })

    if (body.garageId) {
      await createDepositPayout(body.garageId, reservation.id, amount)
    }

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
        ...(promoId ? { promoId } : {}),
      },
    })

    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    })

    if (!paymentIntent.client_secret) {
      throw new Error("Stripe n'a pas renvoyé de client_secret")
    }

    // Record promo usage immediately
    if (promoId) {
      await recordPromoUsage({
        promoCodeId: promoId,
        ip,
        userId: user?.id ?? null,
        context: "booking",
      })
    }

    return Response.json({
      ok: true,
      clientSecret: paymentIntent.client_secret,
      reservationId: reservation.id,
      cancelToken,
    })
  } catch (error) {
    console.error("Erreur create-payment-intent:", error)
    return Response.json(
      { ok: false, error: "Erreur lors de la création du paiement" },
      { status: 400 }
    )
  }
}
