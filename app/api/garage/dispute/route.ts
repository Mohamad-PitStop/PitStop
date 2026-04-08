import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { requireGaragiste } from "@/lib/garage-auth"
import { prisma } from "@/lib/prisma"
import { findGarageById } from "@/lib/garage-db"

export const runtime = "nodejs"

type ReservationRow = {
  id: string
  name: string
  phone: string
  email: string | null
  type: string
  startAt: string
  status: string
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

    // Fetch reservation
    const rows = await prisma.$queryRawUnsafe<ReservationRow[]>(
      `SELECT "id", "name", "phone", "email", "type", "startAt", "status", "garageId"
       FROM "Reservation" WHERE "id" = ? LIMIT 1`,
      body.reservationId
    )
    const reservation = rows[0]
    if (!reservation) {
      return NextResponse.json({ ok: false, error: "Réservation introuvable." }, { status: 404 })
    }
    if (reservation.garageId !== garageId) {
      return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 403 })
    }

    // Fetch garage info
    const garage = await findGarageById(garageId)

    const smtpUser = process.env.SMTP_USER
    if (!smtpUser) {
      return NextResponse.json({ ok: false, error: "Configuration email manquante." }, { status: 500 })
    }

    const transporter = getTransporter()

    const subject = `Litige garage - Réservation ${reservation.id}`
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
        <h2 style="color:#1e3a8a;">Litige signalé par un garage</h2>
        <table style="border-collapse:collapse;width:100%;">
          <tr><td style="padding:6px 10px;font-weight:600;">Garage</td><td style="padding:6px 10px;">${escapeHtml(garage?.companyName ?? garageId)}</td></tr>
          <tr><td style="padding:6px 10px;font-weight:600;">Email garage</td><td style="padding:6px 10px;">${escapeHtml(garage?.professionalEmail ?? "-")}</td></tr>
          <tr><td style="padding:6px 10px;font-weight:600;">Réservation</td><td style="padding:6px 10px;">${escapeHtml(reservation.id)}</td></tr>
          <tr><td style="padding:6px 10px;font-weight:600;">Client</td><td style="padding:6px 10px;">${escapeHtml(reservation.name)} (${escapeHtml(reservation.phone)})</td></tr>
          <tr><td style="padding:6px 10px;font-weight:600;">Type</td><td style="padding:6px 10px;">${escapeHtml(reservation.type)}</td></tr>
          <tr><td style="padding:6px 10px;font-weight:600;">Date RDV</td><td style="padding:6px 10px;">${escapeHtml(reservation.startAt)}</td></tr>
          <tr><td style="padding:6px 10px;font-weight:600;">Statut</td><td style="padding:6px 10px;">${escapeHtml(reservation.status)}</td></tr>
        </table>
        <h3 style="margin-top:20px;">Message du garage :</h3>
        <p style="white-space:pre-wrap;background:#f8fafc;padding:14px;border-radius:8px;">${escapeHtml(body.message)}</p>
      </div>
    `
    const text = [
      `Litige signalé par le garage ${garage?.companyName ?? garageId}`,
      `Réservation : ${reservation.id}`,
      `Client : ${reservation.name} (${reservation.phone})`,
      `Type : ${reservation.type}`,
      `Date RDV : ${reservation.startAt}`,
      `Statut : ${reservation.status}`,
      "",
      "Message du garage :",
      body.message,
    ].join("\n")

    await transporter.sendMail({
      from: `"PitStop Litiges" <${smtpUser}>`,
      to: "pitstopbelgique@gmail.com",
      replyTo: garage?.professionalEmail ?? smtpUser,
      subject,
      text,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Garage dispute error:", err)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
