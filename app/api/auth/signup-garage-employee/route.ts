import { NextResponse } from "next/server"
import { createHash, randomBytes } from "node:crypto"
import nodemailer from "nodemailer"
import { z } from "zod"
import { findAccountByEmail } from "@/lib/accounts-db"
import { hashPassword } from "@/lib/auth-password"
import { upsertPendingVerification } from "@/lib/email-verification-db"
import { upsertPendingGarageRegistration } from "@/lib/pending-garage-registration-db"
import { findInvitationByEmailAndCode } from "@/lib/garage-employee-db"
import { findGarageByCode } from "@/lib/garage-db"
import { buildVerificationEmail } from "@/app/api/auth/resend-verification/route"
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

export const runtime = "nodejs"

const SIGNUP_RATE_LIMIT = { name: "signup-garage-employee", maxRequests: 5, windowSeconds: 60 * 60 }
const VERIFY_EXPIRY_SECONDS = 60 * 60 * 24

const EmployeeSignupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(128),
  garageCode: z.string().trim().min(8).max(8),
})

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(SIGNUP_RATE_LIMIT, ip)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

    const body = EmployeeSignupSchema.parse(await req.json())
    const email = body.email.toLowerCase()
    const garageCode = body.garageCode.toUpperCase()

    // Vérifier que le garage existe
    const garage = await findGarageByCode(garageCode)
    if (!garage) {
      return NextResponse.json(
        { ok: false, error: "Code garage invalide. Vérifiez auprès de votre employeur." },
        { status: 400 }
      )
    }

    // Vérifier que l'email est dans la liste des employés invités
    const invitation = await findInvitationByEmailAndCode(email, garageCode)
    if (!invitation) {
      return NextResponse.json(
        { ok: false, error: "Votre adresse e-mail n'a pas été enregistrée par ce garage. Contactez votre employeur pour qu'il ajoute votre e-mail." },
        { status: 403 }
      )
    }

    // Vérifier que le compte n'existe pas
    const exists = await findAccountByEmail(email)
    if (exists) {
      return NextResponse.json({ ok: false, error: "Un compte existe déjà avec cet e-mail." }, { status: 409 })
    }

    const passwordHash = hashPassword(body.password)
    const token = randomBytes(32).toString("hex")
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + VERIFY_EXPIRY_SECONDS * 1000)

    // Stocker la vérification email
    await upsertPendingVerification({
      email,
      name: body.name,
      passwordHash,
      tokenHash,
      expiresAt,
      postalCode: "",
      city: "",
    })

    // Stocker les données d'inscription garage (type employee)
    await upsertPendingGarageRegistration({
      email,
      type: "employee",
      garageId: garage.id,
    })

    // Envoi email
    const smtpHost = process.env.SMTP_HOST?.trim()
    const smtpPort = Number(process.env.SMTP_PORT || "465")
    const smtpUser = process.env.SMTP_USER?.trim()
    const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "").trim()

    if (!smtpHost || !smtpUser || !smtpPass || Number.isNaN(smtpPort)) {
      console.error("signup-garage-employee: SMTP non configuré")
      return NextResponse.json({ ok: false, error: "Service email non disponible." }, { status: 500 })
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
      subject: "Confirmez votre inscription employé : PitStop",
      text: `Bonjour ${body.name},\n\nCliquez sur ce lien pour confirmer votre inscription (valable 24 h) :\n${verifyUrl}\n\nSi vous n'avez pas demandé cette inscription, ignorez cet email.`,
      html: buildVerificationEmail(body.name, verifyUrl),
    })

    return NextResponse.json({ ok: true, pendingVerification: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Formulaire invalide." }, { status: 400 })
    }
    console.error("signup-garage-employee error:", error)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
