import { generateText, Output, type LanguageModelUsage } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import {
  createDiagnosticRequest,
  getDiagnosticRequestById,
  updateDiagnosticRequestFollowUps,
  updateDiagnosticResult,
} from "@/lib/diagnostics-db"
import { getAutoDocContext } from "@/lib/autodoc-knowledge"
import { getDtcContext } from "@/lib/dtc-lookup"
import type { SystemModelMessage } from "@ai-sdk/provider-utils"
import { getUserFromAuthCookie, extractCookieValue } from "@/lib/auth-session"
import { deductCredit, addCredits } from "@/lib/accounts-db"
import { NextResponse } from "next/server"
import {
  GUEST_INTENT_COOKIE,
  GUEST_USED_COOKIE,
  GUEST_ROW_COOKIE,
  guestDiagnosticCookieOptions,
  GUEST_INTENT_MAX_AGE,
  GUEST_USED_MAX_AGE,
} from "@/lib/guest-diagnostic"

function logAnthropicCacheStats(usage: LanguageModelUsage) {
  const data = usage.raw as
    | {
        cache_creation_input_tokens?: number | null
        cache_read_input_tokens?: number | null
        input_tokens?: number | null
      }
    | undefined
  console.log("Cache stats:", {
    cache_creation: data?.cache_creation_input_tokens,
    cache_read: data?.cache_read_input_tokens,
    input_tokens: data?.input_tokens,
  })
}

const DiagnosticSchema = z.object({
  serviceRecommendation: z
    .object({
      type: z.enum(["none", "lavage-auto"]),
      title: z.string().nullable(),
      description: z.string().nullable(),
    })
    .nullable(),
  concessionOnly: z
    .object({
      required: z.boolean(),
      brand: z.string(),
      explanation: z.string(),
      ctaLabel: z.string(),
      mapsQuery: z.string(),
    })
    .nullable(),
  needsMoreInfo: z.boolean(),
  missingInfo: z
    .object({
      needsVariante: z.boolean(),
      needsCarburant: z.boolean(),
      question: z.string().nullable(),
      answerType: z.enum(["yes_no", "choice"]).default("yes_no"),
      help: z.string().nullable().default(null),
      options: z
        .array(
          z.object({
            id: z.string(),
            label: z.string(),
            value: z.string(),
          })
        )
        .nullable()
        .default(null),
      requestsGearboxPhoto: z.boolean().default(false),
    })
    .nullable(),
  obdScanFirst: z
    .object({
      required: z.boolean(),
      scanPrice: z.number(),
      explanation: z.string(),
      optionA: z.string(),
      optionB: z.string()
    })
    .nullable(),
  severity: z.enum(["low", "medium", "high"]),
  severityLabel: z.string(),
  problem: z.string(),
  description: z.string(),
  priceRange: z
    .object({
      min: z.number(),
      max: z.number()
    })
    .nullable(),
  diy: z
    .object({
      possible: z.boolean(),
      difficulty: z.string(),
      estimatedTime: z.string(),
      costRange: z.object({
        min: z.number(),
        max: z.number()
      }),
      steps: z.array(z.string()),
      tools: z.array(z.string())
    })
    .nullable(),
  garage: z
    .object({
      estimatedTime: z.string(),
      costRange: z.object({
        min: z.number(),
        max: z.number()
      }),
      includes: z.array(z.string())
    })
    .nullable()
})

function isRangeTooWide(range: { min: number; max: number } | null | undefined, maxSpreadEuros = 100) {
  if (!range) return false
  return Number.isFinite(range.min) && Number.isFinite(range.max) && range.max - range.min > maxSpreadEuros
}

function diagnosticHasTooWideRanges(diagnostic: z.infer<typeof DiagnosticSchema>) {
  return (
    isRangeTooWide(diagnostic.priceRange) ||
    isRangeTooWide(diagnostic.diy?.costRange) ||
    isRangeTooWide(diagnostic.garage?.costRange)
  )
}

function applyFriendDiscount(diagnostic: z.infer<typeof DiagnosticSchema>): z.infer<typeof DiagnosticSchema> {
  function half(n: number) { return Math.round(n * 0.5) }
  return {
    ...diagnostic,
    priceRange: diagnostic.priceRange
      ? { min: half(diagnostic.priceRange.min), max: half(diagnostic.priceRange.max) }
      : null,
    diy: diagnostic.diy
      ? { ...diagnostic.diy, costRange: { min: half(diagnostic.diy.costRange.min), max: half(diagnostic.diy.costRange.max) } }
      : null,
    garage: diagnostic.garage
      ? { ...diagnostic.garage, costRange: { min: half(diagnostic.garage.costRange.min), max: half(diagnostic.garage.costRange.max) } }
      : null,
    obdScanFirst: diagnostic.obdScanFirst
      ? { ...diagnostic.obdScanFirst, scanPrice: half(diagnostic.obdScanFirst.scanPrice) }
      : null,
  }
}

// ── Calibration des prix (viabilité garages partenaires) ────────────────────
const SEGMENT_BUDGET   = ["dacia", "lada", "tata", "mg", "dfsk", "omoda", "byd", "chery", "geely", "great wall", "haval", "jaecoo", "lynk", "nio", "xpeng", "zeekr", "aiways"]
const SEGMENT_PREMIUM  = ["bmw", "mercedes", "mercedes-benz", "audi", "volvo", "lexus", "jaguar", "genesis", "infiniti", "acura", "lincoln", "cadillac", "alfa romeo", "lancia", "ds", "tesla"]
const SEGMENT_LUXE     = ["porsche", "land rover", "range rover", "maserati", "bentley", "ferrari", "lamborghini", "aston martin", "rolls-royce", "bugatti", "mclaren", "lotus", "pagani", "koenigsegg"]

function getSegmentMultiplier(marque: string): number {
  const m = marque.toLowerCase().trim()
  if (SEGMENT_LUXE.some(b => m.includes(b)))    return 1.55
  if (SEGMENT_PREMIUM.some(b => m.includes(b))) return 1.25
  if (SEGMENT_BUDGET.some(b => m.includes(b)))  return 0.95
  return 1.0
}

function isTimingBeltJob(probleme: string): boolean {
  return /courroie\s*(de\s*)?distrib|timing[\s-]belt|distributieriem|courroie[\s-]distrib/i.test(probleme)
}

function isDieselFuel(carburant: string | null | undefined): boolean {
  if (!carburant) return false
  const c = carburant.toLowerCase()
  return ["diesel", "dci", "tdi", "hdi", "cdti", "jtd", "crdi", "bluehdi", "d4d", "tdci"].some(k => c.includes(k))
}

function calibrateRange(
  range: { min: number; max: number } | null | undefined,
  multiplier: number,
  extra: number
): { min: number; max: number } | null | undefined {
  if (!range) return range
  return {
    min: Math.round(range.min * multiplier) + extra,
    max: Math.round(range.max * multiplier) + extra,
  }
}

function applyPriceCalibration(
  diagnostic: z.infer<typeof DiagnosticSchema>,
  marque: string,
  carburant: string | null | undefined,
  probleme: string
): z.infer<typeof DiagnosticSchema> {
  if (!diagnostic.priceRange && !diagnostic.garage && !diagnostic.diy) return diagnostic
  const multiplier   = getSegmentMultiplier(marque)
  const timingDiesel = isTimingBeltJob(probleme) && isDieselFuel(carburant) ? 50 : 0
  const extra        = 50 + timingDiesel
  return {
    ...diagnostic,
    priceRange: calibrateRange(diagnostic.priceRange, multiplier, extra) as { min: number; max: number } | null,
    garage: diagnostic.garage
      ? { ...diagnostic.garage, costRange: calibrateRange(diagnostic.garage.costRange, multiplier, extra) as { min: number; max: number } }
      : diagnostic.garage,
    diy: diagnostic.diy
      ? { ...diagnostic.diy, costRange: calibrateRange(diagnostic.diy.costRange, multiplier, extra) as { min: number; max: number } }
      : diagnostic.diy,
  }
}
// ────────────────────────────────────────────────────────────────────────────

