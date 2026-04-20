import { NextResponse } from "next/server"
import { requireGaragiste } from "@/lib/garage-auth"
import { prisma } from "@/lib/prisma"
import { listPayoutsForGarage } from "@/lib/deposit-payout-db"
import { findGarageById } from "@/lib/garage-db"
import { listHoursRequestsForGarage } from "@/lib/garage-hours-db"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const auth = await requireGaragiste(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })
  const { user, garageId } = auth

  try {
    const totalRows = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM "Reservation"
       WHERE "garageId" = ? AND "status" IN ('confirmed', 'paid')`,
      garageId
    )
    const totalAppointments = Number(totalRows[0]?.count ?? 0)

    const cancelledRows = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM "Reservation"
       WHERE "garageId" = ? AND "status" = 'cancelled'`,
      garageId
    )
    const cancelledCount = Number(cancelledRows[0]?.count ?? 0)

    const allRows = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM "Reservation"
       WHERE "garageId" = ?`,
      garageId
    )
    const allCount = Number(allRows[0]?.count ?? 0)
    const cancellationRate = allCount > 0 ? cancelledCount / allCount : 0

    const [payouts, garage, hoursRequests] = await Promise.all([
      listPayoutsForGarage(garageId),
      findGarageById(garageId),
      listHoursRequestsForGarage(garageId),
    ])
    const revenueCents = payouts
      .filter((p) => p.status !== "cancelled")
      .reduce((sum, p) => sum + Number(p.amountCents), 0)

    const pendingPayoutsCount = payouts.filter(
      (p) => p.status === "pending" || p.status === "ready"
    ).length

    const pendingHoursChange = hoursRequests.find((r) => r.status === "pending") ?? null

    return NextResponse.json({
      ok: true,
      stats: {
        totalAppointments,
        revenue: revenueCents,
        cancellationRate,
        pendingPayouts: pendingPayoutsCount,
      },
      garage: garage
        ? {
            id: garage.id,
            companyName: garage.companyName,
            garageCode: garage.garageCode,
            businessHours: garage.businessHours,
            status: garage.status,
            managerUserId: garage.managerUserId,
          }
        : null,
      isOwner: garage ? garage.managerUserId === user.id : false,
      pendingHoursChange: pendingHoursChange
        ? {
            id: pendingHoursChange.id,
            createdAt: pendingHoursChange.createdAt,
            proposedHours: pendingHoursChange.proposedHours,
          }
        : null,
    })
  } catch (err) {
    console.error("Dashboard error:", err)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
