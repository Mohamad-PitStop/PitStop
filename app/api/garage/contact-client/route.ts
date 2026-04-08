import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { requireGaragiste } from "@/lib/garage-auth"
import { prisma } from "@/lib/prisma"
import { findGarageById } from "@/lib/garage-db"

export const runtime = "nodejs"

type ReservationRow = {
  id: string
  name: string
  email: string | null
  garageId: string | null
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: (process.env.SMTP_PASS ?? "").replace(/\s/g, ""),
    },
  })
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export async function POST(req: Request) {
  const auth = await requireGaragiste(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })
  const { garageId } = auth

  try {
    const body = await req.json().catch(() => null)
    if (!body?.reservationId || !body?.message) {
      return NextResponse.json({ ok: false, error: "reservationId et message requis." }, { status: 400 })
    }

    // Fetch reservation and verify ownership
    const rows = await prisma.$queryRawUnsafe<ReservationRow[]>(
      `SELECT "id", "name", "email", "garageId" FROM "Reservation" WHERE "id" = ? LIMIT 1`,
      body.reservationId
    )
    const reservation = rows[0]
    if (!reservation) {
      return NextResponse.json({ ok: false, error: "Réservation introuvable." }, { status: 404 })
    }
    if (reservation.garageId !== garageId) {
      return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 403 })
    }
    if (!reservation.email) {
      return NextResponse.json({ ok: false, error: "Le client n'a pas d'adresse email." }, { status: 400 })
    }

    const garage = await findGarageById(garageId)
    const fromEmail = garage?.professionalEmail || process.env.SMTP_USER
    const garageName = garage?.companyName ?? "Votre garage"

    if (!fromEmail) {
      return NextResponse.json({ ok: false, error: "Configuration email manquante." }, { status: 500 })
    }

    const transporter = getTransporter()

    await transporter.sendMail({
      from: `"${garageName}" <${process.env.SMTP_USER}>`,
      to: reservation.email,
      replyTo: fromEmail,
      subject: `Message de ${garageName} concernant votre rendez-vous`,
      text: `Bonjour ${reservation.name},\n\n${body.message}\n\nCordialement,\n${garageName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <p>Bonjour ${escapeHtml(reservation.name)},</p>
          <p style="white-space:pre-wrap;">${escapeHtml(body.message)}</p>
          <p>Cordialement,<br/>${escapeHtml(garageName)}</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Garage contact-client error:", err)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
