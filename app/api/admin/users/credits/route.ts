import { NextResponse } from "next/server"
import { z } from "zod"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { addCredits, findAccountByEmail, getUserCredits } from "@/lib/accounts-db"

const BodySchema = z.object({
  email: z.string().trim().email().max(160),
  credits: z.number().int().positive().max(10000),
})

async function requireAdmin(req: Request) {
  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  if (!user || user.role !== "admin") return null
  return user
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Paramètres invalides" }, { status: 400 })
  }

  const email = parsed.data.email.toLowerCase()
  const account = await findAccountByEmail(email)
  if (!account) {
    return NextResponse.json({ ok: false, error: "Aucun compte trouvé pour cet e-mail." }, { status: 404 })
  }

  await addCredits(account.id, parsed.data.credits)
  const newBalance = await getUserCredits(account.id)

  return NextResponse.json({
    ok: true,
    user: {
      id: account.id,
      name: account.name,
      email: account.email,
      newBalance,
    },
    addedCredits: parsed.data.credits,
  })
}

