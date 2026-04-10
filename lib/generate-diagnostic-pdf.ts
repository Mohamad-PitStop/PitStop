/**
 * Génère un PDF de rapport de diagnostic PitStop côté client.
 * Import dynamique recommandé pour éviter les problèmes SSR :
 *   const { generateDiagnosticPdf } = await import('@/lib/generate-diagnostic-pdf')
 */
import jsPDF from "jspdf"

// ─── Types (miroir de results-content.tsx) ───────────────────────────────────

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

// ─── Constantes de mise en page ───────────────────────────────────────────────

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 16
const CONTENT_W = PAGE_W - MARGIN * 2
const FOOTER_Y = PAGE_H - 10

// ─── Helpers ──────────────────────────────────────────────────────────────────

function drawSeparator(doc: jsPDF, y: number): number {
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y)
  return y + 5
}

function checkPageBreak(doc: jsPDF, y: number, needed = 20): number {
  if (y + needed > PAGE_H - 18) {
    doc.addPage()
    drawFooter(doc)
    return 18
  }
  return y
}

function drawFooter(doc: jsPDF) {
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(180, 180, 180)
  doc.text("pitstop.be — Ce rapport est fourni à titre indicatif uniquement.", PAGE_W / 2, FOOTER_Y, { align: "center" })
}

function wrappedText(
  doc: jsPDF,
  text: string,
  y: number,
  opts: {
    fontSize?: number
    bold?: boolean
    italic?: boolean
    color?: [number, number, number]
    maxWidth?: number
    lineHeight?: number
  } = {}
): number {
  const {
    fontSize = 9,
    bold = false,
    italic = false,
    color = [50, 50, 50],
    maxWidth = CONTENT_W,
    lineHeight,
  } = opts

  doc.setFont("helvetica", bold ? (italic ? "bolditalic" : "bold") : italic ? "italic" : "normal")
  doc.setFontSize(fontSize)
  doc.setTextColor(...color)

  const lines = doc.splitTextToSize(text, maxWidth) as string[]
  const lh = lineHeight ?? fontSize * 0.42 + 1.2

  lines.forEach((line: string) => {
    y = checkPageBreak(doc, y, lh + 2)
    doc.text(line, MARGIN, y)
    y += lh
  })

  return y
}

// ─── Section label ────────────────────────────────────────────────────────────

function sectionLabel(doc: jsPDF, text: string, y: number): number {
  y = checkPageBreak(doc, y, 10)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.5)
  doc.setTextColor(140, 140, 140)
  doc.text(text.toUpperCase(), MARGIN, y)
  return y + 5
}

// ─── Export principal ─────────────────────────────────────────────────────────

