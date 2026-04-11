import nodemailer from "nodemailer"

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function getSmtpFromHeader(smtpUser: string): string {
  const custom = process.env.SMTP_FROM?.trim()
  if (custom) return custom
  return `"PitStop" <${smtpUser}>`
}

function formatDateTime(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("fr-BE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    }).format(date)
  } catch {
    return date.toISOString()
  }
}

function buildHtml(args: {
  name: string
  type: string
  startAt: Date
  endAt: Date
  timeZone: string
  vehicleLabel: string | null
  cancelUrl: string
  baseUrl: string
}): string {
  const { name, type, startAt, endAt, timeZone, vehicleLabel, cancelUrl, baseUrl } = args
  const logoUrl = `${baseUrl}/images/pitstop-logo.png`

  const serviceLabel = type === "obd-scan"
    ? "Scan OBD (garage partenaire)"
    : type.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase())

  const dateStr = formatDateTime(startAt, timeZone)

  // Heure de fin pour afficher la durée
  const endStr = new Intl.DateTimeFormat("fr-BE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(endAt)

  const vehicleRow = vehicleLabel
    ? `<tr><td style="padding:4px 0;color:#64748b;font-size:13px;width:130px">Véhicule</td><td style="padding:4px 0;color:#0f172a;font-size:13px;font-weight:600">${escapeHtml(vehicleLabel)}</td></tr>`
    : ""

  return `
<div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
    <div style="padding:28px 24px 8px;text-align:center;background:#ffffff;">
      <img src="${logoUrl}" alt="PitStop" width="130" height="40"
           style="display:block;max-width:100%;height:auto;margin:0 auto;border:0;outline:none;text-decoration:none;" />
    </div>
    <div style="padding:8px 24px 28px;">
      <p style="margin:0 0 6px;color:#334155;font-size:15px;">Bonjour ${escapeHtml(name)},</p>
      <p style="margin:0 0 20px;color:#334155;font-size:14px;line-height:1.55;">
        Votre rendez-vous est <strong style="color:#16a34a;">confirmé</strong>.
        Voici le récapitulatif de votre réservation.
      </p>

      <!-- Récapitulatif RDV -->
      <div style="background:#f1f5f9;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
        <table style="border-collapse:collapse;width:100%">
          <tbody>
            <tr><td style="padding:4px 0;color:#64748b;font-size:13px;width:130px">Prestation</td><td style="padding:4px 0;color:#0f172a;font-size:13px;font-weight:600">${escapeHtml(serviceLabel)}</td></tr>
            <tr><td style="padding:4px 0;color:#64748b;font-size:13px">Date &amp; heure</td><td style="padding:4px 0;color:#0f172a;font-size:13px;font-weight:600">${escapeHtml(dateStr)} – ${escapeHtml(endStr)}</td></tr>
            ${vehicleRow}
          </tbody>
        </table>
      </div>

      <!-- CGV — points importants -->
      <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0 0 10px;color:#92400e;font-size:13px;font-weight:700;">
          ⚠️ Conditions importantes à connaître
        </p>
        <ul style="margin:0;padding-left:18px;color:#78350f;font-size:13px;line-height:1.7;">
          <li><strong>Annulation :</strong> toute annulation doit être effectuée au moins <strong>48 heures avant</strong> l'heure du rendez-vous. En deçà, l'acompte ne peut être remboursé.</li>
          <li><strong>Non-présentation :</strong> en cas d'absence sans annulation préalable, l'acompte versé est définitivement perdu.</li>
          <li><strong>Contestation :</strong> toute réclamation doit être adressée par e-mail à <a href="mailto:pitstopbelgique@gmail.com" style="color:#92400e;">pitstopbelgique@gmail.com</a> dans les 14 jours suivant la prestation.</li>
        </ul>
      </div>

      <!-- Bouton annulation -->
      <p style="margin:0 0 20px;">
        <a href="${cancelUrl}"
           style="display:inline-block;background:#ef4444;color:#ffffff;text-decoration:none;padding:11px 24px;border-radius:8px;font-size:14px;font-weight:600;">
          Annuler mon rendez-vous
        </a>
      </p>
      <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;line-height:1.5;">
        Ce lien d'annulation est valable jusqu'à 48 h avant votre rendez-vous.
      </p>
      <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;">
        PitStop Belgique — <a href="${baseUrl}" style="color:#94a3b8;">${baseUrl}</a>
      </p>
    </div>
  </div>
</div>
  `
}

function buildPlainText(args: {
  name: string
  type: string
  startAt: Date
  endAt: Date
  timeZone: string
  vehicleLabel: string | null
  cancelUrl: string
  baseUrl: string
}): string {
  const { name, type, startAt, timeZone, vehicleLabel, cancelUrl } = args
  const serviceLabel = type.replace(/-/g, " ")
  const dateStr = formatDateTime(startAt, timeZone)

  return `Bonjour ${name},

Votre rendez-vous PitStop est confirmé.

Prestation : ${serviceLabel}
Date       : ${dateStr}${vehicleLabel ? `\nVéhicule   : ${vehicleLabel}` : ""}

CONDITIONS IMPORTANTES :
- Annulation : au moins 48 h avant le rendez-vous. Passé ce délai, l'acompte n'est pas remboursé.
- Non-présentation : l'acompte est définitivement perdu.
- Contestation : par e-mail à pitstopbelgique@gmail.com dans les 14 jours suivant la prestation.

Annuler mon rendez-vous : ${cancelUrl}

— PitStop Belgique`
}

export async function sendReservationConfirmedEmail(args: {
  to: string
  name: string
  type: string
  startAt: Date
  endAt: Date
  timeZone: string
  vehicleMarque?: string | null
  vehicleModele?: string | null
  cancelToken: string | null
}): Promise<void> {
  const smtpHost = process.env.SMTP_HOST?.trim()
  const smtpPort = Number(process.env.SMTP_PORT || "465")
  const smtpUser = process.env.SMTP_USER?.trim()
  const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "").trim()

  if (!smtpHost || !smtpUser || !smtpPass || Number.isNaN(smtpPort)) {
    console.warn("email-reservation-confirmed: SMTP non configuré, email non envoyé")
    return
  }

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "")
  if (!baseUrl) {
    console.warn("email-reservation-confirmed: NEXT_PUBLIC_BASE_URL manquant")
    return
  }

  const vehicleLabel = [args.vehicleMarque, args.vehicleModele].filter(Boolean).join(" ") || null
  const cancelUrl = args.cancelToken
    ? `${baseUrl}/rendez-vous/annuler?token=${args.cancelToken}`
    : `${baseUrl}/profil`

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  })

  const html = buildHtml({ name: args.name, type: args.type, startAt: args.startAt, endAt: args.endAt, timeZone: args.timeZone, vehicleLabel, cancelUrl, baseUrl })
  const text = buildPlainText({ name: args.name, type: args.type, startAt: args.startAt, endAt: args.endAt, timeZone: args.timeZone, vehicleLabel, cancelUrl, baseUrl })

  try {
    await transporter.sendMail({
      from: getSmtpFromHeader(smtpUser),
      to: args.to,
      subject: "PitStop — votre rendez-vous est confirmé",
      text,
      html,
    })
  } catch (err) {
    console.error("email-reservation-confirmed: échec envoi:", err)
  }
}
