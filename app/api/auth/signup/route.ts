import { NextResponse } from "next/server"
import { createHash, randomBytes } from "node:crypto"
import nodemailer from "nodemailer"
import { z } from "zod"
import { findAccountByEmail } from "@/lib/accounts-db"
import { hashPassword } from "@/lib/auth-password"
import { upsertPendingVerification } from "@/lib/email-verification-db"
import { buildVerificationEmail } from "@/app/api/auth/resend-verification/route"
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import { isValidBelgianPostalCode, isValidCity, normalizeCity, normalizePostalCode } from "@/lib/signup-location"

export const runtime = "nodejs"

const SIGNUP_RATE_LIMIT = { name: "signup", maxRequests: 5, windowSeconds: 60 * 60 } // 5 inscriptions / heure
const VERIFY_EXPIRY_SECONDS = 60 * 60 * 24 // 24 heures

const SignupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(128),
  postalCode: z.string().trim().min(4).max(12),
  city: z.string().trim().min(2).max(80),
})

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(SIGNUP_RATE_LIMIT, ip)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

    const body = SignupSchema.parse(await req.json())
    const email = body.email.toLowerCase()
    const postalNorm = normalizePostalCode(body.postalCode)
    const cityNorm = normalizeCity(body.city)
    if (!isValidBelgianPostalCode(postalNorm)) {
      return NextResponse.json(
        { ok: false, error: "Indiquez un code postal belge valide (4 chiffres, ex. 6000 ou 1000)." },
        { status: 400 }
      )
    }
    if (!isValidCity(cityNorm)) {
      return NextResponse.json(
        { ok: false, error: "Indiquez une commune ou une ville valide (2 à 80 caractères)." },
        { status: 400 }
      )
    }

    // Un compte vérifié existe déjà
    const exists = await findAccountByEmail(email)
    if (exists) {
      return NextResponse.json({ ok: false, error: "Un compte existe déjà avec cet e-mail." }, { status: 409 })
    }

    // Pré-hacher le mot de passe dès maintenant (stocké temporairement avec le token)
    const passwordHash = hashPassword(body.password)

    // Générer le token de vérification
    const token = randomBytes(32).toString("hex")
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + VERIFY_EXPIRY_SECONDS * 1000)

    // Sauvegarder les données en attente (ou remplacer si déjà une vérification en attente pour cet email)
    await upsertPendingVerification({
      email,
      name: body.name,
      passwordHash,
      tokenHash,
      expiresAt,
      postalCode: postalNorm,
      city: cityNorm,
    })

    // Envoyer l'email de vérification
    const smtpHost = process.env.SMTP_HOST?.trim()
    const smtpPort = Number(process.env.SMTP_PORT || "465")
    const smtpUser = process.env.SMTP_USER?.trim()
    const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "").trim()

    if (!smtpHost || !smtpUser || !smtpPass || Number.isNaN(smtpPort)) {
      console.error("signup: SMTP non configuré")
      return NextResponse.json({ ok: false, error: "Service email non disponible. Contactez le support." }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL
    if (!baseUrl) {
      return NextResponse.json({ ok: false, error: "Configuration serveur incomplète." }, { status: 500 })
    }

    const verifyUrl = `${baseUrl}/verifier-email?token=${token}`

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })

    await transporter.sendMail({
      from: `"PitStop" <${smtpUser}>`,
      to: email,
      subject: "Confirmez votre adresse email : PitStop",
      text: `Bonjour ${body.name},\n\nCliquez sur ce lien pour confirmer votre adresse email (valable 24 h) :\n${verifyUrl}\n\nSi vous n'avez pas créé de compte PitStop, ignorez cet email.`,
      html: buildVerificationEmail(body.name, verifyUrl),
    })

    return NextResponse.json({ ok: true, pendingVerification: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Formulaire invalide." }, { status: 400 })
    }
    console.error("Signup API error:", error)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
