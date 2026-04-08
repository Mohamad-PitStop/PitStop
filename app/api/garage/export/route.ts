import { NextResponse } from "next/server"
import { requireGaragiste } from "@/lib/garage-auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

type ReservationExportRow = {
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

function escapeCsvField(value: string | number | null | undefined): string {
  if (value == null) return ""
  const str = String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(req: Request) {
  const auth = await requireGaragiste(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })
  const { garageId } = auth

  try {
    const url = new URL(req.url)
    const from = url.searchParams.get("from")
    const to = url.searchParams.get("to")

    let query = `SELECT * FROM "Reservation" WHERE "garageId" = ?`
    const params: string[] = [garageId]

    if (from) {
      query += ` AND "startAt" >= ?`
      params.push(new Date(from).toISOString())
    }
    if (to) {
      query += ` AND "startAt" <= ?`
      params.push(new Date(to).toISOString())
    }

    query += ` ORDER BY "startAt" DESC`

    const reservations = await prisma.$queryRawUnsafe<ReservationExportRow[]>(query, ...params)

    const headers = [
      "ID", "Date création", "Type", "Nom", "Téléphone", "Email",
      "Marque", "Modèle", "Année", "Kilométrage",
      "Début", "Fin", "Statut", "Notes",
    ]

    const csvRows = reservations.map((r) => [
      escapeCsvField(r.id),
      escapeCsvField(r.createdAt),
      escapeCsvField(r.type),
      escapeCsvField(r.name),
      escapeCsvField(r.phone),
      escapeCsvField(r.email),
      escapeCsvField(r.vehicleMarque),
      escapeCsvField(r.vehicleModele),
      escapeCsvField(r.vehicleAnnee),
      escapeCsvField(r.vehicleKm),
      escapeCsvField(r.startAt),
      escapeCsvField(r.endAt),
      escapeCsvField(r.status),
      escapeCsvField(r.notes),
    ].join(","))

    // BOM for UTF-8 Excel compatibility
    const bom = "\uFEFF"
    const csv = bom + headers.join(",") + "\n" + csvRows.join("\n")

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reservations-export.csv"`,
      },
    })
  } catch (err) {
    console.error("Garage export error:", err)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
