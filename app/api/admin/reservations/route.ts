import { z } from "zod"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const MoveSchema = z.object({
  id:      z.string(),
  startAt: z.string(),
  endAt:   z.string(),
})

export async function PATCH(req: Request) {
  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  if (!user || user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 })

  const body   = await req.json().catch(() => null)
  const parsed = MoveSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: "Données invalides" }, { status: 400 })

  await prisma.$executeRawUnsafe(
    `UPDATE "Reservation" SET "startAt" = ?, "endAt" = ?, "updatedAt" = ? WHERE "id" = ?`,
    new Date(parsed.data.startAt).toISOString(),
    new Date(parsed.data.endAt).toISOString(),
    new Date().toISOString(),
    parsed.data.id
  )

  return Response.json({ ok: true })
}