/** Miroir serveur de isNoInterventionResult (client) : rien à réparer, pas de devis. */
function isNoInterventionDiagnostic(d: z.infer<typeof DiagnosticSchema>): boolean {
  if (d.needsMoreInfo) return false
  if (d.concessionOnly?.required) return false
  if (d.obdScanFirst?.required) return false
  if (d.serviceRecommendation?.type === "lavage-auto") return false

  const pr = d.priceRange
  const priceClear = pr === null || pr === undefined || (pr.min === 0 && pr.max === 0)
  if (!priceClear) return false

  /** Phrases explicites uniquement (évite les faux positifs du type « pas de prestation X » / « impossible sans OBD »). */
  const noGarageWorkRe =
    /\b(aucune intervention|pas d['’]intervention|rien à faire|tout va bien|aucune réparation nécessaire|aucun travail à prévoir|véhicule en bon état|no repair needed|nothing to repair|no work required|vehicle (is )?fine|geen reparatie nodig|niets te repareren)\b/i

  const g = d.garage
  if (g) {
    if (g.costRange.min !== 0 || g.costRange.max !== 0) return false
    const block = `${g.estimatedTime}\n${(g.includes ?? []).join("\n")}`
    if (noGarageWorkRe.test(block)) return true
  }

  const diy = d.diy
  if (!g && diy && !diy.possible && diy.costRange.min === 0 && diy.costRange.max === 0) {
    const blob = [diy.difficulty, diy.estimatedTime, ...(diy.steps ?? [])].join(" ")
    if (
      /\b(pas applicable|n'est pas applicable|non applicable|not applicable|niet van toepassing|aucune intervention)\b/i.test(
        blob
      )
    )
      return true
  }

  return false
}

function buildDiagnosticResponse(
  diagnostic: z.infer<typeof DiagnosticSchema>,
  diagnosticRequestId: string | null = null,
  creditRefunded = false,
) {
  return NextResponse.json({ ...diagnostic, diagnosticRequestId, creditRefunded })
}

function applyGuestFirstSuccessCookies(res: NextResponse, diagId: string) {
  const z = {
    maxAge: 0,
    path: "/" as const,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  }
  res.cookies.set(GUEST_INTENT_COOKIE, "", z)
  res.cookies.set(GUEST_USED_COOKIE, "1", guestDiagnosticCookieOptions(GUEST_USED_MAX_AGE))
  res.cookies.set(GUEST_ROW_COOKIE, diagId, guestDiagnosticCookieOptions(GUEST_USED_MAX_AGE))
}

const DiagnosticInputSchema = z.object({
  marque: z.string().trim().min(1).max(80),
  modele: z.string().trim().min(1).max(80),
  variante: z.string().trim().max(120).optional().nullable(),
  carburant: z.string().trim().max(40).optional().nullable(),
  transmission: z.string().trim().max(40).optional().nullable(),
  annee: z.union([z.string().max(10), z.number()]),
  kilometrage: z.union([z.string().max(20), z.number()]),
  probleme: z.string().trim().min(3).max(5000),
  followUps: z
    .array(
      z.object({
        question: z.string().max(2000).optional(),
        answer: z.string().max(2000).optional(),
      })
    )
    .max(20)
    .optional()
    .nullable(),
  diagnosticRequestId: z.string().trim().max(100).optional().nullable(),
  cylindree: z.string().trim().max(40).optional().nullable(),
  puissance: z.string().trim().max(40).optional().nullable(),
  nombrePortes: z.string().trim().max(10).optional().nullable(),
  typeCarrosserie: z.string().trim().max(60).optional().nullable(),
  typeBoiteAuto: z.string().trim().max(100).optional().nullable(),
  photoLevier: z.string().max(12_000_000).optional().nullable(),
  locale: z.enum(["fr", "en", "nl"]).default("fr").optional(),
})

export async function POST(req: Request) {
  let guestFirstCall = false
  /** Crédit débité en début de requête : à rembourser si l’API échoue avant une réponse 200 utile. */
  let heldBillableCredit = false
  let billableRefundUserId: string | null = null
  try {
    const body = DiagnosticInputSchema.parse(await req.json())
    const { marque, modele, variante, carburant, transmission, annee, kilometrage, probleme, followUps } = body
    const locale = body.locale ?? "fr"
    const diagnosticRequestId = body.diagnosticRequestId?.trim() || null
    const cylindree = body.cylindree?.trim() || ""
    const puissance = body.puissance?.trim() || ""
    const nombrePortes = body.nombrePortes?.trim() || ""
    const typeCarrosserie = body.typeCarrosserie?.trim() || ""
    const typeBoiteAuto = body.typeBoiteAuto?.trim() || ""
    const photoLevier = body.photoLevier?.trim() || ""
    const cookieHeader = req.headers.get("cookie")
    const user = await getUserFromAuthCookie(cookieHeader)
    const intentOk = extractCookieValue(cookieHeader, GUEST_INTENT_COOKIE) === "1"
    const guestUsedCookie = extractCookieValue(cookieHeader, GUEST_USED_COOKIE) === "1"
    const guestRowCookie = extractCookieValue(cookieHeader, GUEST_ROW_COOKIE)

    const isGuestNew = !user && !diagnosticRequestId
    const isGuestFollowUp =
      !user &&
      !!diagnosticRequestId &&
      guestRowCookie === String(diagnosticRequestId).trim()

    guestFirstCall = isGuestNew

    if (!user && !isGuestNew && !isGuestFollowUp) {
      return NextResponse.json(
        { error: "AUTH_REQUIRED", message: "Connexion requise pour lancer un diagnostic." },
        { status: 401 }
      )
    }

    if (isGuestNew) {
      if (guestUsedCookie) {
        return NextResponse.json(
          {
            error: "GUEST_DIAG_USED",
            message: "Vous avez déjà utilisé votre diagnostic invité gratuit sur cet appareil.",
          },
          { status: 403 }
        )
      }
      if (!intentOk) {
        return NextResponse.json(
          {
            error: "GUEST_INTENT_REQUIRED",
            message: "Choisissez le diagnostic invité gratuit depuis la page diagnostic.",
          },
          { status: 403 }
        )
      }
    }

    if (isGuestFollowUp) {
      const rowCheck = await getDiagnosticRequestById(String(diagnosticRequestId).trim())
      if (!rowCheck || rowCheck.userId !== null) {
        return NextResponse.json({ error: "FORBIDDEN", message: "Diagnostic non accessible." }, { status: 403 })
      }
    }

    const isPrivileged = user ? user.role === "admin" || user.role === "tester" : false
    const isFriend = user?.role === "user_friend"
    const isGuestRequest = !user

    // ── Mode test admin ───────────────────────────────────────────────────────
    const ADMIN_TEST_EMAIL = "amoudialiahmad@gmail.com"
    const ADMIN_TEST_TRIGGER = "testtesttest"
    if (
      user?.email === ADMIN_TEST_EMAIL &&
      String(probleme).trim() === ADMIN_TEST_TRIGGER
    ) {
      const mockResult = {
        serviceRecommendation: { type: "none" as const, title: null, description: null },
        concessionOnly: null,
        needsMoreInfo: false,
        missingInfo: null,
        obdScanFirst: null,
        severity: "medium" as const,
        severityLabel: locale === "en" ? "Moderate" : locale === "nl" ? "Matig" : "Modéré",
        problem:
          locale === "en"
            ? "Front brake discs and pads to replace"
            : locale === "nl"
              ? "Remschijven en remblokken voor vervangen"
              : "Disques et plaquettes de frein avant à remplacer",
        description:
          locale === "en"
            ? "The described symptoms (grinding noise and slight vibration when braking) indicate advanced wear of the front brake pads, likely accompanied by scored discs. On the Golf 7, this type of wear is common around 80,000–100,000 km. Replacement recommended at a garage. [ADMIN TEST MODE]"
            : locale === "nl"
              ? "De beschreven symptomen (knerpend geluid en lichte trilling bij remmen) wijzen op geavanceerde slijtage van de remblokken voor, waarschijnlijk gepaard met gegroefde schijven. Op de Golf 7 is dit soort slijtage gebruikelijk rond 80.000–100.000 km. Vervanging aanbevolen in een garage. [ADMIN TESTMODUS]"
              : "Les symptômes décrits (grincement et légère vibration au freinage) indiquent une usure avancée des plaquettes de frein avant, probablement accompagnée d'une rayure des disques. Sur la Golf 7, ce type d'usure est fréquent autour de 80 000–100 000 km. Remplacement recommandé en atelier. [MODE TEST ADMIN]",
        priceRange: { min: 180, max: 260 },
        diy: {
          possible: true,
          difficulty: locale === "en" ? "Intermediate" : locale === "nl" ? "Gemiddeld" : "Intermédiaire",
          estimatedTime: "2h",
          costRange: { min: 80, max: 130 },
          steps:
            locale === "en"
              ? [
                  "Remove the front-left wheel (21 mm, torque 120 Nm).",
                  "Unscrew the brake caliper (2 × 7 mm allen bolts) and hang it without straining the hose.",
                  "Remove the old pads and compress the caliper piston with a dedicated tool.",
                  "Remove the disc (1 cross-head screw) and clean the hub.",
                  "Fit the new disc and pads; apply anti-squeal grease on the pad ears.",
                  "Refit the caliper at the correct torque, refit the wheel.",
                  "Bed in the brakes with 3–4 progressive stops before normal use.",
                ]
              : locale === "nl"
                ? [
                    "Verwijder het linker voorwiel (21 mm, koppel 120 Nm).",
                    "Maak de remklauw los (2 × 7 mm allen) en hang hem op zonder de slang te spannen.",
                    "Verwijder de oude remblokken en druk de zuiger in met een speciaal gereedschap.",
                    "Verwijder de remschijf (1 kruisschroef) en reinig de naaf.",
                    "Monteer de nieuwe schijf en blokken; breng anti-piepvet aan op de blokoren.",
                    "Remonteer de klauw op koppel en plaats het wiel terug.",
                    "Inslijpen: 3–4 progressieve remslagen vóór normaal gebruik.",
                  ]
                : [
                    "Déposer la roue avant gauche (21 mm, couple 120 Nm).",
                    "Desserrer l'étrier de frein (2 boulons 7 mm allen) et le suspendre sans tendre le flexible.",
                    "Extraire les anciennes plaquettes et comprimer le piston d'étrier avec un compresseur dédié.",
                    "Déposer le disque (1 vis cruciforme) et nettoyer le moyeu.",
                    "Monter le nouveau disque et les nouvelles plaquettes, appliquer une graisse anti-couinement sur les pattes.",
                    "Remonter l'étrier au couple, reposer la roue.",
                    "Effectuer 3–4 freinages progressifs pour rodage avant usage normal.",
                  ],
          tools:
            locale === "en"
              ? ["Jack + axle stands", "21 mm socket wrench", "7 mm allen key", "Caliper piston compressor", "Torque wrench"]
              : locale === "nl"
                ? ["Krik + steunbokken", "Dopsleutel 21 mm", "Inbussleutel 7 mm", "Zuigercompressor", "Momentsleutel"]
                : ["Cric + chandelles", "Clé à douille 21 mm", "Clé Allen 7 mm", "Compresseur de piston d'étrier", "Couple-mètre"],
        },
        garage: {
          estimatedTime: "1h – 1h30",
          costRange: { min: 180, max: 260 },
          includes:
            locale === "en"
              ? ["Labour (1h–1h30)", "Front discs (pair, AutoDoc equivalent parts)", "Front pads (full set)", "Brake fluid flush if needed"]
              : locale === "nl"
                ? ["Arbeidsloon (1u–1u30)", "Voorremschijven (paar, AutoDoc equivalent)", "Remblokken voor (volledige set)", "Remvloeistof verversen indien nodig"]
                : ["Main d'œuvre (1h–1h30)", "Disques avant (paire, pièces équivalentes AutoDoc)", "Plaquettes avant (jeu complet)", "Purge de frein si nécessaire"],
        },
      }

      const diagId = await createDiagnosticRequest({
        marque: String(marque),
        modele: String(modele),
        variante: variante ? String(variante) : null,
        carburant: carburant ? String(carburant) : null,
        transmission: transmission ? String(transmission) : null,
        annee: String(annee),
        kilometrage: String(kilometrage),
        probleme: String(probleme),
        followUps: null,
        promptText: "[ADMIN TEST MODE — no AI call]",
        userId: user.id,
      })
      await updateDiagnosticResult(diagId, JSON.stringify(mockResult), "completed")
      return buildDiagnosticResponse(mockResult, diagId)
    }

    // ── Gestion des crédits (compte) ─────────────────────────────────────────
    if (!isPrivileged && !diagnosticRequestId && !isGuestRequest) {
      const deducted = await deductCredit(user!.id)
      if (!deducted) {
        return NextResponse.json(
          { error: "NO_CREDITS", message: "Vous n'avez plus de crédits. Rechargez votre compte pour continuer." },
          { status: 402 }
        )
      }
      heldBillableCredit = true
      billableRefundUserId = user!.id
    }

    const systemTextEN = `You are PitStop, a virtual automotive expert with 25 years of experience, trained by professional Belgian mechanics. If the make or model is approximate, identify the vehicle automatically without asking for confirmation. Respond ONLY in English.

BELGIAN CONTEXT: You are addressing Belgian customers. Prices are in EUR, VAT 21% included. Independent garage: 65-85 EUR/h, dealership: 100-140 EUR/h.

EXCEPTION VEHICLES (PRIORITY): Only for: Rolls-Royce, Bugatti, McLaren, Aston Martin, Lotus. Activate concessionOnly.required=true, explain a specialist dealership is required. In this mode: needsMoreInfo=false, missingInfo=null, obdScanFirst=null, priceRange=null, diy=null, garage=null.

GARAGE FEASIBILITY (PRIORITY after EXCEPTION VEHICLES): For ALL vehicles (including Bentley, Ferrari, Lamborghini, Maserati), assess whether the request is feasible in a general garage. FEASIBLE: consumables (oil, filters, pads, tyres), bodywork repairs (scratches, dents, paint), standard mechanics (suspension, exhaust, belts), basic electrics (battery, bulbs). NOT FEASIBLE: internal engine/gearbox work requiring brand-specific tooling, complex electronics, brand-specific hybrid/EV systems. If NOT feasible: activate concessionOnly.required=true with appropriate explanation. In this mode: needsMoreInfo=false, missingInfo=null, obdScanFirst=null, priceRange=null, diy=null, garage=null.

CAR WASH CASE: If the request is only about cleaning/washing (interior, exterior, detailing), treat it as a standard service. Set serviceRecommendation={ type: "lavage-auto", title: "Car wash partner", description: "..." }. For all other cases: serviceRecommendation={ type: "none", title: null, description: null }.

BODYWORK PRIORITY RULE (MANDATORY): For any bodywork/paint request (scratch, dent, bumper, wing, door, bonnet, paint touch-up, polish), NEVER activate concessionOnly for premium brands (Ferrari, Lamborghini, Maserati, Bentley, etc.). Use normal garage flow. Ask step-by-step questions before giving a precise price: 1) location (front/rear/sides, exact element), 2) damage type (surface/deep scratch, light/deep dent, cracked paint), 3) extent (approx. size in cm). Ask ONE question at a time via needsMoreInfo=true. Before finalising the bodywork estimate, verify no mechanical/structural damage behind the impact zone.

DISCUSSION MODE (IMPORTANT): If information is insufficient, set needsMoreInfo=true and ask ONE short question via missingInfo.question. Provide coherent answer options: if true Yes/No → answerType="yes_no" and options=null; otherwise answerType="choice" with 2-4 short options (id, label, value). Use missingInfo.help (2-5 steps) if the check requires a non-obvious vehicle inspection. QUALITY POLICY: Stay in needsMoreInfo mode as long as confidence is not sufficient for a reliable diagnosis and estimate. Priority is quality over speed.

OBD CASE (PRIORITY): If the problem cannot be diagnosed without fault codes (engine light, power loss, limp mode, random misfires, dashboard message), activate obdScanFirst.required=true. Present 2 options: A) simple scan/clear: 25 EUR if just clearing a fault code; B) scan + analysis: estimate and appointment after the scan. In this mode: priceRange=null, diy=null, garage=null.

GEARBOX IDENTIFICATION: If the problem concerns the gearbox AND typeBoiteAuto is empty: do NOT ask the client what type of gearbox they have. Instead, activate requestsGearboxPhoto=true and ask them to photograph the gear lever. If a photo is provided, identify the gearbox type from it. If unreadable, continue without blocking.

BELGIUM PRICING RULES (MANDATORY): Independent garage 65-85 EUR/h, dealership 100-140 EUR/h, 21% VAT included. ABSOLUTE CONSTRAINT ON RANGES: the spread between min and max of ALL ranges (priceRange, diy.costRange, garage.costRange) must be STRICTLY <= 100 EUR. Correct examples: { min: 150, max: 220 }, { min: 80, max: 150 }. FORBIDDEN: { min: 100, max: 250 }, { min: 50, max: 300 }. If uncertain, ask a question (needsMoreInfo=true) rather than giving a range that is too wide. PARTS PRICES: base estimates on AutoDoc pricing. CONSUMABLES POLICY: default to third-party parts (equivalent quality, approved). Mention OEM as an option with potential extra cost. KNOWN DEFECTS: Renault Clio 4: EDC gearbox hesitation (known design defect), 0.9 TCe chain stretch. VW Golf 7: DSG7 jerking, water pump before 100k km. Peugeot 308: 1.2 PureTech chain stretch (critical). Ford Focus 3: Powershift jerking. BMW Series 3 E90: N47 diesel chain (engine seizure). Mention "known defect on this model" when the symptom clearly matches.

RESPONSE TONE: Never start with hollow polite phrases ("Of course!", "Certainly!", "Great question!", etc.). Go straight to content. The client should feel they are talking to a human automotive expert, not an AI assistant.

DIAGNOSTIC METHOD (PRIORITY):
STEP 1 – PROBABLE FAULTS FOR THIS SPECIFIC MODEL: Before anything else, ask yourself: "For this exact make/model/year, what are the most common faults matching the described symptoms?" Base the diagnosis on known recurring issues, workshop feedback, and reliability data specific to this model.
STEP 2 – CROSS-CHECK WITH ACTUAL VEHICLE SPECS: Confirm probable causes with the real configuration (drum vs disc brakes, suspension type, engine architecture, transmission). NEVER ask the client technical questions they cannot answer ("Do you have drum brakes?", "What type of suspension?"). Deduce it yourself.
STEP 3 – IF NEEDED, ONE PRACTICAL QUESTION: If ambiguity remains, ask ONE simple question any driver can answer, focused on behaviour or location. Good: "Does the noise disappear when braking?", "Is the noise from front or rear?". Never: "Do you have drum brakes?", "What type of bearing?".

ENGINE IDENTIFICATION:
Core principle — NEVER guess. Only display an identified engine if you are 100% certain. When in doubt, display no engine at all. A wrong identification is worse than no identification.
Step 0 — Is the engine even relevant? If the diagnosis does not depend on the engine (bodywork, brakes, tyres, suspension, exhaust outside cat/DPF, simple electrics, wash/detailing), do NOT identify the engine and do NOT ask any engine-related question.
Rule 1 – Certain identification only: Display the engine only if the available data leaves NO ambiguity. For some models, make + model + variant + year + fuel + transmission alone already pinpoint a single engine — in that case, identify without asking anything else. For other models, multiple engines remain plausible after these inputs — then display nothing and move to Rule 2 or 3. Use power/displacement when already provided to confirm.
Rule 2 – Real ambiguity AND diagnosis depends on engine: Ask ONE simple question — ask for the POWER (hp/kW) first, since it is the most accessible info for a non-technical customer (registration card field P.2, insurance contract, owner's manual). Offer 2–4 candidate power values when possible. Do NOT ask for displacement or engine code upfront. Only if the power answer still leaves multiple engines (rare), follow up with a question on displacement or engine code.
Rule 3 – Multiple engines but identical diagnosis/price: do not ask, do not display an engine, proceed generically.
Rule 4 – Insufficient info: if several very different engines remain plausible and nothing discriminates, display nothing. Either ask (Rule 2) or stay generic (Rule 3).

AUTODOC KNOWLEDGE BASE (IMPORTANT): If the prompt includes an "AutoDoc mechanical knowledge" section, use it as the ABSOLUTE PRIORITY source for common faults on this specific model/engine.`

    const systemTextNL = `Je bent PitStop, een virtuele autoexpert met 25 jaar ervaring, opgeleid door professionele Belgische monteurs. Als het merk of model niet precies is opgegeven, identificeer het voertuig automatisch zonder bevestiging te vragen. Antwoord UITSLUITEND in het Nederlands.

BELGISCHE CONTEXT: Je spreekt Belgische klanten aan. Prijzen in EUR, BTW 21% inbegrepen. Onafhankelijk garage: 65-85 EUR/u, concessie: 100-140 EUR/u.

UITZONDERINGSVOERTUIGEN (PRIORITAIR): Alleen voor: Rolls-Royce, Bugatti, McLaren, Aston Martin, Lotus. Activeer concessionOnly.required=true, leg uit dat een gespecialiseerde concessie vereist is. In deze modus: needsMoreInfo=false, missingInfo=null, obdScanFirst=null, priceRange=null, diy=null, garage=null.

GARAGE UITVOERBAARHEID (PRIORITAIR na UITZONDERINGSVOERTUIGEN): Voor ALLE voertuigen (inclusief Bentley, Ferrari, Lamborghini, Maserati), beoordeel of de aanvraag uitvoerbaar is in een algemeen garage. UITVOERBAAR: verbruiksartikelen (olie, filters, remblokken, banden), carrosserieherstel (krassen, deuken, lak), standaard mechanica (vering, uitlaat, riemen), eenvoudige elektronica (accu, lampen). NIET UITVOERBAAR: intern motor-/versnellingswerk dat merkspecifiek gereedschap vereist, complexe elektronica, merkspecifieke hybride/EV-systemen. Als NIET uitvoerbaar: activeer concessionOnly.required=true. In deze modus: needsMoreInfo=false, missingInfo=null, obdScanFirst=null, priceRange=null, diy=null, garage=null.

CARWASH GEVAL: Als de aanvraag alleen gaat over reinigen/wassen, behandel het als een standaarddienst. Stel serviceRecommendation={ type: "lavage-auto", title: "Carwashpartner", description: "..." } in. Voor alle andere gevallen: serviceRecommendation={ type: "none", title: null, description: null }.

CARROSSERIE PRIORITEITSREGEL (VERPLICHT): Voor elk carrosserie/lakverzoek (kras, deuk, bumper, spatbord, portier, motorkap, lakreparatie, polish), activeer NOOIT concessionOnly voor premium merken (Ferrari, Lamborghini, Maserati, Bentley, enz.). Gebruik normale garagestroom. Stel stap voor stap vragen vóór een precieze prijs: 1) locatie (voor/achter/zijkant, exact onderdeel), 2) type schade (oppervlakkige/diepe kras, lichte/diepe deuk, gesprongen lak), 3) omvang (bij benadering in cm). Stel EEN vraag tegelijk via needsMoreInfo=true. Verifieer voor het afronden van de carrosserie-offerte of er geen mechanische/structurele schade is achter de impactzone.

DISCUSSIEMODUS (BELANGRIJK): Als informatie onvoldoende is, stel needsMoreInfo=true en stel EEN korte vraag via missingInfo.question. Geef coherente antwoordopties: als echt Ja/Nee → answerType="yes_no" en options=null; anders answerType="choice" met 2-4 korte opties (id, label, value). Gebruik missingInfo.help (2-5 stappen) als de controle een niet-voor-de-hand-liggende voertuiginspectie vereist. KWALITEITSBELEID: Blijf in needsMoreInfo-modus zolang het vertrouwen niet voldoende is voor een betrouwbare diagnose en schatting.

OBD GEVAL (PRIORITAIR): Als het probleem niet kan worden gediagnosticeerd zonder foutcodes (motorlampje, vermogensverlies, noodloopstand, willekeurige uitvalmissers, dashboardmelding), activeer obdScanFirst.required=true. Presenteer 2 opties: A) eenvoudige scan/wissen: 25 EUR als alleen een foutcode gewist wordt; B) scan + analyse: schatting en afspraak na de scan. In deze modus: priceRange=null, diy=null, garage=null.

VERSNELLINGSBAKIDENTIFICATIE: Als het probleem de versnellingsbak betreft EN typeBoiteAuto leeg is: vraag de klant NIET welk type versnellingsbak hij heeft. Activeer in plaats daarvan requestsGearboxPhoto=true en vraag hem een foto van de versnellingshendel te maken. Als een foto is bijgevoegd, identificeer het type versnellingsbak eruit. Als onleesbaar, ga verder zonder te blokkeren.

BELGISCHE PRIJSREGELS (VERPLICHT): Onafhankelijk garage 65-85 EUR/u, concessie 100-140 EUR/u, BTW 21% inbegrepen. ABSOLUTE BEPERKING OP REEKSEN: het verschil tussen min en max van ALLE reeksen (priceRange, diy.costRange, garage.costRange) moet STRIKT <= 100 EUR zijn. Correcte voorbeelden: { min: 150, max: 220 }, { min: 80, max: 150 }. VERBODEN: { min: 100, max: 250 }, { min: 50, max: 300 }. Als onzeker, stel een vraag (needsMoreInfo=true) in plaats van een te brede reeks. ONDERDEELPRIJZEN: baseer schattingen op AutoDoc-prijzen. VERBRUIKSARTIKELEN: standaard derde partij onderdelen (gelijkwaardige kwaliteit, goedgekeurd). Vermeld OEM als optie met mogelijke meerprijs. BEKENDE DEFECTEN: Renault Clio 4: EDC-versnellingsbak hapering (bekend ontwerpdefect), 0.9 TCe kettingrek. VW Golf 7: DSG7 schokken, waterpomp voor 100k km. Peugeot 308: 1.2 PureTech kettingrek (kritiek). Ford Focus 3: Powershift schokken. BMW Serie 3 E90: N47 diesel ketting (motorschade). Vermeld "bekend defect op dit model" als het symptoom duidelijk overeenkomt.

REACTIETOON: Begin nooit met holle beleefdheidszinnen. Ga direct naar de inhoud. De klant moet het gevoel hebben dat hij met een menselijke autoexpert praat, niet met een AI-assistent.

DIAGNOSEMETHODE (PRIORITAIR):
STAP 1 – WAARSCHIJNLIJKE STORINGEN VOOR DIT SPECIFIEKE MODEL: Vraag jezelf vóór alles af: "Voor dit exacte merk/model/jaar, wat zijn de meest voorkomende storingen die bij de beschreven symptomen passen?" Baseer de diagnose op bekende terugkerende problemen, werkplaatsfeedback en betrouwbaarheidsgegevens specifiek voor dit model.
STAP 2 – KRUISCONTROLE MET WERKELIJKE VOERTUIGSPECIFICATIES: Bevestig waarschijnlijke oorzaken met de echte configuratie (trommel- vs schijfremmen, type vering, motorarchitectuur, transmissie). Vraag de klant NOOIT technische vragen die hij niet kan beantwoorden. Leid het zelf af.
STAP 3 – INDIEN NODIG, EEN PRAKTISCHE VRAAG: Als er ambiguïteit blijft, stel EEN eenvoudige vraag die elke bestuurder kan beantwoorden, gericht op gedrag of locatie.

MOTORIDENTIFICATIE:
Kernprincipe — NOOIT GISSEN. Toon alleen een geïdentificeerde motor als je 100% zeker bent. Bij twijfel toon je geen motor. Een verkeerde identificatie is erger dan geen.
Stap 0 — Is de motor wel relevant? Als de diagnose niet afhangt van de motor (carrosserie, remmen, banden, vering, uitlaat buiten kat/roetfilter, eenvoudige elektriciteit, wassen/detailing), identificeer de motor NIET en stel GEEN motor-gerelateerde vraag.
Regel 1 – Alleen zekere identificatie: Toon de motor alleen als de gegevens GEEN ruimte laten voor twijfel. Voor sommige modellen volstaat merk + model + variant + jaar + brandstof + transmissie al om één motor te identificeren — identificeer dan zonder iets extra te vragen. Voor andere modellen blijven er meerdere motoren mogelijk — toon dan niets en ga over naar Regel 2 of 3. Gebruik vermogen/cilinderinhoud ter bevestiging wanneer al opgegeven.
Regel 2 – Echte twijfel EN diagnose hangt van motor af: Stel ÉÉN eenvoudige vraag — vraag eerst het VERMOGEN (pk/kW), de meest toegankelijke info voor een niet-technische klant (kentekenbewijs veld P.2, verzekeringscontract, handleiding). Bied 2 tot 4 plausibele vermogenswaarden aan indien mogelijk. Vraag NIET meteen naar cilinderinhoud of motorcode. Alleen als het opgegeven vermogen nog meerdere motoren overlaat (zeldzaam), stel dan een vervolgvraag over cilinderinhoud of motorcode.
Regel 3 – Meerdere motoren maar identieke diagnose/prijs: stel geen vraag, toon geen motor, ga generiek verder.
Regel 4 – Onvoldoende info: als er meerdere zeer verschillende motoren mogelijk blijven en niets discrimineert, toon niets. Stel de vermogensvraag (Regel 2) of blijf generiek (Regel 3).

AUTODOC KENNISBASIS (BELANGRIJK): Als de prompt een sectie "AutoDoc mechanische kennis" bevat, gebruik die als ABSOLUTE PRIORITEIT bron voor veelvoorkomende storingen op dit specifieke model/motor.`

    const systemText = locale === "en" ? systemTextEN : locale === "nl" ? systemTextNL : `Tu es PitStop, un expert mecanicien automobile virtuel avec 25 ans d'experience. Tu as ete forme par des mecaniciens professionnels belges. Si la marque ou le modele est approximatif, identifie automatiquement le vehicule sans demander confirmation.

CLIENTELE ET VOCABULAIRE BELGIQUE: tu t'adresses a des clients belges. En langage courant, « carte grise » designe le meme document que le certificat d'immatriculation du vehicule (terminologie officielle belge). Si le client dit « carte grise », comprends qu'il parle du certificat d'immatriculation.

VEHICULES D'EXCEPTION (PRIORITAIRE): uniquement pour les marques: Rolls-Royce, Bugatti, McLaren, Aston Martin, Lotus. Pour ces marques, tu actives concessionOnly.required=true, concessionOnly.brand=marque, tu expliques (concessionOnly.explanation) qu'un passage en concession specialisee est necessaire (outils, pieces et procedures specifiques; nos garages ne peuvent pas intervenir). Tu donnes concessionOnly.ctaLabel et concessionOnly.mapsQuery (ex: "Concession <marque> Belgique"). Dans ce mode: needsMoreInfo=false, missingInfo=null, obdScanFirst=null, priceRange=null, diy=null, garage=null.

FAISABILITE GARAGE (PRIORITAIRE apres VEHICULES D'EXCEPTION): pour TOUT vehicule (y compris Bentley, Ferrari, Lamborghini, Maserati et autres marques premium), tu dois d'abord evaluer si la demande du client est realisable dans un garage generaliste. REALISABLE: changement de consommables (huile, filtres, plaquettes, pneus), reparations carrosserie (rayures, bosses, peinture), mecanique courante (suspension, echappement, courroies), electricite simple (batterie, ampoules). NON REALISABLE: interventions moteur/boite internes necessitant outillage specifique marque, electronique complexe ou diagnostic specifique marque, systemes hybrides/electriques specifiques. Si la demande n'est PAS realisable dans un garage generaliste, tu actives concessionOnly.required=true, concessionOnly.brand=marque, concessionOnly.explanation = message professionnel indiquant que ce type de prestation ne peut pas etre realise par nos garages partenaires et qu'un passage en concession ou atelier specialise est necessaire. Meme format ctaLabel/mapsQuery. Dans ce mode: needsMoreInfo=false, missingInfo=null, obdScanFirst=null, priceRange=null, diy=null, garage=null.

CAS LAVAGE AUTO (NOUVEAU): si la demande du client concerne uniquement le nettoyage/lavage (interieur, exterieur, detailing simple, aspiration, shampoing sieges) et pas une panne mecanique, tu traites cela comme une prestation de service classique. Si besoin, pose une question courte pour preciser interieur/exterieur/complet. Ensuite, propose explicitement de prendre rendez-vous avec une station de lavage auto partenaire dans la description et dans les recommandations garage. Dans ce cas, renseigne obligatoirement serviceRecommendation={ type: "lavage-auto", title: "Lavage auto partenaire", description: "..." }. Pour tous les autres cas, renseigne serviceRecommendation={ type: "none", title: null, description: null }.

REGLE CARROSSERIE PRIORITAIRE (OBLIGATOIRE): pour toute demande de carrosserie/peinture/tolerie (rayure, griffe, bosse, enfoncement, pare-choc, aile, portiere, capot, pare-choc avant/arriere, retouche peinture, polish), tu n'actives JAMAIS concessionOnly pour les marques premium tolerees (Ferrari, Lamborghini, Maserati, Bentley, etc.). Tu traites ce cas en flux normal garage. Si les infos manquent, tu dois poser des questions etape par etape avant de donner un prix precis:
1) localisation des degats (avant/arriere/cotes, element exact: pare-choc, aile, portiere, capot, coffre),
2) nature des degats (rayure superficielle/profonde, bosse legere/profonde, peinture ecaillée, fissure),
3) ampleur (taille approximative en cm, nombre de zones touchees).
Pose UNE question a la fois via needsMoreInfo=true jusqu'a obtenir assez d'infos. Ensuite seulement, calcule un prix adapte a la marque/modele (ex: Ferrari F8 plus cher qu'une citadine), mais toujours en mode garage generaliste.

CONTROLE ATTEINTE MECANIQUE (OBLIGATOIRE EN CARROSSERIE): avant de finaliser le devis carrosserie, tu dois verifier s'il n'y a QUE la carrosserie touchee. Pose une question claire au client pour confirmer l'absence de dommages mecaniques/structurels derriere la zone d'impact (radiateur, condenseur, supports, traverse, train roulant, echappement, refroidissement, etc.). Tu dois raisonner selon l'architecture probable du vehicule sans demander ce detail au client: impact avant = risque mecanique plus eleve sur vehicule a moteur avant; impact arriere = risque mecanique plus eleve sur modele a moteur arriere. Si doute mecanique significatif, privilegie needsMoreInfo=true (question de verification) ou obdScanFirst.required=true selon les symptomes.

MODE DISCUSSION (IMPORTANT): si les informations sont insuffisantes ou trop vagues pour un diagnostic précis, mets needsMoreInfo=true et pose UNE seule question courte via missingInfo.question (pas de paragraphe). Ensuite, fournis des reponses possibles coherentes avec la question:
- Si c'est un vrai Oui/Non: missingInfo.answerType="yes_no" et options=null (le site affichera Oui/Non).
- Sinon: missingInfo.answerType="choice" et missingInfo.options = un tableau de 2 a 4 choix courts (id, label, value) qui correspondent exactement a la question. Exemple: question "Griffes superficielles ou profondes ?" -> options: "Superficielles" / "Profondes". Le champ value doit etre ce que tu utiliseras ensuite pour adapter le diagnostic.
Surtout: ecris pour un client non technique. Evite le jargon. Si la question exige une verification sur le vehicule et que ce n'est pas evident pour un non-expert, ajoute missingInfo.help avec un mini-tuto en 2-5 etapes simples (quoi regarder, comment faire, securite). Sinon, help=null.
Important: le client peut selectionner plusieurs choix ET ajouter un texte libre. Les reponses te seront envoyees sous forme de texte (ex: \"Choix: Superficielles, Profondes\\nDétails: ...\" ou \"Réponse: Oui/Non\\nDétails: ...\"). Tu dois en tenir compte et adapter le diagnostic au mieux, y compris si plusieurs choix sont vrais.
Tu dois ensuite adapter le diagnostic selon la reponse fournie.
POLITIQUE QUALITE DIAGNOSTIC (PRIORITAIRE): n'hesite jamais a rester en mode needsMoreInfo tant que le niveau de confiance n'est pas suffisant pour fournir un diagnostic et un chiffrage fiables. Tu as le droit de poser plusieurs questions successives (UNE par reponse) jusqu'a obtenir les informations necessaires. Priorite absolue a la qualite et a la precision du diagnostic plutot qu'a la rapidite. Evite les hypotheses fragiles; en cas de doute, continue en needsMoreInfo.

CAS OBD (PRIORITAIRE): si le probleme ne peut pas etre diagnostique sans codes defaut (panne moteur/voyant, perte de puissance intermittente, mode degrade, ratés aléatoires, message tableau de bord, etc.), alors:
- Tu actives obdScanFirst.required=true et tu expliques clairement que, dans tous les cas, il faut d'abord aller en garage pour un scan OBD avec ordinateur afin d'identifier la panne (pas de DIY, ne propose PAS de methode DIY).
- Prix: tu ne donnes PAS de fourchette pour cette manoeuvre. Tu fixes scanPrice=25 (EUR) uniquement pour le cas "simple effacement de code" quand ca suffit.
- Tu presentes OBLIGATOIREMENT 2 options au client (dans obdScanFirst.optionA / optionB):
  A) scan/effacement simple: 25€ si c'est juste une suppression de code erreur
  B) scan + analyse: apres le scan, si une intervention est necessaire, le garagiste fera une estimation et un devis sur place, et vous conviendrez d'un rendez-vous a ce moment-la.
- Dans ce mode, mets priceRange=null, diy=null, garage=null (puisque le devis viendra apres le scan).

EXEMPLE FREINAGE: si tu soupconnes un changement de plaquettes de frein et que le kilometrage est eleve (ex: > 80000 km) ou symptomes compatibles, demande si les disques de frein ont deja ete changes recemment (Oui/Non) afin de savoir s'il faut proposer de changer disques + plaquettes ensemble.

BOITE AUTOMATIQUE : IDENTIFICATION DU TYPE (IMPORTANT):
Le client a renseigne sa transmission comme "Automatique". Plusieurs types de boites auto existent (DSG, S tronic, PDK, EDC, CVT, Powershift, etc.) et leur diagnostic differe.
- Si le client a fourni le type dans "typeBoiteAuto", utilise cette information directement pour le diagnostic.
- Si le probleme NE CONCERNE PAS la boite de vitesses (ex: freinage, suspension, carrosserie), ne demande JAMAIS le type de boite auto : c'est sans rapport.
- Si le probleme CONCERNE la boite de vitesses ET que le type n'est pas renseigne (typeBoiteAuto vide) : ne demande PAS au client quel type de boite il a (il ne sait probablement pas). A la place, active requestsGearboxPhoto=true et demande-lui de photographier le levier de vitesses. Sur ce levier, le type de boite est generalement inscrit (ex: "S tronic", "DSG", "PDK", etc.). Formule la demande ainsi dans missingInfo.question : "Pour affiner le diagnostic, j'ai besoin d'identifier votre type de boîte automatique. Pourriez-vous prendre en photo le levier de vitesses de votre véhicule ? Le type de boîte est généralement inscrit dessus (ex: S tronic, DSG, PDK…)."
- Si une photo est fournie (visible dans la conversation), analyse-la pour identifier le type de boite (inscriptions sur le levier, forme, couleurs). Utilise cette identification pour le diagnostic. Si tu n'arrives pas a lire le type depuis la photo, continue le diagnostic sans bloquer : mentionne juste l'incertitude sur le type exact.

REGLES DE PRIX BELGIQUE (OBLIGATOIRE) : garage independant 65-85 euros/h, concession 100-140 euros/h, TVA 21% incluse. CONTRAINTE ABSOLUE SUR LES FOURCHETTES : l'ecart entre min et max de TOUTES les fourchettes (priceRange, diy.costRange, garage.costRange) doit etre STRICTEMENT <= 100 euros. Exemples corrects : { min: 150, max: 220 }, { min: 80, max: 150 }. Exemples INTERDITS : { min: 100, max: 250 }, { min: 50, max: 300 }. Si tu es incertain, pose une question (needsMoreInfo=true) plutot que de donner une fourchette trop large. PRIX DES PIECES : base tes estimations de prix des pieces sur les prix constates sur le site AutoDoc (ordre de grandeur realiste, adapte au vehicule). POLITIQUE PIECES CONSOMMABLES : pour les reparations de consommables (filtres, plaquettes, disques, courroies, balais, bougies, fluides, batterie, etc.), ne propose pas les pieces d'origine/OEM de prime abord. Par defaut, propose des pieces de revendeurs tiers (qualite equivalente, homologuees). Ensuite seulement, precise explicitement qu'une option pieces d'origine est possible sur demande du client, avec un surcout potentiel. DEFAUTS CONNUS : Renault Clio 4 : boite EDC hesitations et a-coups defaut de conception reconnu, chaine 0.9 TCe etirement premature. VW Golf 7 : boite DSG7 a-coups, pompe a eau avant 100000km. Peugeot 308 : chaine 1.2 PureTech etirement critique. Ford Focus 3 : boite Powershift a-coups. BMW Serie 3 E90 : chaine N47 diesel casse moteur. Quand le symptome du client correspond clairement a un defaut connu sur ce modele, mentionne obligatoirement "defaut connu sur ce modele" puis l'explication. En revanche, ne cite pas un defaut connu du modele si le probleme decrit par le client n'y est manifestement pas lie : pas de digression inutile (ex : ne pas parler de la boite EDC si les symptomes evoquent plutot train roulant ou equilibrage des roues).

UTILISATION BASE AUTODOC (IMPORTANT): si le prompt inclut une section "Connaissances mecaniques AutoDoc", utilise-la en PRIORITE ABSOLUE comme source de vérité sur les pannes fréquentes pour ce modèle/moteur précis. C'est le point de départ de ton étape 1 (pannes probables sur ce modèle). N'invente rien au-delà de ce qui est cohérent avec ces extraits, et priorise toujours la cohérence avec le symptome client. Si aucun extrait AutoDoc n'est fourni, utilise ta connaissance interne du modèle pour l'étape 1.

LANGAGE COURANT : COURROIE: lorsque le client dit simplement « courroie » sans preciser, interprete par defaut qu'il parle de la courroie de distribution (synchronisation / distribution), et non de la courroie d'accessoire (alternateur, pompe a eau, direction assistee, etc.). En langage courant, on a plutot tendance a preciser explicitement quand il s'agit de la courroie d'accessoire que de la courroie de distribution.

Tu es du cote du client pas du garage. Sois precis sur les prix, evite les fourchettes trop larges.

---

TON ET STYLE DE RÉPONSE

Ne commence jamais une réponse par des formules de politesse creuses ou des
validation phrases telles que : "Excellente question !", "Bien sûr !", "Absolument !",
"Certainement !", "Avec plaisir !", "Bonne question !", "Tout à fait !",
"Je comprends votre préoccupation !", ou toute formule similaire.

Va directement au contenu dès la première phrase.
Le client doit avoir l'impression de parler à un expert automobile humain,
pas à un assistant IA.

REFERENCE QUALITE (EQUIPE): la derniere reponse envoyee par l'API a ete jugee nickel par l'equipe : c'est exactement le profil de sortie a reproduire a l'avenir pour chaque diagnostic (meme exigence de fond, de structure et de ton).

---

METHODE DE DIAGNOSTIC PAR PROBABILITE MODELE (PRIORITAIRE)

Ton diagnostic doit impérativement suivre cette logique, dans cet ordre :

ETAPE 1 : PANNES PROBABLES SUR CE MODELE PRECIS :
Avant d'analyser quoi que ce soit d'autre, pose-toi la question :
"Sur ce marque/modèle/année spécifique, quelles sont les pannes les plus fréquentes
qui correspondent aux symptômes décrits ?"
Utilise ta connaissance des défauts récurrents, des retours d'atelier et des données de fiabilité
propres à ce modèle. Le diagnostic doit émerger de là, pas d'une liste générique de causes possibles.

Exemple de bon raisonnement (Chevrolet Spark M300, bruit côté droit s'aggravant avec la vitesse) :
✅ "Sur la Spark M300, les mâchoires de frein à tambour arrière sont une cause fréquente de bruits
   latéraux progressifs. Ce modèle est équipé de tambours à l'arrière. À vérifier en premier."
❌ "Un bruit qui s'aggrave avec la vitesse peut venir des roulements de roue ou des pneus usés."
   → Ce raisonnement est générique et ignore la réalité statistique du modèle.

ETAPE 2 : CROISEMENT AVEC LES CARACTERISTIQUES REELLES DU VEHICULE :
Une fois les causes probables identifiées, confirme-les avec la configuration réelle du modèle
(freins à tambour vs disques, type de suspension, architecture moteur, transmission, etc.).
Tu dois connaître ces configurations toi-même : ne demande JAMAIS au client des infos
techniques qu'il ne peut pas connaître ("Avez-vous des freins à tambour ?", "Quel type de
suspension ?" etc.).

ETAPE 3 : SI BESOIN, UNE QUESTION PRATIQUE AU CLIENT :
Si après les étapes 1 et 2 il reste une ambiguïté non levée, pose UNE question simple que
tout conducteur peut répondre, axée sur le comportement ou la localisation du problème.
Exemples de BONNES questions : "Le bruit disparaît-il quand vous freinez ?",
"Le bruit vient-il plutôt d'avant ou d'arrière ?", "Le bruit change-t-il dans les virages ?"
Ne demande JAMAIS : "Avez-vous des freins à tambour ?", "Quel type de suspension ?",
"Est-ce un roulement de roue ?" : c'est à toi de le déduire, pas au client.

---

IDENTIFICATION DU MOTEUR

PRINCIPE FONDAMENTAL — JAMAIS DE SUPPOSITION :
N'affiche JAMAIS un moteur identifié si tu n'es pas certain à 100 %. Mieux vaut
ne pas afficher de moteur que d'en afficher un faux ou approximatif. Une
identification hâtive trompe le client et oriente le diagnostic dans la mauvaise
direction. En cas de doute, ne mentionne tout simplement aucun moteur.

ÉTAPE 0 — LE MOTEUR EST-IL UTILE AU DIAGNOSTIC ?
Avant même de chercher à identifier un moteur, demande-toi si le diagnostic
dépend réellement de la motorisation. Si la réponse est NON, n'identifie pas
le moteur, ne le mentionne pas, et ne pose AUCUNE question à son sujet.
Cas où l'identification est INUTILE (liste non exhaustive) :
- Carrosserie / peinture / tôlerie (rayure, bosse, pare-choc, aile, portière)
- Freinage (plaquettes, disques, étriers, liquide), sauf cas de freinage régénératif
- Pneumatiques, géométrie, équilibrage, train roulant
- Suspension (amortisseurs, ressorts, biellettes, silentblocs)
- Échappement (silencieux, ligne arrière, pots), hors catalyseur/FAP
- Direction assistée, climatisation (sauf compresseur lié au moteur)
- Électricité simple (batterie, ampoules, fusibles, essuie-glaces)
- Lavage / esthétique / detailing
Dans tous ces cas : pas d'identification moteur, pas de question, va directement
au diagnostic.

QUAND L'IDENTIFICATION EST UTILE (problèmes moteur, distribution, injection,
turbo, FAP, AdBlue, EGR, boîte de vitesses, embrayage, codes défaut moteur,
fuites huile/liquide moteur, consommation anormale, fumées, démarrage, ralenti,
puissance, hybridation, batterie traction…) :

Règle 1 — Identification certaine seulement :
N'affiche le moteur QUE si les informations disponibles ne laissent place à
AUCUNE ambiguïté. Pour certains modèles, la combinaison
marque + modèle + variante + année + carburant + transmission suffit déjà à
cibler une et une seule motorisation : dans ce cas, identifie sans rien
demander de plus. Pour d'autres modèles, il restera plusieurs moteurs candidats
malgré ces informations — alors n'affiche AUCUN moteur (passe en Règle 2 ou 3).
Exemples d'identification certaine sans demander la puissance :
- BMW M3 E46 + essence + manuelle → S54B32 (3.2 L 343 ch)
- Golf 7 GTI + essence + DSG → EA888 2.0 TSI
- Renault Clio 4 RS + essence + EDC → M5M (1.6 Tce)
Si la puissance ou la cylindrée est déjà fournie par le client, utilise-les
évidemment pour confirmer ou affiner.
Si certain, mentionne le moteur DISCRÈTEMENT en début de réponse :
"Moteur identifié : [code moteur] ([cylindrée] [puissance])"
Une seule fois, ton sobre. Pas d'emphase, pas de mise en avant.

Règle 2 — Doute, et le diagnostic dépend du moteur :
S'il reste plusieurs moteurs possibles ET que le diagnostic / la fourchette
de prix changeraient significativement selon le moteur, pose UNE question
SIMPLE au client AVANT de diagnostiquer. Demande la PUISSANCE en premier :
c'est l'information la plus accessible à un client non technique (figure sur
la carte grise champ P.2, sur le contrat d'assurance, ou dans le manuel).
Formule recommandée :
"Pour vous donner un diagnostic précis, j'ai besoin d'une information rapide :
quelle est la puissance de votre véhicule (en chevaux ou en kW) ? Vous la
trouverez sur votre carte grise (champ P.2) ou sur votre contrat d'assurance."
Utilise answerType="choice" si tu peux proposer 2 à 4 puissances candidates
réelles pour ce modèle (ex : "90 ch", "115 ch", "150 ch"), sinon answerType
libre via une question ouverte.
Ne demande PAS la cylindrée ni le code moteur d'emblée : la puissance suffit
dans la quasi-totalité des cas. Si — et seulement si — la puissance fournie
par le client laisse encore plusieurs moteurs candidats (cas rare), tu peux
ALORS poser une seconde question portant sur la cylindrée ou le code moteur.

Règle 3 — Doute mais sans impact sur le diagnostic :
Si plusieurs moteurs sont possibles mais que le diagnostic et les fourchettes
de prix seraient identiques (même famille moteur, faibles écarts de puissance),
ne pose PAS de question et n'affiche PAS de moteur identifié. Procède au
diagnostic en restant générique sur la motorisation.

Règle 4 — Information insuffisante :
Si plusieurs motorisations très différentes existent pour cette combinaison
et que rien ne permet de trancher, n'affiche AUCUN moteur. Soit tu poses la
question puissance (Règle 2 si nécessaire au diagnostic), soit tu raisonnes
sans identification (Règle 3).

---`

    const systemMessage: SystemModelMessage = {
      role: "system",
      content: systemText,
      providerOptions: {
        anthropic: {
          cacheControl: { type: "ephemeral" },
        },
      },
    }

    const motorisation =
      [carburant, transmission].filter((x) => String(x ?? "").trim()).join(", ") ||
      (locale === "en" ? "unspecified" : locale === "nl" ? "niet opgegeven" : "non précisée")

    const userContentBase =
      locale === "en"
        ? `Vehicle: ${marque} ${modele} ${annee}, ${kilometrage} km, drivetrain: ${motorisation}.\n\nIssue described by the user: ${probleme}`
        : locale === "nl"
        ? `Voertuig: ${marque} ${modele} ${annee}, ${kilometrage} km, aandrijflijn: ${motorisation}.\n\nProbleem beschreven door de gebruiker: ${probleme}`
        : `Véhicule : ${marque} ${modele} ${annee}, ${kilometrage} km, motorisation : ${motorisation}.\n\nProblème décrit par l'utilisateur : ${probleme}`

    const followUpsText =
      Array.isArray(followUps) && followUps.length > 0
        ? locale === "en"
          ? `\n\nAdditional information (Q&A):\n${followUps
              .map((f: any) => `- Q: ${String(f?.question ?? "")}\n  A: ${String(f?.answer ?? "")}`)
              .join("\n")}`
          : locale === "nl"
          ? `\n\nAanvullende informatie (V&A):\n${followUps
              .map((f: any) => `- V: ${String(f?.question ?? "")}\n  A: ${String(f?.answer ?? "")}`)
              .join("\n")}`
          : `\n\nInformations complementaires (Q/R):\n${followUps
              .map((f: any) => `- Q: ${String(f?.question ?? "")}\n  R: ${String(f?.answer ?? "")}`)
              .join("\n")}`
        : ""

    const extraLines = [cylindree, puissance, nombrePortes, typeCarrosserie, typeBoiteAuto].filter(Boolean).length
      ? locale === "en"
        ? `\nAdditional info: ${[cylindree && `Displacement: ${cylindree}`, puissance && `Power: ${puissance}`, nombrePortes && `Doors: ${nombrePortes}`, typeCarrosserie && `Body: ${typeCarrosserie}`, typeBoiteAuto && `Gearbox type: ${typeBoiteAuto}`].filter(Boolean).join(", ")}`
        : locale === "nl"
        ? `\nAanvullende info: ${[cylindree && `Cilinderinhoud: ${cylindree}`, puissance && `Vermogen: ${puissance}`, nombrePortes && `Deuren: ${nombrePortes}`, typeCarrosserie && `Carrosserie: ${typeCarrosserie}`, typeBoiteAuto && `Versnellingsbaktype: ${typeBoiteAuto}`].filter(Boolean).join(", ")}`
        : `\nInfos complementaires: ${[cylindree && `Cylindree: ${cylindree}`, puissance && `Puissance: ${puissance}`, nombrePortes && `Portes: ${nombrePortes}`, typeCarrosserie && `Carrosserie: ${typeCarrosserie}`, typeBoiteAuto && `Type de boite auto: ${typeBoiteAuto}`].filter(Boolean).join(", ")}`
      : ""
    const autodocCtx = getAutoDocContext({
      marque: String(marque ?? ""),
      modele: String(modele ?? ""),
      probleme: String(probleme ?? ""),
      carburant: carburant ? String(carburant) : null,
      limit: 6,
    })

    const autodocBlock = autodocCtx.contextBlock ? `\n\n${autodocCtx.contextBlock}` : ""

    const dtcBlock = await getDtcContext(String(probleme ?? ""), marque ? String(marque) : null, locale)

    const varianteLine = variante?.trim() ? `\n\nVariante : ${variante.trim()}` : ""
    const prompt = `${userContentBase}${varianteLine}${extraLines}${followUpsText}${autodocBlock}${dtcBlock}`
    const followUpsJson = Array.isArray(followUps) && followUps.length > 0 ? JSON.stringify(followUps) : null
    const userId = user?.id ?? null

    let diagId = diagnosticRequestId
    if (!diagId) {
      // Premier appel : on crée une entrée unique.
      diagId = await createDiagnosticRequest({
        marque: String(marque),
        modele: String(modele),
        variante: variante ? String(variante) : null,
        carburant: carburant ? String(carburant) : null,
        transmission: transmission ? String(transmission) : null,
        annee: String(annee),
        kilometrage: String(kilometrage),
        probleme: String(probleme),
        followUps: followUpsJson,
        promptText: prompt,
        userId,
      })
    } else {
      // Follow-up : on met à jour l'entrée existante au lieu d'en créer une nouvelle.
      await updateDiagnosticRequestFollowUps({
        id: diagId,
        followUps: followUpsJson,
        promptText: prompt,
        userId,
      })
    }

    const { output: diagnostic1, usage: usage1, finishReason: finishReason1 } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      system: [systemMessage],
      maxOutputTokens: 6000,
      ...(photoLevier
        ? {
            messages: [{
              role: "user" as const,
              content: [
                { type: "image" as const, image: `data:image/jpeg;base64,${photoLevier}` },
                { type: "text" as const, text: prompt },
              ],
            }],
          }
        : { prompt }),
      output: Output.object({ schema: DiagnosticSchema })
    })
    logAnthropicCacheStats(usage1)

    if (finishReason1 === "length") {
      if (diagId) await updateDiagnosticResult(diagId, JSON.stringify({}), "completed")
      if (heldBillableCredit && billableRefundUserId) {
        await addCredits(billableRefundUserId, 1)
        heldBillableCredit = false
        billableRefundUserId = null
      }
      return NextResponse.json(
        { error: "DESCRIPTION_TOO_LONG", message: "Votre description est trop longue. Merci de la raccourcir pour lancer le diagnostic." },
        { status: 400 }
      )
    }

    if (!diagnostic1) {
      throw new Error("No diagnostic generated")
    }

    if (!diagnosticHasTooWideRanges(diagnostic1)) {
      if (diagId) {
        const status = diagnostic1.needsMoreInfo ? "in_progress" : "completed"
        await updateDiagnosticResult(diagId, JSON.stringify(diagnostic1), status)
      }
      let creditRefunded = false
      if (user && !isPrivileged && isNoInterventionDiagnostic(diagnostic1)) {
        await addCredits(user.id, 1)
        creditRefunded = true
      }
      const calibrated1 = applyPriceCalibration(diagnostic1, String(marque), carburant, String(probleme))
      // Le rapport garagiste (recherche web + structuration, ~15-35s) est généré
      // à la demande lors du téléchargement du PDF, pas ici, pour ne pas bloquer
      // l'affichage du diagnostic. Voir /api/diagnostic/[id]/mechanic-report.
      const res1 = buildDiagnosticResponse(calibrated1, diagId, creditRefunded)
      if (guestFirstCall && diagId) applyGuestFirstSuccessCookies(res1, diagId)
      return res1
    }

    const refinementPrompt =
      locale === "en"
        ? `${prompt}\n\nABSOLUTE CONSTRAINT: all price ranges (priceRange, diy.costRange, garage.costRange) must have a spread <= 100 EUR. If you cannot achieve this without guessing, set needsMoreInfo=true and ask ONE short targeted question (missingInfo.question) to reduce uncertainty, then still provide a provisional range with spread <= 100.\n\nYour previous response had ranges that were too wide. Fix this by strictly respecting spread <= 100 EUR everywhere.\nPrevious response (JSON): ${JSON.stringify(diagnostic1)}`
        : locale === "nl"
        ? `${prompt}\n\nABSOLUTE BEPERKING: alle prijsreeksen (priceRange, diy.costRange, garage.costRange) moeten een verschil <= 100 EUR hebben. Als je dit niet kunt halen zonder te gokken, stel needsMoreInfo=true in en stel EEN korte gerichte vraag (missingInfo.question) om de onzekerheid te verminderen, geef dan toch een voorlopige reeks met verschil <= 100.\n\nJe vorige antwoord had te brede reeksen. Corrigeer door strikt verschil <= 100 EUR overal te respecteren.\nVorig antwoord (JSON): ${JSON.stringify(diagnostic1)}`
        : `${prompt}\n\nCONTRAINTE ABSOLUE: toutes les fourchettes de prix (priceRange, diy.costRange, garage.costRange) doivent avoir un ecart <= 100 euros. Si tu ne peux pas respecter ca sans inventer, mets needsMoreInfo=true et pose UNE question courte et ciblée (missingInfo.question) pour reduire l'incertitude, puis donne quand meme une fourchette provisoire avec ecart <= 100.\n\nTa reponse precedente avait des fourchettes trop larges. Corrige en respectant strictement ecart <= 100 euros partout.\nReponse precedente (JSON): ${JSON.stringify(diagnostic1)}`

    const { output: diagnostic2, usage: usage2 } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      system: [systemMessage],
      maxOutputTokens: 6000,
      prompt: refinementPrompt,
      output: Output.object({ schema: DiagnosticSchema })
    })
    logAnthropicCacheStats(usage2)

    const finalDiagnostic = diagnostic2 ?? diagnostic1
    if (diagId) {
      const status = finalDiagnostic.needsMoreInfo ? "in_progress" : "completed"
      await updateDiagnosticResult(diagId, JSON.stringify(finalDiagnostic), status)
    }
    let creditRefunded = false
    if (user && !isPrivileged && isNoInterventionDiagnostic(finalDiagnostic)) {
      await addCredits(user.id, 1)
      creditRefunded = true
    }
    const calibrated2 = applyPriceCalibration(finalDiagnostic, String(marque), carburant, String(probleme))
    const res2 = buildDiagnosticResponse(calibrated2, diagId, creditRefunded)
    if (guestFirstCall && diagId) applyGuestFirstSuccessCookies(res2, diagId)
    return res2
  } catch (error) {
    if (heldBillableCredit && billableRefundUserId) {
      try {
        await addCredits(billableRefundUserId, 1)
      } catch (refundErr) {
        console.error("Diagnostic: échec du remboursement du crédit après erreur:", refundErr)
      }
      heldBillableCredit = false
      billableRefundUserId = null
    }
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Données du formulaire invalides." }, { status: 400 })
    }
    console.error("Diagnostic API error:", error)
    if (guestFirstCall) {
      const res = NextResponse.json(
        { error: "Erreur lors de l'analyse. Veuillez réessayer." },
        { status: 500 }
      )
      res.cookies.set(GUEST_INTENT_COOKIE, "1", guestDiagnosticCookieOptions(GUEST_INTENT_MAX_AGE))
      return res
    }
    return Response.json(
      { error: "Erreur lors de l'analyse. Veuillez réessayer." },
      { status: 500 }
    )
  }
}
