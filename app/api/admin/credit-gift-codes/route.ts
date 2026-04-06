import { NextResponse } from "next/server"
import { z } from "zod"
import { isSameOrigin } from "@/lib/request-security"
import { requireOwnerAdmin } from "@/lib/admin-security"
import { createGiftCode, listGiftCodes, setGiftCodeActive } from "@/lib/credit-gift-code-db"

export const runtime = "nodejs"

const CreateSchema = z.object({
  code: z.string().trim().min(4).max(40),
  credits: z.number().int().min(1).max(100),
  maxUses: z.number().int().min(1).max(100_000).nullable().optional(),
  label: z.string().trim().max(120).nullable().optional(),
})

export async function GET(req: Request) {
  const admin = await requireOwnerAdmin(req)
  if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  const codes = await listGiftCodes()
  return NextResponse.json({ ok: true, codes })
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 })
  const admin = await requireOwnerAdmin(req)
  if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const parsed = CreateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Paramètres invalides." }, { status: 400 })
  }

  try {
    const row = await createGiftCode({
      code: parsed.data.code,
      credits: parsed.data.credits,
      maxUses: parsed.data.maxUses ?? null,
      label: parsed.data.label ?? null,
    })
    return NextResponse.json({ ok: true, code: row })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur"
    if (msg.includes("UNIQUE") || msg.includes("unique")) {
      return NextResponse.json({ ok: false, error: "Ce code existe déjà." }, { status: 409 })
    }
    console.error("admin credit-gift-codes POST:", e)
    return NextResponse.json({ ok: false, error: "Impossible de créer le code." }, { status: 500 })
  }
}

const PatchSchema = z.object({
  id: z.string().min(1),
  active: z.boolean(),
})

export async function PATCH(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 })
  const admin = await requireOwnerAdmin(req)
  if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const parsed = PatchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Paramètres invalides." }, { status: 400 })
  }

  await setGiftCodeActive(parsed.data.id, parsed.data.active)
  return NextResponse.json({ ok: true })
}
