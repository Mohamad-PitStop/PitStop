import { NextResponse } from "next/server"
import { deleteExpiredDiagnostics } from "@/lib/diagnostics-db"

export const runtime = "nodejs"

/**
 * Route déclenchée par Vercel Cron (voir vercel.json).
 * Supprime les diagnostics de plus d'1 an pour alléger la base.
 * Protégée par CRON_SECRET (envoyé automatiquement par Vercel).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const deleted = await deleteExpiredDiagnostics()
    console.log(`[cron] purge-diagnostics: ${deleted} ligne(s) supprimée(s).`)
    return NextResponse.json({ ok: true, deleted })
  } catch (error) {
    console.error("[cron] purge-diagnostics: erreur", error)
    return NextResponse.json({ ok: false, error: "Erreur lors de la purge." }, { status: 500 })
  }
}
