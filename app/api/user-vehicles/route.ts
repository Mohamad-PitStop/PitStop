import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import {
  getUserVehicles,
  countUserVehicles,
  createUserVehicle,
  updateUserVehicle,
  deleteUserVehicle,
} from "@/lib/user-vehicle-db"

export async function GET(req: NextRequest) {
  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const vehicles = await getUserVehicles(user.id)
  return NextResponse.json({ vehicles })
}

const createSchema = z.object({
  nickname: z.string().max(50).optional(),
  marque: z.string().min(1).max(100),
  modele: z.string().min(1).max(100),
  variante: z.string().max(100).optional(),
  carburant: z.string().max(50).optional(),
  transmission: z.string().max(100).optional(),
  annee: z.string().max(10).optional(),
  kilometrage: z.string().max(20).optional(),
  cylindree: z.string().max(80).optional(),
  puissance: z.string().max(20).optional(),
  nombrePortes: z.string().max(5).optional(),
  typeCarrosserie: z.string().max(80).optional(),
  typeBoiteAuto: z.string().max(100).optional(),
})

export async function POST(req: NextRequest) {
  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const count = await countUserVehicles(user.id)
  if (count >= 3) {
    return NextResponse.json({ error: "max_vehicles_reached" }, { status: 422 })
  }

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_data", details: parsed.error.flatten() }, { status: 400 })
  }

  const vehicle = await createUserVehicle(user.id, parsed.data)
  return NextResponse.json({ vehicle }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const vehicleId = searchParams.get("id")
  if (!vehicleId) return NextResponse.json({ error: "missing_id" }, { status: 400 })

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_data", details: parsed.error.flatten() }, { status: 400 })
  }

  const vehicle = await updateUserVehicle(user.id, vehicleId, parsed.data)
  if (!vehicle) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json({ vehicle })
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const vehicleId = searchParams.get("id")
  if (!vehicleId) return NextResponse.json({ error: "missing_id" }, { status: 400 })

  await deleteUserVehicle(user.id, vehicleId)
  return NextResponse.json({ ok: true })
}
