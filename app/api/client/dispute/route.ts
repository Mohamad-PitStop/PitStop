import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { findGarageById } from "@/lib/garage-db"
import { getPayoutByReservation } from "@/lib/deposit-payout-db"

export const runtime = "nodejs"

type ReservationRow = {
  id: string
  name: string
  phone: string
  email: string | null
  type: string
  startAt: string
  endAt: string
  status: string
  userId: string | null
  garageId: string | null
  vehicleMarque: string | null
  vehicleModele: string | null
  vehicleAnnee: number | null
  vehicleKm: number | null
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
  const user = await getUserFromAuthCookie(req.headers.get("cookie"))
  if (!user) return NextResponse.json({ ok: false, error: "Non authentifié" }, { status: 401 })

  try {
    const body = await req.json().catch(() => null)
    if (!body?.reservationId || !body?.message) {
      return NextResponse.json({ ok: false, error: "reservationId et message requis." }, { status: 400 })
    }
    const message = String(body.message).trim()
    if (message.length < 10) {
      return NextResponse.json({ ok: false, error: "Message trop court." }, { status: 400 })
    }

    const rows = await prisma.$queryRawUnsafe<ReservationRow[]>(
      `SELECT "id", "name", "phone", "email", "type", "startAt", "endAt", "status",
              "userId", "garageId", "vehicleMarque", "vehicleModele", "vehicleAnnee", "vehicleKm"
       FROM "Reservation" WHERE "id" = ? LIMIT 1`,
      body.reservationId
    )
    const reservation = rows[0]
    if (!reservation) {
      return NextResponse.json({ ok: false, error: "Réservation introuvable." }, { status: 404 })
    }
    if (reservation.userId !== user.id) {
      return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 403 })
    }

    // Le litige n'est ouvert qu'une fois l'acompte versé au garagiste.
    const payout = reservation.garageId ? await getPayoutByReservation(reservation.id) : null
    if (!payout || payout.status !== "transferred") {
      return NextResponse.json(
        { ok: false, error: "Litige impossible avant le versement de l'acompte." },
        { status: 400 }
      )
    }

    const garage = reservation.garageId ? await findGarageById(reservation.garageId) : null
    const lieu = garage
      ? [garage.companyName, garage.street, garage.postalCode, garage.city]
          .filter(Boolean)
          .join(", ")
      : "-"

    const smtpUser = process.env.SMTP_USER
    if (!smtpUser) {
      return NextResponse.json({ ok: false, error: "Configuration email manquante." }, { status: 500 })
    }

    const transporter = getTransporter()
    const subject = `Litige client - Réservation ${reservation.id}`

    const vehiculeLabel = [
      reservation.vehicleMarque,
      reservation.vehicleModele,
      reservation.vehicleAnnee ? `(${reservation.vehicleAnnee})` : null,
    ]
      .filter(Boolean)
      .join(" ")

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
        <h2 style="color:#b91c1c;">Litige signalé par un client</h2>
        <table style="border-collapse:collapse;width:100%;">
          <tr><td style="padding:6px 10px;font-weight:600;">Client</td><td style="padding:6px 10px;">${escapeHtml(user.name ?? reservation.name)} &lt;${escapeHtml(user.email)}&gt;</td></tr>
          <tr><td style="padding:6px 10px;font-weight:600;">Téléphone</td><td style="padding:6px 10px;">${escapeHtml(reservation.phone)}</td></tr>
          <tr><td style="padding:6px 10px;font-weight:600;">Réservation</td><td style="padding:6px 10px;">${escapeHtml(reservation.id)}</td></tr>
          <tr><td style="padding:6px 10px;font-weight:600;">Type</td><td style="padding:6px 10px;">${escapeHtml(reservation.type)}</td></tr>
          <tr><td style="padding:6px 10px;font-weight:600;">Véhicule</td><td style="padding:6px 10px;">${escapeHtml(vehiculeLabel || "-")}</td></tr>
          <tr><td style="padding:6px 10px;font-weight:600;">Date RDV</td><td style="padding:6px 10px;">${escapeHtml(reservation.startAt)} → ${escapeHtml(reservation.endAt)}</td></tr>
          <tr><td style="padding:6px 10px;font-weight:600;">Lieu</td><td style="padding:6px 10px;">${escapeHtml(lieu)}</td></tr>
          <tr><td style="padding:6px 10px;font-weight:600;">Acompte versé</td><td style="padding:6px 10px;">${(payout.amountCents / 100).toFixed(2)} € le ${escapeHtml(payout.transferredAt ?? "-")}</td></tr>
        </table>
        <h3 style="margin-top:20px;">Message du client :</h3>
        <p style="white-space:pre-wrap;background:#f8fafc;padding:14px;border-radius:8px;">${escapeHtml(message)}</p>
      </div>
    `
    const text = [
      `Litige signalé par le client ${user.name ?? reservation.name} <${user.email}>`,
      `Téléphone : ${reservation.phone}`,
      `Réservation : ${reservation.id}`,
      `Type : ${reservation.type}`,
      `Véhicule : ${vehiculeLabel || "-"}`,
      `Date RDV : ${reservation.startAt} -> ${reservation.endAt}`,
      `Lieu : ${lieu}`,
      `Acompte versé : ${(payout.amountCents / 100).toFixed(2)} € le ${payout.transferredAt ?? "-"}`,
      "",
      "Message du client :",
      message,
    ].join("\n")

    await transporter.sendMail({
      from: `"PitStop Litiges" <${smtpUser}>`,
      to: "pitstopbelgique@gmail.com",
      replyTo: user.email,
      subject,
      text,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Client dispute error:", err)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
