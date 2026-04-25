/**
 * Génère un PDF de rapport de diagnostic PitStop côté client.
 * Import dynamique recommandé pour éviter les problèmes SSR :
 *   const { generateDiagnosticPdf } = await import('@/lib/generate-diagnostic-pdf')
 */
import jsPDF from "jspdf"

// ─── Labels multilingues ──────────────────────────────────────────────────────

type Locale = "fr" | "en" | "nl"

const LABELS = {
  fr: {
    sectionMechanic:       "Informations techniques pour le garagiste",
    mechanicIntro:         "Synthèse technique à présenter au garagiste. Les informations ci-dessous sont indicatives et doivent être vérifiées sur le véhicule.",
    mechanicEngineCode:    "Code moteur",
    mechanicGearboxRef:    "Référence boîte de vitesses",
    mechanicNotIdentified: "Non identifié",
    mechanicEngineNotRequired: "Identification du moteur non nécessaire pour ce diagnostic.",
    mechanicFaultCodes:    "Codes erreur suspectés",
    mechanicPartRefs:      "Références pièces probables",
    mechanicNotes:         "Notes techniques",
    reportTitle:      "Rapport de diagnostic automobile",
    personalUse:      "USAGE PERSONNEL",
    sectionVehicle:   "Véhicule",
    sectionDiag:      "Diagnostic",
    sectionObd:       "Diagnostic OBD requis avant tout",
    optionA:          "Option A — Scan simple",
    optionADesc:      "Effacement du code erreur",
    optionB:          "Option B — Scan + analyse",
    optionBDesc:      "Devis sur place apres le scan.",
    sectionConcession:"Passage en concession requis",
    sectionPrice:     "Fourchette de prix estimée (TVA 21 % incluse)",
    priceLabel:       "Prix estimé de la prestation :",
    sectionGarage:    "Prestation garage partenaire (recommandée)",
    duration:         "Durée estimée",
    totalCost:        "Coût total",
    includes:         "INCLUS",
    sectionDiy:       "Option faire soi-même  (difficulté : Facile)",
    partsCost:        "Coût pièces",
    steps:            "ÉTAPES PRINCIPALES",
    tools:            "OUTILS NÉCESSAIRES",
    sectionWash:      "Service recommandé",
    disclaimer:       "Ce diagnostic est fourni a titre indicatif uniquement. Les prix sont des estimations basees sur le marche belge et peuvent varier selon les garages partenaires et la configuration exacte du vehicule. PitStop ne peut etre tenu responsable des decisions prises sur la base de ce rapport. Faites confirmer le diagnostic par un professionnel qualifie.",
    footer:           "pitstop.be — Rapport de diagnostic automobile",
    dateLocale:       "fr-BE" as const,
  },
  en: {
    sectionMechanic:       "Technical information for the mechanic",
    mechanicIntro:         "Technical summary to share with the mechanic. The information below is indicative and should be verified on the vehicle.",
    mechanicEngineCode:    "Engine code",
    mechanicGearboxRef:    "Gearbox reference",
    mechanicNotIdentified: "Not identified",
    mechanicEngineNotRequired: "Engine identification was not required for this diagnosis.",
    mechanicFaultCodes:    "Suspected fault codes",
    mechanicPartRefs:      "Likely part references",
    mechanicNotes:         "Technical notes",
    reportTitle:      "Automotive diagnostic report",
    personalUse:      "PERSONAL USE",
    sectionVehicle:   "Vehicle",
    sectionDiag:      "Diagnosis",
    sectionObd:       "OBD scan required first",
    optionA:          "Option A — Simple scan",
    optionADesc:      "Fault code clearing",
    optionB:          "Option B — Scan + analysis",
    optionBDesc:      "On-site estimate after the scan.",
    sectionConcession:"Specialist dealership required",
    sectionPrice:     "Estimated price range (21% VAT included)",
    priceLabel:       "Estimated service cost:",
    sectionGarage:    "Partner garage service (recommended)",
    duration:         "Estimated duration",
    totalCost:        "Total cost",
    includes:         "INCLUDED",
    sectionDiy:       "DIY option  (difficulty: Easy)",
    partsCost:        "Parts cost",
    steps:            "MAIN STEPS",
    tools:            "TOOLS NEEDED",
    sectionWash:      "Recommended service",
    disclaimer:       "This diagnosis is provided for informational purposes only. Prices are estimates based on the Belgian market and may vary depending on the partner garage and exact vehicle configuration. PitStop cannot be held responsible for decisions made based on this report. Always have the diagnosis confirmed by a qualified professional.",
    footer:           "pitstop.be — Automotive diagnostic report",
    dateLocale:       "en-GB" as const,
  },
  nl: {
    sectionMechanic:       "Technische informatie voor de garage",
    mechanicIntro:         "Technische samenvatting om aan de garage te tonen. Deze informatie is indicatief en moet op het voertuig worden gecontroleerd.",
    mechanicEngineCode:    "Motorcode",
    mechanicGearboxRef:    "Versnellingsbakreferentie",
    mechanicNotIdentified: "Niet geïdentificeerd",
    mechanicEngineNotRequired: "Motoridentificatie was niet nodig voor deze diagnose.",
    mechanicFaultCodes:    "Vermoedelijke foutcodes",
    mechanicPartRefs:      "Waarschijnlijke onderdeelreferenties",
    mechanicNotes:         "Technische notities",
    reportTitle:      "Autodiagnoserapport",
    personalUse:      "PERSOONLIJK GEBRUIK",
    sectionVehicle:   "Voertuig",
    sectionDiag:      "Diagnose",
    sectionObd:       "OBD-scan eerst vereist",
    optionA:          "Optie A — Eenvoudige scan",
    optionADesc:      "Foutcode wissen",
    optionB:          "Optie B — Scan + analyse",
    optionBDesc:      "Offerte ter plaatse na de scan.",
    sectionConcession:"Gespecialiseerde concessie vereist",
    sectionPrice:     "Geschatte prijsrange (21% BTW inbegrepen)",
    priceLabel:       "Geschatte servicekosten:",
    sectionGarage:    "Partnergarage service (aanbevolen)",
    duration:         "Geschatte duur",
    totalCost:        "Totale kosten",
    includes:         "INBEGREPEN",
    sectionDiy:       "Zelf doen  (moeilijkheid: Makkelijk)",
    partsCost:        "Onderdelenkosten",
    steps:            "BELANGRIJKSTE STAPPEN",
    tools:            "BENODIGDE GEREEDSCHAPPEN",
    sectionWash:      "Aanbevolen service",
    disclaimer:       "Deze diagnose wordt uitsluitend ter informatie verstrekt. Prijzen zijn schattingen op basis van de Belgische markt en kunnen variëren afhankelijk van de partnergarage en de exacte voertuigconfiguratie. PitStop kan niet aansprakelijk worden gesteld voor beslissingen die op basis van dit rapport worden genomen. Laat de diagnose altijd bevestigen door een erkende professional.",
    footer:           "pitstop.be — Autodiagnoserapport",
    dateLocale:       "nl-BE" as const,
  },
} satisfies Record<Locale, Record<string, string>>

