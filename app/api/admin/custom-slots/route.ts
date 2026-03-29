import { z } from "zod"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { createCustomSlot, deleteCustomSlot } from "@/lib/custom-slots-db"

export const runtime = "nodejs"

async function requireAdmin(req: Request) {
  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  if (!user || user.role !== "admin") return null
  return user
}

const CreateSchema = z.object({
  startAt: z.string(),
  endAt: z.string(),
  label: z.string().optional(),
})

export async function POST(req: Request) {
  const user = await requireAdmin(req)
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 })

  const body   = await req.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: "Données invalides" }, { status: 400 })

  const slot = await createCustomSlot(
    new Date(parsed.data.startAt),
    new Date(parsed.data.endAt),
    parsed.data.label
  )
  return Response.json({ ok: true, slot })
}

export async function DELETE(req: Request) {
  const user = await requireAdmin(req)
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body?.id) return Response.json({ error: "id manquant" }, { status: 400 })

  await deleteCustomSlot(body.id)
  return Response.json({ ok: true })
}
