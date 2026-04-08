import { NextResponse } from "next/server"
import { requireGaragiste } from "@/lib/garage-auth"
import { prisma } from "@/lib/prisma"
import { listPayoutsForGarage } from "@/lib/deposit-payout-db"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const auth = await requireGaragiste(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })
  const { garageId } = auth

  try {
    // Total confirmed/paid appointments
    const totalRows = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM "Reservation"
       WHERE "garageId" = ? AND "status" IN ('confirmed', 'paid')`,
      garageId
    )
    const totalAppointments = Number(totalRows[0]?.count ?? 0)

    // Cancelled count (for cancellation rate)
    const cancelledRows = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM "Reservation"
       WHERE "garageId" = ? AND "status" = 'cancelled'`,
      garageId
    )
    const cancelledCount = Number(cancelledRows[0]?.count ?? 0)

    // All reservations count (for rate calculation)
    const allRows = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM "Reservation"
       WHERE "garageId" = ?`,
      garageId
    )
    const allCount = Number(allRows[0]?.count ?? 0)
    const cancellationRate = allCount > 0 ? cancelledCount / allCount : 0

    // Revenue from deposit payouts (non-cancelled)
    const payouts = await listPayoutsForGarage(garageId)
    const revenueCents = payouts
      .filter((p) => p.status !== "cancelled")
      .reduce((sum, p) => sum + Number(p.amountCents), 0)

    // Pending payouts (status = pending or ready)
    const pendingPayoutsCount = payouts.filter(
      (p) => p.status === "pending" || p.status === "ready"
    ).length

    return NextResponse.json({
      ok: true,
      totalAppointments,
      revenueCents,
      cancellationRate: Math.round(cancellationRate * 10000) / 100, // percentage with 2 decimals
      pendingPayoutsCount,
    })
  } catch (err) {
    console.error("Dashboard error:", err)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
