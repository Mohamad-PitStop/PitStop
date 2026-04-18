import { NextResponse } from "next/server"
import { getUserFromAuthCookie } from "@/lib/auth-session"

export async function GET(req: Request) {
  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  if (!user) return NextResponse.json({ ok: true, user: null })
  return NextResponse.json({ ok: true, user })
}
