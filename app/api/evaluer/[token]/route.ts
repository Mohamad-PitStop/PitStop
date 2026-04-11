import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getGarageReviewByToken, submitGarageReview } from "@/lib/garage-review-db"

export const runtime = "nodejs"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const review = await getGarageReviewByToken(token)
  if (!review) return NextResponse.json({ notFound: true })
  if (review.submittedAt) return NextResponse.json({ alreadySubmitted: true })
  return NextResponse.json({ ok: true })
}

const submitSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(800).optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await req.json().catch(() => null)
  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_data" }, { status: 400 })
  }
  const updated = await submitGarageReview(token, parsed.data.rating, parsed.data.comment)
  if (!updated) {
    return NextResponse.json({ error: "already_submitted_or_not_found" }, { status: 409 })
  }
  return NextResponse.json({ ok: true })
}
