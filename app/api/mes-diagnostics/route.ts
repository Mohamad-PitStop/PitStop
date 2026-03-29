import { NextResponse } from "next/server"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { getDiagnosticsByUserId } from "@/lib/diagnostics-db"

export async function GET(req: Request) {
  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  if (!user) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 })
  }

  const rows = await getDiagnosticsByUserId(user.id, 50)
  return NextResponse.json({ diagnostics: rows })
}
