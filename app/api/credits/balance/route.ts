import { NextResponse } from "next/server"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { getUserCredits } from "@/lib/accounts-db"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  if (!user) return NextResponse.json({ ok: false, credits: 0 })
  const credits = await getUserCredits(user.id)
  return NextResponse.json({ ok: true, credits })
}
