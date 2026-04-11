import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ensureGarageReviewTable, markReviewEmailSent } from "@/lib/garage-review-db"
import { sendRatingRequestEmail } from "@/lib/email-rating-request"

export const runtime = "nodejs"

type ReviewRow = {
  id: string
  token: string
  garageId: string
  reservationId: string
  email: string
  name: string
  type: string
  startAt: string
  endAt: string
  timeZone: string
  resGarageId: string
}

/**
 * Cron déclenché par Vercel (voir vercel.json).
 * Envoie les e-mails de demande d'avis pour les réservations terminées
 * depuis plus de 48 h pour lesquelles aucun e-mail n'a encore été envoyé.
 * Protégé par CRON_SECRET.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    await ensureGarageReviewTable()

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || ""

    const reviews = await prisma.$queryRawUnsafe<ReviewRow[]>(`
      SELECT gr.id, gr.token, gr.garageId,
             r.id AS reservationId, r.email, r.name, r.type,
             r.startAt, r.endAt, r.timeZone, r.garageId AS resGarageId
      FROM "GarageReview" gr
      JOIN "Reservation" r ON r.id = gr.reservationId
      WHERE gr.emailSentAt IS NULL
        AND r.email IS NOT NULL
        AND r.status = 'confirmed'
        AND datetime(r.endAt) <= datetime('now', '-48 hours')
        AND gr.reservationId NOT IN (SELECT reservationId FROM "ReviewEmailSent")
    `)

    let sent = 0

    for (const review of reviews) {
      await sendRatingRequestEmail({
        to: review.email,
        name: review.name,
        type: review.type,
        startAt: new Date(review.startAt),
        timeZone: review.timeZone || "Europe/Brussels",
        token: review.token,
        baseUrl,
      })

      await markReviewEmailSent(review.reservationId, review.id)
      sent++
    }

    console.log(`[cron] send-rating-emails: ${sent} e-mail(s) envoyé(s).`)
    return NextResponse.json({ ok: true, sent })
  } catch (error) {
    console.error("[cron] send-rating-emails: erreur", error)
    return NextResponse.json(
      { ok: false, error: "Erreur lors de l'envoi des e-mails d'avis." },
      { status: 500 }
    )
  }
}
