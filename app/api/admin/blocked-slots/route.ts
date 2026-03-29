import { z } from "zod"
import { fromZonedTime, toZonedTime } from "date-fns-tz"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { getBlockedSlotsForRange, createBlockedSlot, deleteBlockedSlot } from "@/lib/blocked-slots-db"
import { getCustomSlotsForRange } from "@/lib/custom-slots-db"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs" // db-only

async function requireAdmin(req: Request) {
  const cookieHeader = req.headers.get("cookie")
  const user = await getUserFromAuthCookie(cookieHeader)
  if (!user || user.role !== "admin") return null
  return user
}

// GET ?date=YYYY-MM-DD  →  { blockedSlots, reservations }
export async function GET(req: Request) {
  const user = await requireAdmin(req)
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 })

  const url = new URL(req.url)
  const date = url.searchParams.get("date")
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Paramètre date manquant" }, { status: 400 })
  }

  const timeZone = "Europe/Brussels"
  const dayStart = fromZonedTime(`${date}T00:00:00`, timeZone)
  const dayEnd   = fromZonedTime(`${date}T23:59:59`, timeZone)

  const [blockedSlots, customSlots, reservations] = await Promise.all([
    getBlockedSlotsForRange(dayStart, dayEnd),
    getCustomSlotsForRange(dayStart, dayEnd),
    prisma.$queryRawUnsafe<{ id: string; name: string; startAt: string; endAt: string; status: string }[]>(
      `SELECT "id", "name", "startAt", "endAt", "status" FROM "Reservation"
       WHERE "status" IN ('paid', 'confirmed')
         AND "startAt" < ? AND "endAt" > ?`,
      dayEnd.toISOString(),
      dayStart.toISOString()
    ),
  ])

  return Response.json({ ok: true, blockedSlots, customSlots, reservations })
}

const CreateSchema = z.object({
  startAt: z.string(),
  endAt: z.string(),
  label: z.string().optional(),
})

// POST { startAt, endAt, label? }  →  crée un créneau bloqué
export async function POST(req: Request) {
  const user = await requireAdmin(req)
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: "Données invalides" }, { status: 400 })

  const slot = await createBlockedSlot(
    new Date(parsed.data.startAt),
    new Date(parsed.data.endAt),
    parsed.data.label
  )
  return Response.json({ ok: true, slot })
}

// DELETE { id }  →  supprime un créneau bloqué
export async function DELETE(req: Request) {
  const user = await requireAdmin(req)
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body?.id) return Response.json({ error: "id manquant" }, { status: 400 })

  await deleteBlockedSlot(body.id)
  return Response.json({ ok: true })
}