// ─── Types ────────────────────────────────────────────────────────────────────

interface DiagnosticResult {
  diagnosticRequestId?: string | null
  severity: "low" | "medium" | "high"
  severityLabel: string
  problem: string
  description: string
  priceRange: { min: number; max: number } | null
  concessionOnly?: {
    required: boolean
    brand: string
    explanation: string
    ctaLabel: string
    mapsQuery: string
  } | null
  obdScanFirst?: {
    required: boolean
    scanPrice: number
    explanation: string
    optionA: string
    optionB: string
  } | null
  serviceRecommendation?: {
    type: "none" | "lavage-auto"
    title?: string | null
    description?: string | null
  } | null
  diy?: {
    possible: boolean
    difficulty: string
    estimatedTime: string
    costRange: { min: number; max: number }
    steps: string[]
    tools: string[]
  } | null
  garage?: {
    estimatedTime: string
    costRange: { min: number; max: number }
    includes: string[]
  } | null
  mechanicReport?: {
    engineCode?: string | null
    gearboxReference?: string | null
    engineIdentificationNotRequired?: boolean
    suspectedFaultCodes?: { code: string; description: string }[]
    partReferences?: { label: string; reference: string }[]
    technicalNotes?: string[]
  } | null
}

interface VehicleInfo {
  marque: string
  modele: string
  variante?: string
  carburant?: string
  transmission?: string
  annee: string
  kilometrage: string
  probleme: string
}

// ─── Palette DA (reprise de globals.css) ──────────────────────────────────────

