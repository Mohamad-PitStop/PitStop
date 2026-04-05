import { prisma } from "@/lib/prisma"
import {
  findReservationByCancelToken,
  getCancelWindow,
  ensureReservationMigrations,
} from "@/lib/reservation-db"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get("token") ?? ""
    if (!token) {
      return Response.json({ ok: false, error: "Token manquant." }, { status: 400 })
    }

    await ensureReservationMigrations()
    const reservation = await findReservationByCancelToken(token)
    if (!reservation) {
      return Response.json({ ok: false, error: "Réservation introuvable." }, { status: 404 })
    }

    const startAt = new Date(reservation.startAt)
    const cancelWindow = getCancelWindow(startAt)

    let dateLabel = ""
    try {
      dateLabel = format(startAt, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })
    } catch {
      dateLabel = reservation.startAt
    }

    return Response.json({
      ok: true,
      window: cancelWindow,
      garagePhone: process.env.GARAGE_PHONE ?? null,
      garageEmail: process.env.GARAGE_EMAIL ?? process.env.PARTNER_CONTACT_TO ?? null,
      reservation: {
        id: reservation.id,
        status: reservation.status,
        dateLabel,
        type: reservation.type,
        name: reservation.name,
      },
    })
  } catch (err) {
    console.error("status-by-token error:", err)
    return Response.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
