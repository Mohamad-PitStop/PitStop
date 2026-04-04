import { NextResponse } from "next/server"
import { z } from "zod"
import {
  getAllAccounts,
  findAccountByEmail,
  setUserRole,
  getAllPendingAssignments,
  upsertPendingAssignment,
  deletePendingAssignment,
  type UserRole,
} from "@/lib/accounts-db"
import { isSameOrigin } from "@/lib/request-security"
import { requireOwnerAdmin } from "@/lib/admin-security"

const VALID_ROLES: UserRole[] = ["tester", "user_friend", "user"]

export async function GET(req: Request) {
  const admin = await requireOwnerAdmin(req)
  if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const url = new URL(req.url)
  const email = url.searchParams.get("email")?.trim().toLowerCase()

  // Search mode: return single user by email
  if (email) {
    const user = await findAccountByEmail(email)
    if (!user) return NextResponse.json({ user: null })
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        diagnosticCredits: user.diagnosticCredits,
        createdAt: (user as any).createdAt ?? null,
      },
    })
  }

  // Default: return stats counts + pending (no full user list)
  const [users, pending] = await Promise.all([getAllAccounts(), getAllPendingAssignments()])
  const counts = {
    admin: users.filter((u) => u.role === "admin").length,
    tester: users.filter((u) => u.role === "tester").length,
    user_friend: users.filter((u) => u.role === "user_friend").length,
    user: users.filter((u) => u.role === "user").length,
  }
  return NextResponse.json({ counts, pending })
}

export async function PATCH(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 })
  const admin = await requireOwnerAdmin(req)
  if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const { userId, role } = body ?? {}

  if (!userId || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Paramètres invalides (rôle admin non modifiable via API)." }, { status: 400 })
  }
  if (userId === admin.id) {
    return NextResponse.json({ error: "Impossible de modifier le rôle du compte admin propriétaire." }, { status: 400 })
  }

  await setUserRole(userId, role as UserRole)
  return NextResponse.json({ ok: true })
}

const PendingAssignmentSchema = z.object({
  email: z.string().trim().email().max(160),
  role: z.enum(["tester", "user_friend", "user"]),
})

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 })
  const admin = await requireOwnerAdmin(req)
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
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 })
  const admin = await requireOwnerAdmin(req)
  if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const { id } = body ?? {}

  if (!id) return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 })

  await deletePendingAssignment(id)
  return NextResponse.json({ ok: true })
}
