import { NextResponse } from "next/server"
import { z } from "zod"
import {
  createPromoCode,
  getAllPromoCodesForAdmin,
  setPromoCodeActive,
  type DiscountType,
} from "@/lib/promo-db"
import { requireOwnerAdmin } from "@/lib/admin-security"
import { isSameOrigin } from "@/lib/request-security"

export const runtime = "nodejs"

const CreateSchema = z.object({
  code: z
    .string()
    .regex(/^[A-Za-z]+[0-9]{2}$/, "Format : lettres + 2 chiffres (ex: PITSTOP25)"),
  discountType: z.enum(["percent", "fixed_cents"]),
  discountValue: z.number().int().positive(),
  maxUses: z.number().int().positive().optional().nullable(),
})

export async function GET(req: Request) {
  const admin = await requireOwnerAdmin(req)
  if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  const codes = await getAllPromoCodesForAdmin()
  return NextResponse.json({ codes })
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 })
  const admin = await requireOwnerAdmin(req)
  if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Paramètres invalides" },
      { status: 400 }
    )
  }

  const { code, discountType, discountValue, maxUses } = parsed.data
  if (discountType === "percent" && (discountValue < 1 || discountValue > 100)) {
    return NextResponse.json({ error: "Le pourcentage doit être entre 1 et 100." }, { status: 400 })
  }

  try {
    const promo = await createPromoCode({
      code: code.toUpperCase(),
      discountType: discountType as DiscountType,
      discountValue,
      maxUses,
    })
    return NextResponse.json({ ok: true, code: promo })
  } catch (error: any) {
    if (String(error?.message).includes("UNIQUE")) {
      return NextResponse.json({ error: "Ce code promo existe déjà." }, { status: 409 })
    }
    console.error("admin/promo POST error:", error)
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 })
  const admin = await requireOwnerAdmin(req)
  if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const { id, active } = body ?? {}
  if (!id || typeof active !== "boolean") {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 })
  }

  await setPromoCodeActive(id, active)
  return NextResponse.json({ ok: true })
}
