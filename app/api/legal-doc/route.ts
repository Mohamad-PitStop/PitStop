import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function findLegalDir(): string | null {
  const entries = fs.readdirSync(process.cwd(), { withFileTypes: true })
  const dir = entries.find((entry) => {
    if (!entry.isDirectory()) return false
    const n = normalize(entry.name)
    return n.includes("legal")
  })
  return dir ? path.join(process.cwd(), dir.name) : null
}

function findPdfFile(doc: string, legalDir: string): string | null {
  const files = fs.readdirSync(legalDir)
  const pdfs = files.filter((f) => f.toLowerCase().endsWith(".pdf"))

  const byDoc: Record<string, RegExp> = {
    cgv: /CGV.*client.*\.pdf$/i,
    cgp: /CGP.*garages?.*\.pdf$/i,
    sla: /SLA.*PitStop.*\.pdf$/i,
    litige: /Litige[_ -]?retard[_ -]?noshow.*\.pdf$/i,
    politique_ia: /Politique IA.*\.pdf$/i,
  }

  const matcher = byDoc[doc]
  if (!matcher) return null
  const file = pdfs.find((f) => matcher.test(f))
  return file ? path.join(legalDir, file) : null
}

export async function GET(req: NextRequest) {
  const doc = req.nextUrl.searchParams.get("doc") ?? ""
  const legalDir = findLegalDir()
  if (!legalDir) {
    return NextResponse.json({ ok: false, error: "Dossier légal introuvable." }, { status: 404 })
  }

  const filePath = findPdfFile(doc, legalDir)
  if (!filePath || !fs.existsSync(filePath)) {
    return NextResponse.json({ ok: false, error: "Document introuvable." }, { status: 404 })
  }

  const buffer = fs.readFileSync(filePath)
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "private, max-age=60",
    },
  })
}