export function generateDiagnosticPdf(
  diagnostic: DiagnosticResult,
  vehicleInfo: VehicleInfo
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true })

  // ── En-tête ──────────────────────────────────────────────────────────────
  // Fond sombre
  doc.setFillColor(14, 14, 14)
  doc.rect(0, 0, PAGE_W, 36, "F")

  // Nom du produit
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text("PitStop", MARGIN, 15)

  // Sous-titre
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(180, 180, 180)
  doc.text("Rapport de diagnostic automobile", MARGIN, 23)

  // Date (droite)
  const dateStr = new Date().toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
  doc.setFontSize(8)
  doc.setTextColor(160, 160, 160)
  doc.text(dateStr, PAGE_W - MARGIN, 23, { align: "right" })

  // Ligne décorative sous le header
  doc.setFillColor(59, 130, 246) // bleu primary
  doc.rect(MARGIN, 31, 40, 1.2, "F")

  let y = 46

  // ── Véhicule ─────────────────────────────────────────────────────────────
  y = sectionLabel(doc, "Véhicule", y)

  // Marque + Modèle (grande police)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(20, 20, 20)
  doc.text(`${vehicleInfo.marque} ${vehicleInfo.modele}`, MARGIN, y)
  y += 7

  // Détails véhicule
  const details: string[] = [vehicleInfo.annee, `${parseInt(vehicleInfo.kilometrage, 10).toLocaleString("fr-BE")} km`]
  if (vehicleInfo.variante) details.push(vehicleInfo.variante)
  if (vehicleInfo.carburant) details.push(vehicleInfo.carburant)
  if (vehicleInfo.transmission) details.push(vehicleInfo.transmission)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(details.join("  •  "), MARGIN, y)
  y += 6

  // Citation du problème
  doc.setFont("helvetica", "italic")
  doc.setFontSize(8.5)
  doc.setTextColor(120, 120, 120)
  const problemQuote = `"${vehicleInfo.probleme}"`
  const quoteLines = doc.splitTextToSize(problemQuote, CONTENT_W) as string[]
  doc.text(quoteLines, MARGIN, y)
  y += quoteLines.length * 4.2 + 2

  y = drawSeparator(doc, y)

  // ── Diagnostic ───────────────────────────────────────────────────────────
  y = sectionLabel(doc, "Diagnostic", y)

  // Badge de sévérité
  const severityColors: Record<string, [number, number, number]> = {
    low:    [22, 163, 74],
    medium: [202, 138, 4],
    high:   [220, 38, 38],
  }
  const [r, g, b] = severityColors[diagnostic.severity] ?? [100, 100, 100]
  const badgeW = Math.min(doc.getTextWidth(diagnostic.severityLabel) * (7.5 / doc.getFontSize()) + 10, 70)
  doc.setFillColor(r, g, b, 0.15)
  doc.roundedRect(MARGIN, y - 4, badgeW, 6.5, 1.5, 1.5, "F")
  doc.setDrawColor(r, g, b)
  doc.setLineWidth(0.4)
  doc.roundedRect(MARGIN, y - 4, badgeW, 6.5, 1.5, 1.5, "S")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.5)
  doc.setTextColor(r, g, b)
  doc.text(diagnostic.severityLabel, MARGIN + badgeW / 2, y + 0.2, { align: "center" })
  y += 9

  // Titre du problème
  y = wrappedText(doc, diagnostic.problem, y, { fontSize: 14, bold: true, color: [15, 15, 15] })
  y += 1

  // Description
  y = wrappedText(doc, diagnostic.description, y, { fontSize: 9, color: [60, 60, 60], lineHeight: 4.5 })
  y += 3

  // ── Cas OBD scan requis ──────────────────────────────────────────────────
  if (diagnostic.obdScanFirst?.required) {
    y = drawSeparator(doc, y)
    y = sectionLabel(doc, "Diagnostic OBD requis en premier", y)
    y = wrappedText(doc, diagnostic.obdScanFirst.explanation, y, { fontSize: 9, color: [60, 60, 60] })
    y += 3
    // Options
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.setTextColor(30, 30, 30)
    doc.text(`Option A — Scan simple : ${diagnostic.obdScanFirst.scanPrice}€`, MARGIN, y)
    y += 5
    doc.setFont("helvetica", "normal")
    doc.text("Option B — Scan + analyse complète + devis sur place", MARGIN, y)
    y += 4
  }

  // ── Cas concession only ──────────────────────────────────────────────────
  if (diagnostic.concessionOnly?.required) {
    y = drawSeparator(doc, y)
    y = sectionLabel(doc, `Passage en concession requis — ${diagnostic.concessionOnly.brand}`, y)
    y = wrappedText(doc, diagnostic.concessionOnly.explanation, y, { fontSize: 9, color: [60, 60, 60] })
    y += 3
  }

  // ── Fourchette de prix ───────────────────────────────────────────────────
  if (
    !diagnostic.obdScanFirst?.required &&
    !diagnostic.concessionOnly?.required &&
    diagnostic.priceRange &&
    (diagnostic.priceRange.min > 0 || diagnostic.priceRange.max > 0)
  ) {
    y = drawSeparator(doc, y)
    y = sectionLabel(doc, "Fourchette de prix estimée (TVA 21 % incluse)", y)

    // Cadre prix
    doc.setFillColor(239, 246, 255)
    doc.roundedRect(MARGIN, y - 3, CONTENT_W, 14, 2, 2, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(20)
    doc.setTextColor(37, 99, 235)
    doc.text(`${diagnostic.priceRange.min} € – ${diagnostic.priceRange.max} €`, PAGE_W / 2, y + 7, { align: "center" })
    y += 17
  }

  // ── Garage partenaire ────────────────────────────────────────────────────
  if (diagnostic.garage && !diagnostic.concessionOnly?.required && !diagnostic.obdScanFirst?.required) {
    y = drawSeparator(doc, y)
    y = sectionLabel(doc, "Prestation garage partenaire (recommandée)", y)

    // Grille durée / coût
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(80, 80, 80)
    const col2 = MARGIN + CONTENT_W / 2 + 2
    doc.text(`⏱  Durée estimée`, MARGIN, y)
    doc.text(`💶  Coût total`, col2, y)
    y += 5
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(20, 20, 20)
    doc.text(diagnostic.garage.estimatedTime, MARGIN, y)
    doc.text(`${diagnostic.garage.costRange.min} € – ${diagnostic.garage.costRange.max} €`, col2, y)
    y += 8

    // Prestations incluses
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.setTextColor(50, 50, 50)
    doc.text("Prestations incluses :", MARGIN, y)
    y += 5
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    for (const item of diagnostic.garage.includes) {
      y = checkPageBreak(doc, y, 6)
      const itemLines = doc.splitTextToSize(`• ${item}`, CONTENT_W - 4) as string[]
      doc.setTextColor(60, 60, 60)
      doc.text(itemLines, MARGIN + 2, y)
      y += itemLines.length * 4.2
    }
    y += 2
  }

  // ── Option DIY (si facile) ────────────────────────────────────────────────
  if (
    diagnostic.diy &&
    diagnostic.diy.difficulty.trim().toLowerCase() === "facile" &&
    !diagnostic.concessionOnly?.required &&
    !diagnostic.obdScanFirst?.required
  ) {
    y = drawSeparator(doc, y)
    y = sectionLabel(doc, "Option faire soi-même (difficulté : Facile)", y)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(80, 80, 80)
    const col2 = MARGIN + CONTENT_W / 2 + 2
    doc.text(`⏱  Durée estimée`, MARGIN, y)
    doc.text(`🔩  Coût pièces`, col2, y)
    y += 5
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(20, 20, 20)
    doc.text(diagnostic.diy.estimatedTime, MARGIN, y)
    doc.text(`${diagnostic.diy.costRange.min} € – ${diagnostic.diy.costRange.max} €`, col2, y)
    y += 8

    // Étapes
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.setTextColor(50, 50, 50)
    doc.text("Étapes principales :", MARGIN, y)
    y += 5
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    diagnostic.diy.steps.forEach((step, i) => {
      y = checkPageBreak(doc, y, 8)
      const stepLines = doc.splitTextToSize(`${i + 1}.  ${step}`, CONTENT_W - 6) as string[]
      doc.setTextColor(60, 60, 60)
      doc.text(stepLines, MARGIN + 3, y)
      y += stepLines.length * 4.2
    })
    y += 2

    // Outils
    if (diagnostic.diy.tools.length > 0) {
      y = checkPageBreak(doc, y, 10)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8.5)
      doc.setTextColor(50, 50, 50)
      doc.text("Outils nécessaires :", MARGIN, y)
      y += 5
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8.5)
      doc.setTextColor(80, 80, 80)
      const toolsLine = diagnostic.diy.tools.join("  •  ")
      const toolsLines = doc.splitTextToSize(toolsLine, CONTENT_W) as string[]
      doc.text(toolsLines, MARGIN, y)
      y += toolsLines.length * 4.2 + 2
    }
  }

  // ── Lavage auto ──────────────────────────────────────────────────────────
  if (diagnostic.serviceRecommendation?.type === "lavage-auto") {
    y = drawSeparator(doc, y)
    y = sectionLabel(doc, "Service recommandé", y)
    const washTitle = diagnostic.serviceRecommendation.title ?? "Lavage auto partenaire"
    y = wrappedText(doc, washTitle, y, { fontSize: 11, bold: true, color: [20, 20, 20] })
    if (diagnostic.serviceRecommendation.description) {
      y = wrappedText(doc, diagnostic.serviceRecommendation.description, y, { fontSize: 9, color: [70, 70, 70] })
    }
    y += 3
  }

  // ── Avertissement ────────────────────────────────────────────────────────
  y = drawSeparator(doc, y)
  y = checkPageBreak(doc, y, 20)

  doc.setFillColor(255, 251, 235)
  const disclaimerText =
    "Ce diagnostic est fourni à titre indicatif uniquement. Les prix sont des estimations basées sur le marché belge et peuvent varier selon les garages partenaires et la configuration exacte du véhicule. PitStop ne peut être tenu responsable des décisions prises sur la base de ce rapport. Faites toujours confirmer le diagnostic par un professionnel qualifié."
  const disclaimerLines = doc.splitTextToSize(disclaimerText, CONTENT_W - 6) as string[]
  const disclaimerH = disclaimerLines.length * 4 + 8
  doc.roundedRect(MARGIN, y - 3, CONTENT_W, disclaimerH, 2, 2, "F")
  doc.setDrawColor(251, 191, 36)
  doc.setLineWidth(0.4)
  doc.roundedRect(MARGIN, y - 3, CONTENT_W, disclaimerH, 2, 2, "S")
  doc.setFont("helvetica", "italic")
  doc.setFontSize(7.5)
  doc.setTextColor(120, 100, 0)
  doc.text(disclaimerLines, MARGIN + 3, y + 2)

  // ── Footer toutes les pages ──────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    drawFooter(doc)
    if (totalPages > 1) {
      doc.setFontSize(7.5)
      doc.setTextColor(180, 180, 180)
      doc.text(`${i} / ${totalPages}`, PAGE_W - MARGIN, FOOTER_Y, { align: "right" })
    }
  }

  // ── Sauvegarde ───────────────────────────────────────────────────────────
  const filename = `diagnostic-${vehicleInfo.marque}-${vehicleInfo.modele}-${vehicleInfo.annee}`
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
  doc.save(`${filename}.pdf`)
}
