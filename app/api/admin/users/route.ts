import { NextResponse } from "next/server"
import { z } from "zod"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import {
  getAllAccounts,
  setUserRole,
  getAllPendingAssignments,
  upsertPendingAssignment,
  deletePendingAssignment,
  type UserRole,
} from "@/lib/accounts-db"

const VALID_ROLES: UserRole[] = ["admin", "tester", "user_friend", "user"]

async function requireAdmin(req: Request) {
  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  if (!user || user.role !== "admin") return null
  return user
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const [users, pending] = await Promise.all([getAllAccounts(), getAllPendingAssignments()])
  return NextResponse.json({ users, pending })
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const { userId, role } = body ?? {}

  if (!userId || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 })
  }
  if (userId === admin.id && role !== "admin") {
    return NextResponse.json({ error: "Impossible de modifier son propre rôle." }, { status: 400 })
  }

  await setUserRole(userId, role as UserRole)
  return NextResponse.json({ ok: true })
}

const PendingAssignmentSchema = z.object({
  email: z.string().trim().email().max(160),
  role: z.enum(["tester", "user_friend", "user"]),
})

export async function POST(req: Request) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = PendingAssignmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 })
  }

  await upsertPendingAssignment(parsed.data.email.toLowerCase(), parsed.data.role as UserRole)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const { id } = body ?? {}

  if (!id) return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 })

  await deletePendingAssignment(id)
  return NextResponse.json({ ok: true })
}
