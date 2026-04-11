import nodemailer from "nodemailer"

function getSmtpFromHeader(smtpUser: string): string {
  const custom = process.env.SMTP_FROM?.trim()
  if (custom) return custom
  return `"PitStop" <${smtpUser}>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function formatDate(date: Date, timeZone: string): string {
  return date.toLocaleDateString("fr-BE", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function buildRatingRequestHtml(args: {
  name: string
  type: string
  startAt: Date
  timeZone: string
  token: string
  baseUrl: string
}): string {
  const safeBase = args.baseUrl.replace(/\/$/, "")
  const logoUrl = `${safeBase}/images/pitstop-logo.png`
  const ratingUrl = `${safeBase}/evaluer/${args.token}`
  const formattedDate = formatDate(args.startAt, args.timeZone)

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
        <div style="padding:28px 24px 8px;text-align:center;background:#ffffff;">
          <img src="${logoUrl}" alt="PitStop" width="130" height="40"
               style="display:block;max-width:100%;height:auto;margin:0 auto;border:0;outline:none;text-decoration:none;" />
        </div>
        <div style="padding:8px 24px 28px;">
          <p style="margin:0 0 16px;color:#334155;font-size:15px;">Bonjour ${escapeHtml(args.name)},</p>
          <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.55;">
            Nous espérons que votre rendez-vous s'est bien passé.
          </p>
          <p style="margin:0 0 8px;color:#334155;font-size:14px;line-height:1.55;">
            <strong>Service :</strong> ${escapeHtml(args.type)}
          </p>
          <p style="margin:0 0 20px;color:#334155;font-size:14px;line-height:1.55;">
            <strong>Date :</strong> ${escapeHtml(formattedDate)}
          </p>
          <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.55;">
            Votre avis est précieux et aide d'autres conducteurs à choisir le bon garage. Cela ne prend qu'une minute.
          </p>
          <p style="margin:0 0 24px;text-align:center;">
            <a href="${ratingUrl}"
               style="display:inline-block;background:#1e3a8a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
              Donner mon avis
            </a>
          </p>
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;">
            PitStop Belgique — diagnostic et accompagnement automobile.
          </p>
        </div>
      </div>
    </div>
  `
}

function buildRatingRequestPlainText(args: {
  name: string
  type: string
  startAt: Date
  timeZone: string
  token: string
  baseUrl: string
}): string {
  const safeBase = args.baseUrl.replace(/\/$/, "")
  const ratingUrl = `${safeBase}/evaluer/${args.token}`
  const formattedDate = formatDate(args.startAt, args.timeZone)

  return `Bonjour ${args.name},

Nous espérons que votre rendez-vous s'est bien passé.

Service : ${args.type}
Date : ${formattedDate}

Votre avis est précieux et aide d'autres conducteurs à choisir le bon garage. Cela ne prend qu'une minute.

Donner mon avis : ${ratingUrl}

— PitStop Belgique`
}

/**
 * Envoie un e-mail de demande d'avis après un rendez-vous.
 * Échec silencieux (log uniquement) pour ne pas bloquer le CRON.
 */
export async function sendRatingRequestEmail(args: {
  to: string
  name: string
  type: string
  startAt: Date
  timeZone: string
  token: string
  baseUrl: string
}): Promise<void> {
  const smtpHost = process.env.SMTP_HOST?.trim()
  const smtpPort = Number(process.env.SMTP_PORT || "465")
  const smtpUser = process.env.SMTP_USER?.trim()
  const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "").trim()

  if (!smtpHost || !smtpUser || !smtpPass || Number.isNaN(smtpPort)) {
    console.warn("email-rating-request: SMTP non configuré, e-mail d'avis non envoyé")
    return
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })

    const html = buildRatingRequestHtml(args)
    const text = buildRatingRequestPlainText(args)

    await transporter.sendMail({
      from: getSmtpFromHeader(smtpUser),
      to: args.to,
      subject: "PitStop — donnez votre avis sur votre rendez-vous",
      text,
      html,
    })
  } catch (err) {
    console.error("email-rating-request: échec de l'envoi de l'e-mail d'avis", err)
  }
}
