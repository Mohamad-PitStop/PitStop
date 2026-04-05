import { getUserFromAuthCookie } from "@/lib/auth-session"
import { findReservationsByUserId, ensureReservationMigrations } from "@/lib/reservation-db"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const user = await getUserFromAuthCookie(req.headers.get("cookie"))
    if (!user) {
      return Response.json({ ok: false, error: "Non authentifié." }, { status: 401 })
    }

    await ensureReservationMigrations()
    const reservations = await findReservationsByUserId(user.id)

    return Response.json({
      ok: true,
      reservations: reservations.map((r) => ({
        id: r.id,
        type: r.type,
        startAt: r.startAt,
        endAt: r.endAt,
        timeZone: r.timeZone,
        status: r.status,
        cancelToken: r.cancelToken,
      })),
    })
  } catch (err) {
    console.error("mes-reservations error:", err)
    return Response.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
