import { NextResponse } from "next/server"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { getDiagnosticsByUserId } from "@/lib/diagnostics-db"
import { prisma } from "@/lib/prisma"

type DisputableReservation = {
  id: string
  vehicleMarque: string | null
  vehicleModele: string | null
  startAt: string
}

export async function GET(req: Request) {
  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  if (!user) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 })
  }

  const [diagnostics, disputable] = await Promise.all([
    getDiagnosticsByUserId(user.id, 50),
    prisma.$queryRawUnsafe<DisputableReservation[]>(
      `SELECT r."id", r."vehicleMarque", r."vehicleModele", r."startAt"
       FROM "Reservation" r
       INNER JOIN "DepositPayout" p ON p."reservationId" = r."id"
       WHERE r."userId" = ?
         AND p."status" = 'transferred'`,
      user.id
    ).catch(() => [] as DisputableReservation[]),
  ])

  // Associe à chaque diagnostic une réservation "disputable" plausible :
  // même marque/modèle, RDV le plus proche (après) de la date du diagnostic.
  const enriched = diagnostics.map((d) => {
    const diagTime = new Date(d.createdAt).getTime()
    const matches = disputable
      .filter(
        (r) =>
          (r.vehicleMarque ?? "").toLowerCase() === (d.marque ?? "").toLowerCase() &&
          (r.vehicleModele ?? "").toLowerCase() === (d.modele ?? "").toLowerCase()
      )
      .sort(
        (a, b) =>
          Math.abs(new Date(a.startAt).getTime() - diagTime) -
          Math.abs(new Date(b.startAt).getTime() - diagTime)
      )
    return { ...d, disputableReservationId: matches[0]?.id ?? null }
  })

  return NextResponse.json({ diagnostics: enriched })
}
