import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { z } from "zod"

const PartnerContactSchema = z.object({
  garageName: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(6).max(40),
  city: z.string().trim().min(2).max(120),
  services: z.string().trim().min(2).max(240),
  message: z.string().trim().min(10).max(2000),
})

const PARTNER_CONTACT_TO = process.env.PARTNER_CONTACT_TO || "pitstopbelgique@gmail.com"

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function buildPartnerContactHtml(payload: z.infer<typeof PartnerContactSchema>): string {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Nom du garage", value: payload.garageName },
    { label: "Personne de contact", value: payload.contactName },
    { label: "Email pro", value: payload.email },
    { label: "Telephone", value: payload.phone },
    { label: "Ville", value: payload.city },
    { label: "Services principaux", value: payload.services },
    { label: "Message", value: payload.message },
  ]

  const tableRows = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#475569;font-weight:600;vertical-align:top;width:180px;">${escapeHtml(row.label)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#0f172a;white-space:pre-wrap;">${escapeHtml(row.value)}</td>
        </tr>
      `
    )
    .join("")

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
        <div style="padding:18px 20px;background:linear-gradient(90deg,#0f172a,#1e3a8a);color:#ffffff;">
          <div style="font-size:18px;font-weight:700;">Nouvelle demande partenaire garage</div>
          <div style="font-size:13px;opacity:.9;margin-top:4px;">PitStop Belgique</div>
        </div>
        <div style="padding:18px 20px;">
          <p style="margin:0 0 14px;color:#334155;font-size:14px;">
            Un professionnel vient de soumettre le formulaire pour rejoindre le reseau partenaires.
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
            ${tableRows}
          </table>
        </div>
      </div>
    </div>
  `
}

export async function POST(req: Request) {
  try {
    const payload = PartnerContactSchema.parse(await req.json())
    const smtpHost = process.env.SMTP_HOST?.trim()
    const smtpPort = Number(process.env.SMTP_PORT || "465")
    const smtpUser = process.env.SMTP_USER?.trim()
    // Accepte un app password collé avec espaces (Google l'affiche par blocs de 4)
    const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "").trim()

    if (!smtpHost || !smtpUser || !smtpPass || Number.isNaN(smtpPort)) {
      console.error("Partner contact email misconfigured")
      return NextResponse.json(
        { ok: false, error: "Configuration email manquante. Contactez le support." },
        { status: 500 }
      )
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })

    const subject = `Nouvelle demande partenaire - ${payload.garageName} (${payload.city})`
    const text = [
      "Nouvelle demande partenaire garage",
      "",
      `Nom du garage: ${payload.garageName}`,
      `Personne de contact: ${payload.contactName}`,
      `Email pro: ${payload.email}`,
      `Telephone: ${payload.phone}`,
      `Ville: ${payload.city}`,
      `Services principaux: ${payload.services}`,
      "",
      "Message:",
      payload.message,
    ].join("\n")

    await transporter.sendMail({
      from: `"PitStop Partenaires" <${smtpUser}>`,
      to: PARTNER_CONTACT_TO,
      replyTo: payload.email,
      subject,
      text,
      html: buildPartnerContactHtml(payload),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Formulaire invalide." }, { status: 400 })
    }
    const e = error as { code?: string; responseCode?: number; message?: string } | undefined
    console.error("Partner contact email error:", e?.code, e?.responseCode, e?.message || error)
    if (e?.code === "EAUTH" || e?.responseCode === 535) {
      return NextResponse.json(
        {
          ok: false,
          error: "Echec d'authentification email. Verifiez SMTP_USER et le mot de passe d'application SMTP_PASS.",
        },
        { status: 500 }
      )
    }
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
