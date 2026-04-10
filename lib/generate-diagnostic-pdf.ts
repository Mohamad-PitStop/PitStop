/**
 * Génère un PDF de rapport de diagnostic PitStop côté client.
 * Import dynamique recommandé pour éviter les problèmes SSR :
 *   const { generateDiagnosticPdf } = await import('@/lib/generate-diagnostic-pdf')
 */
import jsPDF from "jspdf"

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

function newPage(doc: jsPDF): number {
  doc.addPage()
  // fond page
  doc.setFillColor(...C.pageBg)
  doc.rect(0, 0, PW, PH, "F")
  drawFooter(doc)
  return 18
}

function guard(doc: jsPDF, y: number, need = 18): number {
  return y + need > PH - 16 ? newPage(doc) : y
}

function drawFooter(doc: jsPDF) {
  doc.setFillColor(...C.navyLight)
  doc.rect(0, PH - 6, PW, 6, "F")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(6.5)
  doc.setTextColor(...C.border)
  doc.text("pitstop.be — Rapport de diagnostic automobile", ML, FOOTER, { baseline: "middle" })
  const date = new Date().toLocaleDateString("fr-BE", { day: "2-digit", month: "long", year: "numeric" })
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

  const lines = doc.splitTextToSize(str, maxW) as string[]
  const step  = lh ?? size * 0.42 + 1.4

  for (const line of lines) {
    y = guard(doc, y, step + 1)
    doc.text(line, align === "right" ? x : align === "center" ? x + maxW / 2 : x, y, { align })
    y += step
  }
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
  vehicleInfo: VehicleInfo
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true })

  // fond de la première page
  doc.setFillColor(...C.pageBg)
  doc.rect(0, 0, PW, PH, "F")
  drawFooter(doc)

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
  doc.text("Rapport de diagnostic automobile", ML, 25)

  // Label "CONFIDENTIEL" à droite
  doc.setFillColor(...C.navyMid)
  doc.roundedRect(PW - MR - 32, 19, 32, 7, 1.5, 1.5, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(...C.border)
  doc.text("USAGE PERSONNEL", PW - MR - 16, 23.5, { align: "center" })

  let y = 48

  // ═══════════════════════════════════════════════════════════════════════════
  // VÉHICULE
  // ═══════════════════════════════════════════════════════════════════════════

  y = section(doc, "Véhicule", y)

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
  tags.push(`${parseInt(vehicleInfo.kilometrage, 10).toLocaleString("fr-BE")} km`)
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

  // Citation du problème
  doc.setFont("helvetica", "italic")
  doc.setFontSize(8.5)
  doc.setTextColor(...C.muted)
  const quote = doc.splitTextToSize(`"${vehicleInfo.probleme}"`, CW) as string[]
  doc.text(quote, ML, y)
  y += quote.length * 4 + 4

  y = sep(doc, y)

  // ═══════════════════════════════════════════════════════════════════════════
  // DIAGNOSTIC
  // ═══════════════════════════════════════════════════════════════════════════

  y = section(doc, "Diagnostic", y)

  // Badge sévérité
  const sevMap: Record<string, { color: [number, number, number]; bg: [number, number, number] }> = {
    low:    { color: C.sevLow,  bg: C.sevLowBg  },
    medium: { color: C.sevMed,  bg: C.sevMedBg  },
    high:   { color: C.sevHigh, bg: C.sevHighBg },
  }
  const sev = sevMap[diagnostic.severity] ?? sevMap.medium
  const sevLabel = diagnostic.severityLabel
  const badgeW = doc.setFontSize(7.5) && doc.getTextWidth(sevLabel) + 8
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

  // Description
  y = text(doc, diagnostic.description, y, { size: 9, color: [60, 70, 100], lh: 4.6 })
  y += 4

  // ═══════════════════════════════════════════════════════════════════════════
  // CAS PARTICULIERS
  // ═══════════════════════════════════════════════════════════════════════════

  if (diagnostic.obdScanFirst?.required) {
    y = sep(doc, y)
    y = section(doc, "Diagnostic OBD requis avant tout", y)
    y = text(doc, diagnostic.obdScanFirst.explanation, y, { size: 9, color: [60, 70, 100] })
    y += 3

    // Deux options côte à côte
    const hw = CW / 2 - 2
    doc.setFillColor(...C.cardBg)
    doc.roundedRect(ML, y, hw, 20, 2, 2, "F")
    doc.roundedRect(ML + hw + 4, y, hw, 20, 2, 2, "F")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(...C.navy)
    doc.text("Option A — Scan simple", ML + 3, y + 6)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    doc.setTextColor(...C.green)
    doc.text(`${diagnostic.obdScanFirst.scanPrice} EUR`, ML + 3, y + 13)
    doc.setFontSize(7.5)
    doc.setTextColor(...C.muted)
    doc.text("Effacement du code erreur", ML + 3, y + 18)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(...C.navy)
    doc.text("Option B — Scan + analyse", ML + hw + 7, y + 6)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(...C.muted)
    const obLines = doc.splitTextToSize("Devis sur place apres le scan.", hw - 6) as string[]
    doc.text(obLines, ML + hw + 7, y + 12)

    y += 23
  }

  if (diagnostic.concessionOnly?.required) {
    y = sep(doc, y)
    y = section(doc, `Concession specialisee requise — ${diagnostic.concessionOnly.brand}`, y)
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
    y = section(doc, "Fourchette de prix estimee (TVA 21 % incluse)", y)

    // Bloc navy
    doc.setFillColor(...C.navy)
    doc.roundedRect(ML, y - 2, CW, 18, 3, 3, "F")

    // Bande verte gauche décorative
    doc.setFillColor(...C.green)
    doc.roundedRect(ML, y - 2, 3, 18, 1.5, 1.5, "F")

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...C.border)
    doc.text("Prix estimé de la prestation :", ML + 7, y + 4.5)

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
    y = section(doc, "Prestation garage partenaire (recommandee)", y)

    // Ligne durée + coût
    const col = ML + CW / 2 + 2
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...C.muted)
    doc.text("Duree estimee", ML, y)
    doc.text("Cout total", col, y)
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
    doc.text("INCLUS", ML, y)
    y += 5

    for (const item of diagnostic.garage.includes) {
      y = guard(doc, y, 6)
      // puce verte
      doc.setFillColor(...C.green)
      doc.circle(ML + 1.5, y - 1.2, 1, "F")
      const iLines = doc.splitTextToSize(item, CW - 7) as string[]
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
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
    diagnostic.diy.difficulty.trim().toLowerCase() === "facile" &&
    !diagnostic.concessionOnly?.required &&
    !diagnostic.obdScanFirst?.required
  ) {
    y = sep(doc, y)
    y = section(doc, "Option faire soi-meme  (difficulte : Facile)", y)

    const col = ML + CW / 2 + 2
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...C.muted)
    doc.text("Duree estimee", ML, y)
    doc.text("Cout pieces", col, y)
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
    doc.text("ETAPES PRINCIPALES", ML, y)
    y += 5

    diagnostic.diy.steps.forEach((step, i) => {
      y = guard(doc, y, 7)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8.5)
      doc.setTextColor(...C.green)
      doc.text(`${i + 1}`, ML + 1, y)
      const sLines = doc.splitTextToSize(step, CW - 8) as string[]
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
      doc.text("OUTILS NECESSAIRES", ML, y)
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
    y = section(doc, "Service recommande", y)
    const title = diagnostic.serviceRecommendation.title ?? "Lavage auto partenaire"
    y = text(doc, title, y, { size: 11, bold: true, color: C.navy })
    if (diagnostic.serviceRecommendation.description) {
      y = text(doc, diagnostic.serviceRecommendation.description, y, { size: 9, color: [60, 70, 100] })
    }
    y += 3
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AVERTISSEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  y = sep(doc, y)
  y = guard(doc, y, 22)

  const disclaimerStr =
    "Ce diagnostic est fourni a titre indicatif uniquement. Les prix sont des estimations basees sur le marche belge et peuvent varier selon les garages partenaires et la configuration exacte du vehicule. PitStop ne peut etre tenu responsable des decisions prises sur la base de ce rapport. Faites confirmer le diagnostic par un professionnel qualifie."
  const dLines = doc.splitTextToSize(disclaimerStr, CW - 8) as string[]
  const dH = dLines.length * 4 + 8

  doc.setFillColor(255, 251, 235)
  doc.roundedRect(ML, y - 2, CW, dH, 2, 2, "F")
  doc.setFillColor(...C.sevMed)
  doc.roundedRect(ML, y - 2, 3, dH, 1.5, 1.5, "F")

  doc.setFont("helvetica", "italic")
  doc.setFontSize(7.5)
  doc.setTextColor(120, 90, 0)
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
