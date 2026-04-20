import { NextResponse } from "next/server"
import { requireGaragiste } from "@/lib/garage-auth"
import { prisma } from "@/lib/prisma"
import { getPayoutByReservation } from "@/lib/deposit-payout-db"
import { findGarageById } from "@/lib/garage-db"

export const runtime = "nodejs"

type ReservationRow = {
  id: string
  createdAt: string
  type: string
  name: string
  phone: string
  email: string | null
  vehicleMarque: string | null
  vehicleModele: string | null
  vehicleAnnee: number | null
  vehicleKm: number | null
  startAt: string
  endAt: string
  status: string
  notes: string | null
}

export async function GET(req: Request) {
  const auth = await requireGaragiste(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })
  const { user, garageId } = auth
  const garage = await findGarageById(garageId)
  const isOwner = garage ? garage.managerUserId === user.id : false

  try {
    const url = new URL(req.url)
    const status = url.searchParams.get("status")
    const from = url.searchParams.get("from")
    const to = url.searchParams.get("to")

    let query = `SELECT * FROM "Reservation" WHERE "garageId" = ?`
    const params: (string | Date)[] = [garageId]

    if (status) {
      query += ` AND "status" = ?`
      params.push(status)
    }
    if (from) {
      query += ` AND "startAt" >= ?`
      params.push(new Date(from).toISOString())
    }
    if (to) {
      query += ` AND "startAt" <= ?`
      params.push(new Date(to).toISOString())
    }

    query += ` ORDER BY "startAt" DESC`

    const reservations = await prisma.$queryRawUnsafe<ReservationRow[]>(query, ...params)

    // Attach payout info to each reservation (owner only)
    const enriched = await Promise.all(
      reservations.map(async (r) => {
        if (!isOwner) {
          return { ...r, payoutStatus: null, payoutAmountCents: null }
        }
        const payout = await getPayoutByReservation(r.id)
        return {
          ...r,
          payoutStatus: payout ? payout.status : null,
          payoutAmountCents: payout ? payout.amountCents : null,
        }
      })
    )

    return NextResponse.json({ ok: true, reservations: enriched })
  } catch (err) {
    console.error("Garage reservations error:", err)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
