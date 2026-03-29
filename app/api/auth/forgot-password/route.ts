import { NextResponse } from "next/server"
import { createHash, randomBytes } from "node:crypto"
import nodemailer from "nodemailer"
import { z } from "zod"
import { findAccountByEmail, createPasswordResetToken } from "@/lib/accounts-db"
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

const FORGOT_RATE_LIMIT = { name: "forgot-password", maxRequests: 3, windowSeconds: 60 * 15 } // 3 demandes / 15 min

const Schema = z.object({
  email: z.string().trim().email(),
})

const RESET_EXPIRY_SECONDS = 60 * 60 // 1 heure

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(FORGOT_RATE_LIMIT, ip)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

    const { email } = Schema.parse(await req.json())

    const account = await findAccountByEmail(email)

    // Réponse identique que l'email existe ou non (anti-énumération)
    if (!account) {
      return NextResponse.json({ ok: true })
    }

    const token = randomBytes(32).toString("hex")
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + RESET_EXPIRY_SECONDS * 1000)

    await createPasswordResetToken({ userId: account.id, tokenHash, expiresAt })

    const smtpHost = process.env.SMTP_HOST?.trim()
    const smtpPort = Number(process.env.SMTP_PORT || "465")
    const smtpUser = process.env.SMTP_USER?.trim()
    const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "").trim()

    if (!smtpHost || !smtpUser || !smtpPass || Number.isNaN(smtpPort)) {
      console.error("forgot-password: SMTP non configuré")
      return NextResponse.json({ ok: false, error: "Service email non disponible." }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL
    if (!baseUrl) {
      console.error("forgot-password: NEXT_PUBLIC_BASE_URL ou NEXT_PUBLIC_SITE_URL non configuré")
      return NextResponse.json({ ok: false, error: "Configuration serveur incomplète." }, { status: 500 })
    }
    const resetUrl = `${baseUrl}/reinitialiser-mot-de-passe?token=${token}`

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
          <div style="padding:18px 20px;background:linear-gradient(90deg,#0f172a,#1e3a8a);color:#ffffff;">
            <div style="font-size:18px;font-weight:700;">PitStop — Réinitialisation du mot de passe</div>
          </div>
          <div style="padding:24px 20px;">
            <p style="margin:0 0 16px;color:#334155;font-size:15px;">Bonjour ${account.name},</p>
            <p style="margin:0 0 16px;color:#334155;font-size:14px;">
              Nous avons reçu une demande de réinitialisation de votre mot de passe.
              Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
            </p>
            <p style="margin:0 0 24px;">
              <a href="${resetUrl}"
                 style="display:inline-block;background:#1e3a8a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">
                Réinitialiser mon mot de passe
              </a>
            </p>
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;">
              Ce lien est valable pendant <strong>1 heure</strong>.
              Si vous n'avez pas demandé de réinitialisation, ignorez cet email.
            </p>
          </div>
        </div>
      </div>
    `

    await transporter.sendMail({
      from: `"PitStop" <${smtpUser}>`,
      to: email,
      subject: "Réinitialisation de votre mot de passe PitStop",
      text: `Cliquez sur ce lien pour réinitialiser votre mot de passe (valable 1 heure) :\n${resetUrl}`,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Email invalide." }, { status: 400 })
    }
    console.error("forgot-password error:", error)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
