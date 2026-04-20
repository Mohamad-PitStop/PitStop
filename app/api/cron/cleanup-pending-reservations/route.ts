import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

/**
 * Supprime les réservations "pending" abandonnées (plus de 10 min). Ces
 * réservations bloquent temporairement un créneau le temps qu'un client
 * finalise un checkout Stripe ; au-delà, on les considère abandonnées.
 * Protégée par CRON_SECRET. Peut être appelée via Vercel Cron.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const cutoff = new Date(Date.now() - 10 * 60 * 1000)
    const result = await prisma.reservation.deleteMany({
      where: {
        status: "pending",
        createdAt: { lt: cutoff },
      },
    })
    console.log(`[cron] cleanup-pending-reservations: ${result.count} ligne(s) supprimée(s).`)
    return NextResponse.json({ ok: true, deleted: result.count })
  } catch (error) {
    console.error("[cron] cleanup-pending-reservations: erreur", error)
    return NextResponse.json({ ok: false, error: "Erreur lors du nettoyage." }, { status: 500 })
  }
}
