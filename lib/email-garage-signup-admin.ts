import nodemailer from "nodemailer"

function getSmtpFromHeader(smtpUser: string): string {
  const custom = process.env.SMTP_FROM?.trim()
  if (custom) return custom
  return `"PitStop" <${smtpUser}>`
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export type GarageSignupAdminPayload = {
  garageId: string
  companyName: string
  bceTvaNumber: string
  street: string
  postalCode: string
  city: string
  professionalPhone: string
  professionalEmail: string
  managerName: string
  ownerAccountEmail: string
  specialties?: string[] | null
  createdAt?: Date
}

function buildGarageSignupAdminHtml(payload: GarageSignupAdminPayload, baseUrl: string): string {
  const safeBase = baseUrl.replace(/\/$/, "")
  const adminLink = `${safeBase}/admin/garages`
  const specialties =
    payload.specialties && payload.specialties.length > 0
      ? payload.specialties.join(", ")
      : "—"
  const createdAt = (payload.createdAt ?? new Date()).toISOString()

  const rows: Array<{ label: string; value: string }> = [
    { label: "Nom commercial", value: payload.companyName },
    { label: "BCE / TVA", value: payload.bceTvaNumber },
    { label: "Adresse", value: `${payload.street}, ${payload.postalCode} ${payload.city}` },
    { label: "Responsable", value: payload.managerName },
    { label: "Email pro", value: payload.professionalEmail },
    { label: "Compte propriétaire", value: payload.ownerAccountEmail },
    { label: "Téléphone pro", value: payload.professionalPhone },
    { label: "Spécialités", value: specialties },
    { label: "Inscrit le", value: createdAt },
    { label: "ID garage", value: payload.garageId },
  ]

  const tableRows = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#475569;font-weight:600;vertical-align:top;width:200px;">${escapeHtml(row.label)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#0f172a;white-space:pre-wrap;">${escapeHtml(row.value)}</td>
        </tr>
      `
    )
    .join("")

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
        <div style="padding:18px 20px;background:linear-gradient(90deg,#0f172a,#166534);color:#ffffff;">
          <div style="font-size:18px;font-weight:700;">Nouveau garage inscrit — en attente de validation</div>
          <div style="font-size:13px;opacity:.9;margin-top:4px;">PitStop Belgique · admin</div>
        </div>
        <div style="padding:18px 20px;">
          <p style="margin:0 0 14px;color:#334155;font-size:14px;line-height:1.55;">
            Un garage vient de confirmer son e-mail et figure désormais comme <strong style="color:#0f172a;">pending</strong>
            sur la plateforme. Contactez le responsable pour finaliser le contrat de partenariat avant approbation.
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
            ${tableRows}
          </table>
          <div style="margin-top:20px;text-align:center;">
            <a href="${escapeHtml(adminLink)}" style="display:inline-block;padding:12px 22px;background:#22c55e;color:#ffffff;font-weight:700;text-decoration:none;border-radius:8px;font-size:14px;">
              Ouvrir l'admin des garages
            </a>
          </div>
        </div>
      </div>
    </div>
  `
}

function buildGarageSignupAdminText(payload: GarageSignupAdminPayload, baseUrl: string): string {
  const safeBase = baseUrl.replace(/\/$/, "")
  const adminLink = `${safeBase}/admin/garages`
  const specialties =
    payload.specialties && payload.specialties.length > 0
      ? payload.specialties.join(", ")
      : "—"

  return [
    "Nouveau garage inscrit — en attente de validation",
    "",
    `Nom commercial: ${payload.companyName}`,
    `BCE / TVA: ${payload.bceTvaNumber}`,
    `Adresse: ${payload.street}, ${payload.postalCode} ${payload.city}`,
    `Responsable: ${payload.managerName}`,
    `Email pro: ${payload.professionalEmail}`,
    `Compte propriétaire: ${payload.ownerAccountEmail}`,
    `Téléphone pro: ${payload.professionalPhone}`,
    `Spécialités: ${specialties}`,
    `ID garage: ${payload.garageId}`,
    "",
    `Admin: ${adminLink}`,
  ].join("\n")
}

/**
 * Notifie l'admin qu'un nouveau garage vient de s'inscrire (statut pending).
 * Destination : PARTNER_CONTACT_TO (fallback pitstopbelgique@gmail.com).
 * Échec silencieux : ne doit jamais faire échouer la vérification d'e-mail.
 */
export async function sendGarageSignupAdminEmail(payload: GarageSignupAdminPayload): Promise<void> {
  const smtpHost = process.env.SMTP_HOST?.trim()
  const smtpPort = Number(process.env.SMTP_PORT || "465")
  const smtpUser = process.env.SMTP_USER?.trim()
  const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "").trim()

  if (!smtpHost || !smtpUser || !smtpPass || Number.isNaN(smtpPort)) {
    console.warn("garage-signup-admin-email: SMTP non configuré, notification admin non envoyée")
    return
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://pitstop.be"
  const adminTo = (process.env.PARTNER_CONTACT_TO || "pitstopbelgique@gmail.com").trim()

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  })

  const subject = `Action requise — Inscription garage à valider : ${payload.companyName} (${payload.city})`

  await transporter.sendMail({
    from: getSmtpFromHeader(smtpUser),
    to: adminTo,
    replyTo: payload.professionalEmail || payload.ownerAccountEmail,
    subject,
    text: buildGarageSignupAdminText(payload, baseUrl),
    html: buildGarageSignupAdminHtml(payload, baseUrl),
    priority: "high",
    headers: {
      "X-Priority": "1 (Highest)",
      "X-MSMail-Priority": "High",
      Importance: "high",
    },
  })
}