const C = {
  navy:      [13,  27,  62]  as [number, number, number], // #0D1B3E
  navyMid:   [19,  34,  72]  as [number, number, number], // #132248
  navyLight: [26,  45,  90]  as [number, number, number], // #1a2d5a
  green:     [34, 197,  94]  as [number, number, number], // #22C55E
  white:     [255, 255, 255] as [number, number, number],
  text:      [20,  28,  58]  as [number, number, number], // proche navy, lisible sur blanc
  muted:     [100, 110, 140] as [number, number, number],
  border:    [220, 225, 238] as [number, number, number],
  pageBg:    [251, 252, 255] as [number, number, number], // quasi-blanc légèrement bleuté
  cardBg:    [240, 244, 253] as [number, number, number], // très léger bleu
  // sévérités
  sevLow:    [22,  163,  74] as [number, number, number], // green-600
  sevMed:    [202, 138,   4] as [number, number, number], // amber-600
  sevHigh:   [220,  38,  38] as [number, number, number], // red-600
  sevLowBg:  [240, 253, 244] as [number, number, number],
  sevMedBg:  [255, 251, 235] as [number, number, number],
  sevHighBg: [254, 242, 242] as [number, number, number],
}

// ─── Constantes layout ────────────────────────────────────────────────────────

const PW     = 210
const PH     = 297
const ML     = 16  // margin left
const MR     = 16  // margin right
const CW     = PW - ML - MR  // content width
const FOOTER = PH - 9

// ─── Utilitaires ──────────────────────────────────────────────────────────────

// footer/dateLocale injected at call-site via closure (set after L is defined)
let _footer = "pitstop.be"
let _dateLocale = "fr-BE"

function newPage(doc: jsPDF): number {
  doc.addPage()
  doc.setFillColor(...C.pageBg)
  doc.rect(0, 0, PW, PH, "F")
  drawFooter(doc, _footer, _dateLocale)
  return 18
}

function guard(doc: jsPDF, y: number, need = 18): number {
  return y + need > PH - 16 ? newPage(doc) : y
}

function drawFooter(doc: jsPDF, footer: string, dateLocale: string) {
  doc.setFillColor(...C.navyLight)
  doc.rect(0, PH - 6, PW, 6, "F")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(6.5)
  doc.setTextColor(...C.border)
  doc.text(footer, ML, FOOTER, { baseline: "middle" })
  const date = new Date().toLocaleDateString(dateLocale, { day: "2-digit", month: "long", year: "numeric" })
  doc.text(date, PW - MR, FOOTER, { align: "right", baseline: "middle" })
}

/** Texte avec retour à la ligne automatique. Retourne le y final. */
function text(
  doc: jsPDF,
  str: string,
  y: number,
  opts: {
    size?:   number
    bold?:   boolean
    italic?: boolean
    color?:  [number, number, number]
    maxW?:   number
    lh?:     number
    x?:      number
    align?:  "left" | "center" | "right"
  } = {}
): number {
  const {
    size  = 9,
    bold  = false,
    italic = false,
    color = C.text,
    maxW  = CW,
    lh,
    x     = ML,
    align = "left",
  } = opts

  doc.setFont("helvetica", bold && italic ? "bolditalic" : bold ? "bold" : italic ? "italic" : "normal")
  doc.setFontSize(size)
  doc.setTextColor(...color)

  // Fallback: si des marqueurs **bold** subsistent dans du texte plat, on les retire pour ne pas afficher les astérisques.
  const cleaned = str.replace(/\*\*(.+?)\*\*/g, "$1")
  const lines = doc.splitTextToSize(cleaned, maxW) as string[]
  const step  = lh ?? size * 0.42 + 1.4

  for (const line of lines) {
    y = guard(doc, y, step + 1)
    doc.text(line, align === "right" ? x : align === "center" ? x + maxW / 2 : x, y, { align })
    y += step
  }
  return y
}

/**
 * Rend un texte avec segments gras via marqueurs **bold**.
 * Word-wrap au niveau des mots, en conservant le style (gras / normal) de chaque segment.
 */
