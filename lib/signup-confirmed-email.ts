import nodemailer from "nodemailer"

/** En-tête From ; sinon `"PitStop" <SMTP_USER>` (ex. Gmail : l’expéditeur doit correspondre au compte SMTP). */
function getSmtpFromHeader(smtpUser: string): string {
  const custom = process.env.SMTP_FROM?.trim()
  if (custom) return custom
  return `"PitStop" <${smtpUser}>`
}

export function buildSignupConfirmedEmailHtml(
  name: string,
  baseUrl: string,
  opts: { welcomed: boolean; testPhaseBonus: boolean }
): string {
  const safeBase = baseUrl.replace(/\/$/, "")
  const logoUrl = `${safeBase}/placeholder-logo.svg`
  const homeUrl = safeBase

  const creditBlock =
    opts.welcomed && opts.testPhaseBonus
      ? `<p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.55;">
          Pour vous remercier de nous aider à tester la plateforme, nous avons ajouté
          <strong style="color:#0f172a;">un diagnostic gratuit</strong> à votre compte.
        </p>`
      : opts.welcomed
        ? `<p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.55;">
            Un crédit diagnostic de bienvenue a été ajouté à votre compte.
          </p>`
        : ""

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
        <div style="padding:28px 24px 8px;text-align:center;background:#ffffff;">
          <img src="${logoUrl}" alt="PitStop" width="215" height="48"
               style="display:block;max-width:100%;height:auto;margin:0 auto;border:0;outline:none;text-decoration:none;" />
        </div>
        <div style="padding:8px 24px 28px;">
          <p style="margin:0 0 16px;color:#334155;font-size:15px;">Bonjour ${escapeHtml(name)},</p>
          <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.55;">
            Votre adresse e-mail est <strong>confirmée</strong> : votre compte PitStop est désormais actif.
          </p>
          <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.55;">
            Merci de votre inscription et de votre confiance. Nous sommes ravis de vous accueillir.
          </p>
          ${creditBlock}
          <p style="margin:0 0 20px;">
            <a href="${homeUrl}"
               style="display:inline-block;background:#1e3a8a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">
              Accéder au site
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function buildSignupConfirmedPlainText(
  name: string,
  baseUrl: string,
  opts: { welcomed: boolean; testPhaseBonus: boolean }
): string {
  const safeBase = baseUrl.replace(/\/$/, "")
  let extra = ""
  if (opts.welcomed && opts.testPhaseBonus) {
    extra =
      "\n\nPour vous remercier de nous aider à tester la plateforme, un diagnostic gratuit a été ajouté à votre compte."
  } else if (opts.welcomed) {
    extra = "\n\nUn crédit diagnostic de bienvenue a été ajouté à votre compte."
  }
  return `Bonjour ${name},

Votre adresse e-mail est confirmée : votre compte PitStop est désormais actif.

Merci de votre inscription et de votre confiance. Nous sommes ravis de vous accueillir.${extra}

Accéder au site : ${safeBase}

— PitStop Belgique`
}

/**
 * E-mail envoyé après confirmation réussie de l’adresse (création de compte).
 * Échec silencieux côté API (log uniquement) pour ne pas bloquer la session.
 */
export async function sendSignupConfirmedEmail(args: {
  to: string
  name: string
  welcomed: boolean
  testPhaseBonus: boolean
}): Promise<void> {
  const smtpHost = process.env.SMTP_HOST?.trim()
  const smtpPort = Number(process.env.SMTP_PORT || "465")
  const smtpUser = process.env.SMTP_USER?.trim()
  const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "").trim()

  if (!smtpHost || !smtpUser || !smtpPass || Number.isNaN(smtpPort)) {
    console.warn("signup-confirmed-email: SMTP non configuré, email de confirmation non envoyé")
    return
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (!baseUrl) {
    console.warn("signup-confirmed-email: NEXT_PUBLIC_BASE_URL / NEXT_PUBLIC_SITE_URL manquant")
    return
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  })

  const html = buildSignupConfirmedEmailHtml(args.name, baseUrl, {
    welcomed: args.welcomed,
    testPhaseBonus: args.testPhaseBonus,
  })
  const text = buildSignupConfirmedPlainText(args.name, baseUrl, {
    welcomed: args.welcomed,
    testPhaseBonus: args.testPhaseBonus,
  })

  await transporter.sendMail({
    from: getSmtpFromHeader(smtpUser),
    to: args.to,
    subject: "Bienvenue sur PitStop — inscription confirmée",
    text,
    html,
  })
}
