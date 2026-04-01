import { NextResponse } from "next/server"
import { GUEST_USED_COOKIE_NAME, extractCookieValue } from "@/lib/auth-session"

export const runtime = "nodejs"

/** Retourne si l'invité a déjà utilisé son diagnostic gratuit (cookie httpOnly). */
export async function GET(req: Request) {
  const guestUsed = extractCookieValue(req.headers.get("cookie"), GUEST_USED_COOKIE_NAME) === "1"
  return NextResponse.json({ guestUsed })
}