function richText(
  doc: jsPDF,
  str: string,
  y: number,
  opts: {
    size?:  number
    color?: [number, number, number]
    maxW?:  number
    lh?:    number
    x?:     number
  } = {}
): number {
  const { size = 9, color = C.text, maxW = CW, lh, x = ML } = opts
  const step = lh ?? size * 0.42 + 1.4
  doc.setFontSize(size)
  doc.setTextColor(...color)

  // Split en segments {text, bold}
  type Seg = { text: string; bold: boolean }
  const segments: Seg[] = []
  const parts = str.split(/(\*\*[^*]+\*\*)/g)
  for (const part of parts) {
    if (!part) continue
    if (part.startsWith("**") && part.endsWith("**")) {
      segments.push({ text: part.slice(2, -2), bold: true })
    } else {
      segments.push({ text: part, bold: false })
    }
  }

  // Tokens = mots + espaces, en conservant le style de leur segment
  type Tok = { text: string; bold: boolean; space: boolean }
  const tokens: Tok[] = []
  for (const seg of segments) {
    // découpe par saut de ligne explicite
    const lines = seg.text.split(/\r?\n/)
    lines.forEach((line, i) => {
      if (i > 0) tokens.push({ text: "\n", bold: seg.bold, space: true })
      const words = line.split(/(\s+)/)
      for (const w of words) {
        if (!w) continue
        tokens.push({ text: w, bold: seg.bold, space: /^\s+$/.test(w) })
      }
    })
  }

  const widthOf = (tok: Tok): number => {
    doc.setFont("helvetica", tok.bold ? "bold" : "normal")
    return doc.getTextWidth(tok.text)
  }

  // Construction des lignes
  let line: Tok[] = []
  let lineW = 0
  const flush = () => {
    if (line.length === 0) return
    y = guard(doc, y, step + 1)
    let cx = x
    for (const tok of line) {
      if (tok.text === "\n") continue
      doc.setFont("helvetica", tok.bold ? "bold" : "normal")
      doc.text(tok.text, cx, y)
      cx += widthOf(tok)
    }
    y += step
    line = []
    lineW = 0
  }

  for (const tok of tokens) {
    if (tok.text === "\n") {
      flush()
      continue
    }
    const w = widthOf(tok)
    if (lineW + w > maxW && line.length > 0) {
      flush()
      // ne pas démarrer une ligne par un espace pur
      if (tok.space) continue
    }
    line.push(tok)
    lineW += w
  }
  flush()
  return y
}

/** Ligne de séparation pleine largeur */
function sep(doc: jsPDF, y: number, gap = 5): number {
  y = guard(doc, y, 6)
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.25)
  doc.line(ML, y, PW - MR, y)
  return y + gap
}

