import { NextResponse } from "next/server"
import { z } from "zod"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { assignDiagnosticRequestToUser } from "@/lib/diagnostics-db"
import { clearGuestDiagnosticCookies } from "@/lib/guest-diagnostic"

export const runtime = "nodejs"

const Body = z.object({
  diagnosticId: z.string().trim().min(10).max(120),
})

export async function POST(req: Request) {
  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  if (!user) {
    return NextResponse.json({ ok: false, error: "Non connecté" }, { status: 401 })
  }
  if (user.role === "garagiste") {
    return NextResponse.json({ ok: false, error: "Non applicable" }, { status: 400 })
  }

  let body: z.infer<typeof Body>
  try {
    body = Body.parse(await req.json())
  } catch {
    return NextResponse.json({ ok: false, error: "Requête invalide" }, { status: 400 })
  }

  const ok = await assignDiagnosticRequestToUser(body.diagnosticId, user.id)
  const res = NextResponse.json(ok ? { ok: true } : { ok: false, error: "Diagnostic introuvable ou déjà rattaché" })
  if (ok) clearGuestDiagnosticCookies(res)
  return res
}
