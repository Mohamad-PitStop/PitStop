import { NextResponse } from "next/server"
import { createHash, randomBytes } from "node:crypto"
import nodemailer from "nodemailer"
import { z } from "zod"
import { findAccountByEmail } from "@/lib/accounts-db"
import { hashPassword } from "@/lib/auth-password"
import { upsertPendingVerification } from "@/lib/email-verification-db"
import { upsertPendingGarageRegistration } from "@/lib/pending-garage-registration-db"
import { buildVerificationEmail } from "@/app/api/auth/resend-verification/route"
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import { isValidBelgianPostalCode, normalizePostalCode } from "@/lib/signup-location"
import { GARAGE_SPECIALTIES, type GarageSpecialty } from "@/lib/garage-specialties"

export const runtime = "nodejs"

const SIGNUP_RATE_LIMIT = { name: "signup-garage", maxRequests: 3, windowSeconds: 60 * 60 }
const VERIFY_EXPIRY_SECONDS = 60 * 60 * 24

const BusinessHoursRangeSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
})

const BusinessHoursSchema = z.object({
  mon: z.array(BusinessHoursRangeSchema),
  tue: z.array(BusinessHoursRangeSchema),
  wed: z.array(BusinessHoursRangeSchema),
  thu: z.array(BusinessHoursRangeSchema),
  fri: z.array(BusinessHoursRangeSchema),
  sat: z.array(BusinessHoursRangeSchema),
  sun: z.array(BusinessHoursRangeSchema),
})

const GarageSignupSchema = z.object({
  // Données entreprise
  companyName: z.string().trim().min(2).max(200),
  bceTvaNumber: z.string().trim().min(8).max(20),
  street: z.string().trim().min(2).max(200),
  postalCode: z.string().trim().min(4).max(12),
  city: z.string().trim().min(2).max(80),
  iban: z.string().trim().min(16).max(34),
  professionalPhone: z.string().trim().min(8).max(20),
  professionalEmail: z.string().trim().email().max(160),
  managerName: z.string().trim().min(2).max(120),
  specialties: z.array(z.string()).min(1),
  businessHours: BusinessHoursSchema,
  // Compte personnel
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(128),
})

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

function isValidIBAN(iban: string): boolean {
  const cleaned = iban.replace(/\s+/g, "").toUpperCase()
  return /^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/.test(cleaned)
}

function isValidBCE(bce: string): boolean {
  const cleaned = bce.replace(/[\s.]/g, "")
  // Belgian BCE: 10 digits starting with 0 or 1, or format with dots like 0XXX.XXX.XXX
  return /^\d{9,10}$/.test(cleaned) || /^BE\d{10}$/.test(cleaned)
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(SIGNUP_RATE_LIMIT, ip)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

    const body = GarageSignupSchema.parse(await req.json())
    const email = body.email.toLowerCase()

    // Validations métier
    const postalNorm = normalizePostalCode(body.postalCode)
    if (!isValidBelgianPostalCode(postalNorm)) {
      return NextResponse.json(
        { ok: false, error: "Indiquez un code postal belge valide (4 chiffres)." },
        { status: 400 }
      )
    }
    if (!isValidIBAN(body.iban)) {
      return NextResponse.json(
        { ok: false, error: "L'IBAN renseigné n'est pas valide." },
        { status: 400 }
      )
    }
    if (!isValidBCE(body.bceTvaNumber)) {
      return NextResponse.json(
        { ok: false, error: "Le numéro BCE/TVA n'est pas valide." },
        { status: 400 }
      )
    }
    // Valider les spécialités
    const validSpecialties = body.specialties.filter((s) =>
      (GARAGE_SPECIALTIES as readonly string[]).includes(s)
    ) as GarageSpecialty[]
    if (validSpecialties.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Sélectionnez au moins une spécialité." },
        { status: 400 }
      )
    }

    // Vérifier que le compte n'existe pas
    const exists = await findAccountByEmail(email)
    if (exists) {
      return NextResponse.json({ ok: false, error: "Un compte existe déjà avec cet e-mail." }, { status: 409 })
    }

    // Hash du mot de passe
    const passwordHash = hashPassword(body.password)

    // Token de vérification email
    const token = randomBytes(32).toString("hex")
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + VERIFY_EXPIRY_SECONDS * 1000)

    // Stocker la vérification email (même flux que l'inscription classique)
    await upsertPendingVerification({
      email,
      name: body.name,
      passwordHash,
      tokenHash,
      expiresAt,
      postalCode: postalNorm,
      city: body.city.trim(),
    })

    // Stocker les données garage en attente
    await upsertPendingGarageRegistration({
      email,
      type: "owner",
      garageData: {
        companyName: body.companyName,
        bceTvaNumber: body.bceTvaNumber,
        street: body.street,
        postalCode: postalNorm,
        city: body.city.trim(),
        iban: body.iban.replace(/\s+/g, "").toUpperCase(),
        professionalPhone: body.professionalPhone,
        professionalEmail: body.professionalEmail,
        managerName: body.managerName,
        specialties: validSpecialties,
        businessHours: body.businessHours,
      },
    })

    // Envoi email
    const smtpHost = process.env.SMTP_HOST?.trim()
    const smtpPort = Number(process.env.SMTP_PORT || "465")
    const smtpUser = process.env.SMTP_USER?.trim()
    const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "").trim()

    if (!smtpHost || !smtpUser || !smtpPass || Number.isNaN(smtpPort)) {
      console.error("signup-garage: SMTP non configuré")
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
      subject: "Confirmez votre inscription garage : PitStop",
      text: `Bonjour ${body.name},\n\nCliquez sur ce lien pour confirmer votre inscription garage (valable 24 h) :\n${verifyUrl}\n\nSi vous n'avez pas demandé cette inscription, ignorez cet email.`,
      html: buildVerificationEmail(body.name, verifyUrl),
    })

    return NextResponse.json({ ok: true, pendingVerification: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Formulaire invalide.", details: error.errors }, { status: 400 })
    }
    console.error("signup-garage error:", error)
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 })
  }
}