/** En-tête de section : barre verte à gauche + label */
function section(doc: jsPDF, label: string, y: number): number {
  y = guard(doc, y, 12)
  doc.setFillColor(...C.green)
  doc.rect(ML, y - 3.5, 2.5, 7, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(...C.navy)
  doc.text(label, ML + 5, y + 0.5)
  return y + 9
}

// ─── Export principal ─────────────────────────────────────────────────────────

export function generateDiagnosticPdf(
  diagnostic: DiagnosticResult,
  vehicleInfo: VehicleInfo,
  locale: Locale = "fr"
): void {
  const L = LABELS[locale] ?? LABELS.fr
  _footer = L.footer
  _dateLocale = L.dateLocale

  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true })

  // fond de la première page
  doc.setFillColor(...C.pageBg)
  doc.rect(0, 0, PW, PH, "F")
  drawFooter(doc, L.footer, L.dateLocale)

  // ═══════════════════════════════════════════════════════════════════════════
  // EN-TÊTE
  // ═══════════════════════════════════════════════════════════════════════════

  // Bloc navy pleine largeur
  doc.setFillColor(...C.navy)
  doc.rect(0, 0, PW, 38, "F")

  // Bande verte en bas du header
  doc.setFillColor(...C.green)
  doc.rect(0, 36, PW, 2, "F")

  // Nom + tag
  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.setTextColor(...C.green)
  doc.text("PitStop", ML, 16)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(...C.border)
  doc.text(L.reportTitle, ML, 25)

  // Label "CONFIDENTIEL" à droite
  doc.setFillColor(...C.navyMid)
  doc.roundedRect(PW - MR - 32, 19, 32, 7, 1.5, 1.5, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(...C.border)
  doc.text(L.personalUse, PW - MR - 16, 23.5, { align: "center" })

  let y = 48

  // ═══════════════════════════════════════════════════════════════════════════
  // VÉHICULE
  // ═══════════════════════════════════════════════════════════════════════════

  y = section(doc, L.sectionVehicle, y)

  // Fond de carte légère
  doc.setFillColor(...C.cardBg)
  doc.roundedRect(ML, y - 3, CW, 24, 2, 2, "F")

  // Marque + Modèle
  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.setTextColor(...C.navy)
  doc.text(`${vehicleInfo.marque}  ${vehicleInfo.modele}`, ML + 4, y + 5)

  // Pastilles : année — km — carburant — transmission
  const tags: string[] = [vehicleInfo.annee]
  tags.push(`${parseInt(vehicleInfo.kilometrage, 10).toLocaleString(L.dateLocale)} km`)
  if (vehicleInfo.variante)    tags.push(vehicleInfo.variante)
  if (vehicleInfo.carburant)   tags.push(vehicleInfo.carburant)
  if (vehicleInfo.transmission) tags.push(vehicleInfo.transmission)

  let tx = ML + 4
  const ty = y + 13
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)

  for (const tag of tags) {
    const tw = doc.getTextWidth(tag) + 5
    if (tx + tw > PW - MR - 4) break
    doc.setFillColor(...C.navyLight)
    doc.roundedRect(tx, ty - 3.5, tw, 5.5, 1, 1, "F")
    doc.setTextColor(...C.white)
    doc.text(tag, tx + tw / 2, ty, { align: "center" })
    tx += tw + 3
  }

  y += 27

  // Citation du problème : rendu ligne par ligne avec guard pour éviter tout
  // débordement de page si l'utilisateur a écrit une description longue.
  doc.setFont("helvetica", "italic")
  doc.setFontSize(8.5)
  doc.setTextColor(...C.muted)
  const quote = doc.splitTextToSize(`"${vehicleInfo.probleme.replace(/\*\*(.+?)\*\*/g, "$1")}"`, CW) as string[]
  for (const qline of quote) {
    y = guard(doc, y, 5)
    doc.text(qline, ML, y)
    y += 4
  }
  y += 4

  y = sep(doc, y)

  // ═══════════════════════════════════════════════════════════════════════════
  // DIAGNOSTIC
  // ═══════════════════════════════════════════════════════════════════════════

  y = section(doc, L.sectionDiag, y)

  // Badge sévérité
  const sevMap: Record<string, { color: [number, number, number]; bg: [number, number, number] }> = {
    low:    { color: C.sevLow,  bg: C.sevLowBg  },
    medium: { color: C.sevMed,  bg: C.sevMedBg  },
    high:   { color: C.sevHigh, bg: C.sevHighBg },
  }
  const sev = sevMap[diagnostic.severity] ?? sevMap.medium
  const sevLabel = diagnostic.severityLabel
  doc.setFontSize(7.5)
  doc.setFont("helvetica", "bold")
  const badgeW = doc.getTextWidth(sevLabel) + 8
  doc.setFillColor(...sev.bg)
  doc.roundedRect(ML, y - 3.5, badgeW, 7, 1.5, 1.5, "F")
  doc.setDrawColor(...sev.color)
  doc.setLineWidth(0.4)
  doc.roundedRect(ML, y - 3.5, badgeW, 7, 1.5, 1.5, "S")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.5)
  doc.setTextColor(...sev.color)
  doc.text(sevLabel, ML + badgeW / 2, y + 0.2, { align: "center" })
  y += 10

  // Titre du problème
  y = text(doc, diagnostic.problem, y, { size: 14, bold: true, color: C.navy, lh: 7 })
  y += 1

  // Description (parse **bold** markers)
  y = richText(doc, diagnostic.description, y, { size: 9, color: [60, 70, 100], lh: 4.6 })
  y += 4

  // ═══════════════════════════════════════════════════════════════════════════
  // CAS PARTICULIERS
  // ═══════════════════════════════════════════════════════════════════════════

  if (diagnostic.obdScanFirst?.required) {
    y = sep(doc, y)
    y = section(doc, L.sectionObd, y)
    y = text(doc, diagnostic.obdScanFirst.explanation, y, { size: 9, color: [60, 70, 100] })
    y += 3

    // Deux options côte à côte. Hauteur calculée en fonction du nombre réel
    // de lignes de la description Option B (pour que le texte ne déborde pas
    // du cadre arrondi sur certaines traductions plus verbeuses).
    const hw = CW / 2 - 2
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    const obLines = doc.splitTextToSize(L.optionBDesc, hw - 6) as string[]
    const boxH = Math.max(20, 12 + obLines.length * 3.2 + 2)
    y = guard(doc, y, boxH + 3)
    doc.setFillColor(...C.cardBg)
    doc.roundedRect(ML, y, hw, boxH, 2, 2, "F")
    doc.roundedRect(ML + hw + 4, y, hw, boxH, 2, 2, "F")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(...C.navy)
    doc.text(L.optionA, ML + 3, y + 6)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    doc.setTextColor(...C.green)
    doc.text(`${diagnostic.obdScanFirst.scanPrice} EUR`, ML + 3, y + 13)
    doc.setFontSize(7.5)
    doc.setTextColor(...C.muted)
    doc.text(L.optionADesc, ML + 3, y + 18)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(...C.navy)
    doc.text(L.optionB, ML + hw + 7, y + 6)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(...C.muted)
    doc.text(obLines, ML + hw + 7, y + 12)

    y += boxH + 3
  }

  if (diagnostic.concessionOnly?.required) {
    y = sep(doc, y)
    y = section(doc, `${L.sectionConcession} — ${diagnostic.concessionOnly.brand}`, y)
    y = text(doc, diagnostic.concessionOnly.explanation, y, { size: 9, color: [60, 70, 100] })
    y += 3
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FOURCHETTE DE PRIX
  // ═══════════════════════════════════════════════════════════════════════════

  const showPrice =
    !diagnostic.obdScanFirst?.required &&
    !diagnostic.concessionOnly?.required &&
    diagnostic.priceRange &&
    (diagnostic.priceRange.min > 0 || diagnostic.priceRange.max > 0)

  if (showPrice && diagnostic.priceRange) {
    y = sep(doc, y)
    y = section(doc, L.sectionPrice, y)
    y = guard(doc, y, 24)

    // Bloc navy
    doc.setFillColor(...C.navy)
    doc.roundedRect(ML, y - 2, CW, 18, 3, 3, "F")

    // Bande verte gauche décorative
    doc.setFillColor(...C.green)
    doc.roundedRect(ML, y - 2, 3, 18, 1.5, 1.5, "F")

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...C.border)
    doc.text(L.priceLabel, ML + 7, y + 4.5)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(17)
    doc.setTextColor(...C.green)
    doc.text(
      `${diagnostic.priceRange.min} EUR  —  ${diagnostic.priceRange.max} EUR`,
      ML + 7, y + 13
    )

    y += 21
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GARAGE PARTENAIRE
  // ═══════════════════════════════════════════════════════════════════════════

  if (
    diagnostic.garage &&
    !diagnostic.concessionOnly?.required &&
    !diagnostic.obdScanFirst?.required
  ) {
    y = sep(doc, y)
    y = section(doc, L.sectionGarage, y)

    // Ligne durée + coût
    const col = ML + CW / 2 + 2
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...C.muted)
    doc.text(L.duration, ML, y)
    doc.text(L.totalCost, col, y)
    y += 5

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(...C.navy)
    doc.text(diagnostic.garage.estimatedTime, ML, y)
    doc.text(
      `${diagnostic.garage.costRange.min} EUR — ${diagnostic.garage.costRange.max} EUR`,
      col, y
    )
    y += 8

    // Prestations incluses
    y = guard(doc, y, 8)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(...C.muted)
    doc.text(L.includes, ML, y)
    y += 5

    for (const item of diagnostic.garage.includes) {
      // Mesurer la hauteur réelle de l'item avant de réserver l'espace,
      // sinon un item multi-lignes peut chevaucher le pied de page.
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      const iLines = doc.splitTextToSize(item.replace(/\*\*(.+?)\*\*/g, "$1"), CW - 7) as string[]
      y = guard(doc, y, iLines.length * 4.4 + 2)
      doc.setFillColor(...C.green)
      doc.circle(ML + 1.5, y - 1.2, 1, "F")
      doc.setTextColor(...C.text)
      doc.text(iLines, ML + 5, y)
      y += iLines.length * 4.4
    }
    y += 2
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTION DIY (si difficulté = Facile)
  // ═══════════════════════════════════════════════════════════════════════════

  if (
    diagnostic.diy &&
    ["facile", "easy", "makkelijk"].includes(diagnostic.diy.difficulty.trim().toLowerCase()) &&
    !diagnostic.concessionOnly?.required &&
    !diagnostic.obdScanFirst?.required
  ) {
    y = sep(doc, y)
    y = section(doc, L.sectionDiy, y)

    const col = ML + CW / 2 + 2
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...C.muted)
    doc.text(L.duration, ML, y)
    doc.text(L.partsCost, col, y)
    y += 5

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(...C.navy)
    doc.text(diagnostic.diy.estimatedTime, ML, y)
    doc.text(
      `${diagnostic.diy.costRange.min} EUR — ${diagnostic.diy.costRange.max} EUR`,
      col, y
    )
    y += 8

    // Etapes
    y = guard(doc, y, 8)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(...C.muted)
    doc.text(L.steps, ML, y)
    y += 5

    diagnostic.diy.steps.forEach((step, i) => {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      const sLines = doc.splitTextToSize(step.replace(/\*\*(.+?)\*\*/g, "$1"), CW - 8) as string[]
      y = guard(doc, y, sLines.length * 4.4 + 3)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8.5)
      doc.setTextColor(...C.green)
      doc.text(`${i + 1}`, ML + 1, y)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(...C.text)
      doc.text(sLines, ML + 6, y)
      y += sLines.length * 4.4 + 1
    })

    // Outils
    if (diagnostic.diy.tools.length > 0) {
      y += 1
      y = guard(doc, y, 10)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.setTextColor(...C.muted)
      doc.text(L.tools, ML, y)
      y += 5
      y = text(doc, diagnostic.diy.tools.join("  /  "), y, {
        size: 8.5,
        italic: true,
        color: C.muted,
      })
    }
    y += 2
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LAVAGE AUTO
  // ═══════════════════════════════════════════════════════════════════════════

  if (diagnostic.serviceRecommendation?.type === "lavage-auto") {
    y = sep(doc, y)
    y = section(doc, L.sectionWash, y)
    const title = diagnostic.serviceRecommendation.title ?? "Lavage auto partenaire"
    y = text(doc, title, y, { size: 11, bold: true, color: C.navy })
    if (diagnostic.serviceRecommendation.description) {
      y = text(doc, diagnostic.serviceRecommendation.description, y, { size: 9, color: [60, 70, 100] })
    }
    y += 3
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION GARAGISTE (informations techniques)
  // ═══════════════════════════════════════════════════════════════════════════

  const mr = diagnostic.mechanicReport
  const engineNotRequired = !!mr?.engineIdentificationNotRequired
  const hasMr =
    !!mr &&
    ((mr.engineCode && mr.engineCode.trim().length > 0) ||
      (mr.gearboxReference && mr.gearboxReference.trim().length > 0) ||
      (mr.suspectedFaultCodes && mr.suspectedFaultCodes.length > 0) ||
      (mr.partReferences && mr.partReferences.length > 0) ||
      (mr.technicalNotes && mr.technicalNotes.length > 0) ||
      engineNotRequired)

  if (hasMr && mr) {
    // Cette section est destinée au garagiste : on la démarre sur une nouvelle page
    // pour qu'elle reste bien identifiable et facilement séparable.
    y = newPage(doc)
    y = section(doc, L.sectionMechanic, y)

    y = text(doc, L.mechanicIntro, y, { size: 9, italic: true, color: C.muted, lh: 4.4 })
    y += 3

    // Bloc identité technique : deux colonnes (code moteur / référence boîte),
    // OU bandeau explicite si l'identification du moteur n'était pas nécessaire.
    if (engineNotRequired && !(mr.engineCode && mr.engineCode.trim())) {
      // Bandeau "non nécessaire" — explique au garagiste pourquoi engineCode est absent.
      y = guard(doc, y, 14)
      doc.setFillColor(...C.cardBg)
      doc.roundedRect(ML, y - 2, CW, 12, 2, 2, "F")
      doc.setFont("helvetica", "italic")
      doc.setFontSize(9)
      doc.setTextColor(...C.muted)
      const lines = doc.splitTextToSize(L.mechanicEngineNotRequired, CW - 8) as string[]
      doc.text(lines[0] ?? "", ML + 4, y + 6)
      y += 16
      // Si la référence boîte est tout de même présente, l'afficher seule.
      if (mr.gearboxReference && mr.gearboxReference.trim()) {
        y = guard(doc, y, 20)
        doc.setFillColor(...C.cardBg)
        doc.roundedRect(ML, y - 2, CW, 16, 2, 2, "F")
        doc.setFont("helvetica", "bold")
        doc.setFontSize(7.5)
        doc.setTextColor(...C.muted)
        doc.text(L.mechanicGearboxRef.toUpperCase(), ML + 4, y + 3)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(11)
        doc.setTextColor(...C.navy)
        const gearLines = doc.splitTextToSize(mr.gearboxReference.trim(), CW - 8) as string[]
        doc.text(gearLines[0] ?? "", ML + 4, y + 10)
        y += 20
      }
    } else if ((mr.engineCode && mr.engineCode.trim()) || (mr.gearboxReference && mr.gearboxReference.trim())) {
      y = guard(doc, y, 20)
      doc.setFillColor(...C.cardBg)
      doc.roundedRect(ML, y - 2, CW, 16, 2, 2, "F")

      const colW = CW / 2
      const valMaxW = colW - 6
      doc.setFont("helvetica", "bold")
      doc.setFontSize(7.5)
      doc.setTextColor(...C.muted)
      doc.text(L.mechanicEngineCode.toUpperCase(), ML + 4, y + 3)
      doc.text(L.mechanicGearboxRef.toUpperCase(), ML + colW + 2, y + 3)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(11)
      doc.setTextColor(...C.navy)
      const engineVal = (mr.engineCode?.trim() || L.mechanicNotIdentified)
      const gearVal = (mr.gearboxReference?.trim() || L.mechanicNotIdentified)
      const engineLines = doc.splitTextToSize(engineVal, valMaxW) as string[]
      const gearLines = doc.splitTextToSize(gearVal, valMaxW) as string[]
      doc.text(engineLines[0] ?? "", ML + 4, y + 10)
      doc.text(gearLines[0] ?? "", ML + colW + 2, y + 10)
      y += 20
    }

    // Codes erreur suspectés
    if (mr.suspectedFaultCodes && mr.suspectedFaultCodes.length > 0) {
      y = guard(doc, y, 10)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.setTextColor(...C.muted)
      doc.text(L.mechanicFaultCodes.toUpperCase(), ML, y)
      y += 5

      for (const f of mr.suspectedFaultCodes) {
        doc.setFont("helvetica", "bold")
        doc.setFontSize(9)
        const codeW = doc.getTextWidth(f.code)
        doc.setFont("helvetica", "normal")
        const descLines = doc.splitTextToSize(
          (f.description ?? "").replace(/\*\*(.+?)\*\*/g, "$1"),
          CW - codeW - 4
        ) as string[]
        y = guard(doc, y, Math.max(descLines.length, 1) * 4.4 + 3)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(9)
        doc.setTextColor(...C.green)
        doc.text(f.code, ML, y)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(...C.text)
        doc.text(descLines, ML + codeW + 4, y)
        y += Math.max(descLines.length, 1) * 4.4 + 1
      }
      y += 2
    }

    // Références pièces
    if (mr.partReferences && mr.partReferences.length > 0) {
      y = guard(doc, y, 10)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.setTextColor(...C.muted)
      doc.text(L.mechanicPartRefs.toUpperCase(), ML, y)
      y += 5

      for (const p of mr.partReferences) {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        const label = (p.label ?? "").replace(/\*\*(.+?)\*\*/g, "$1")
        const ref = (p.reference ?? "").replace(/\*\*(.+?)\*\*/g, "$1")
        const labelLines = doc.splitTextToSize(label, CW * 0.55) as string[]
        doc.setFont("helvetica", "bold")
        const refLines = doc.splitTextToSize(ref, CW * 0.40) as string[]
        const h = Math.max(labelLines.length, refLines.length, 1) * 4.4 + 1
        y = guard(doc, y, h + 2)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(...C.text)
        doc.text(labelLines, ML, y)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(...C.navy)
        doc.text(refLines, ML + CW * 0.58, y)
        y += h
      }
      y += 2
    }

    // Notes techniques
    if (mr.technicalNotes && mr.technicalNotes.length > 0) {
      y = guard(doc, y, 10)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.setTextColor(...C.muted)
      doc.text(L.mechanicNotes.toUpperCase(), ML, y)
      y += 5

      for (const note of mr.technicalNotes) {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        const nLines = doc.splitTextToSize(
          note.replace(/\*\*(.+?)\*\*/g, "$1"),
          CW - 7
        ) as string[]
        y = guard(doc, y, nLines.length * 4.4 + 2)
        doc.setFillColor(...C.green)
        doc.circle(ML + 1.5, y - 1.2, 1, "F")
        doc.setTextColor(...C.text)
        doc.text(nLines, ML + 5, y)
        y += nLines.length * 4.4
      }
      y += 2
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AVERTISSEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  y = sep(doc, y)
  y = guard(doc, y, 22)

  const dLines = doc.splitTextToSize(L.disclaimer, CW - 8) as string[]
  const dH = dLines.length * 4 + 8

  doc.setFillColor(...C.sevMedBg)
  doc.roundedRect(ML, y - 2, CW, dH, 2, 2, "F")
  doc.setFillColor(...C.sevMed)
  doc.roundedRect(ML, y - 2, 3, dH, 1.5, 1.5, "F")

  doc.setFont("helvetica", "italic")
  doc.setFontSize(7.5)
  doc.setTextColor(...C.sevMed)
  doc.text(dLines, ML + 6, y + 3)

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGINATION + FOOTER sur toutes les pages
  // ═══════════════════════════════════════════════════════════════════════════

  const total = doc.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    if (total > 1) {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(6.5)
      doc.setTextColor(...C.border)
      doc.text(`${p} / ${total}`, PW / 2, FOOTER, { align: "center", baseline: "middle" })
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SAUVEGARDE
  // ═══════════════════════════════════════════════════════════════════════════

  const filename = `diagnostic-${vehicleInfo.marque}-${vehicleInfo.modele}-${vehicleInfo.annee}`
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
  doc.save(`${filename}.pdf`)
}
