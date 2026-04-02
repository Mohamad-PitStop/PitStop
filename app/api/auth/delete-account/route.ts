import { NextResponse } from "next/server"
import { AUTH_COOKIE_NAME, buildSessionCookieOptions, getUserFromAuthCookie } from "@/lib/auth-session"
import { deleteAccountById } from "@/lib/accounts-db"
import { deleteDiagnosticsByUserId } from "@/lib/diagnostics-db"

export async function POST(req: Request) {
  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  if (!user) {
    return NextResponse.json({ ok: false, error: "Non connecté." }, { status: 401 })
  }

  await deleteDiagnosticsByUserId(user.id)
  await deleteAccountById(user.id)

  const res = NextResponse.json({ ok: true })
  res.cookies.set(AUTH_COOKIE_NAME, "", { ...buildSessionCookieOptions(), maxAge: 0 })
  return res
}

