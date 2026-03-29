/**
 * Aggregate manual exports from auto-doc articles into a single JSON structure:
 * data/autodoc-problemes-de-voitures.json
 *
 * Input: either
 * - a directory of .json files exported from the browser snippet, OR
 * - a single .json file containing an array of exports
 *
 * Each export should look like:
 * { url: string, title: string, excerpt: string, text: string }
 */

import fs from "node:fs"
import path from "node:path"

function getArg(name, fallback) {
  const idx = process.argv.indexOf(name)
  if (idx === -1) return fallback
  const v = process.argv[idx + 1]
  return v == null ? fallback : v
}

function normalizeSpace(s) {
  return String(s || "").replace(/\s+/g, " ").trim()
}

function modelFromUrl(url) {
  try {
    const u = new URL(url)
    const pathName = u.pathname
    const m = pathName.match(/\/info\/problemes-avec-(le|la|l|l'-)?(.+)$/i)
    if (!m?.[2]) return "Unknown model"
    const slug = m[2]
    return slug
      .split("-")
      .map((x) => (x ? x.charAt(0).toUpperCase() + x.slice(1) : x))
      .join(" ")
      .replace(/\b(Lh|L')/g, "")
  } catch {
    return "Unknown model"
  }
}

function uniq(arr) {
  return Array.from(new Set(arr))
}

function normalizeEngineToken(raw) {
  let s = normalizeSpace(raw)
  if (!s) return null

  s = s.replace(/d[-\s]?ci/i, "dCi")
  s = s.replace(/td[i]?/gi, "TDI")
  s = s.replace(/ts[i]?/gi, "TSI")
  s = s.replace(/hdi/gi, "HDI")
  s = s.replace(/cdti/gi, "CDTi")
  s = s.replace(/tdc[i]?/gi, "TDCi")
  s = s.replace(/i[-–—]?\s*VTEC/gi, "i-VTEC")
  s = s.replace(/pure[-\s]?tech/gi, "PureTech")
  s = s.replace(/ecoboost/gi, "EcoBoost")
  s = s.replace(/blue[-\s]?hdi/gi, "BlueHDi")
  s = s.replace(/électrique|electric/gi, "Électrique")
  s = s.replace(/hybride\s+rechargeable|plug[-\s]?in\s+hybrid|phev/gi, "Hybride rechargeable")
  s = s.replace(/hybride/gi, "Hybride")

  // "2 .0" => "2.0"
  s = s.replace(/(\d)\s+\.\s+(\d)/g, "$1.$2")
  s = s.replace(/\s+/g, " ").trim()
  return s || null
}

function extractEnginesFromText(text) {
  const t = normalizeSpace(text)
  if (!t) return []

  const tokens = []

  const withDisplacement = t.matchAll(
    /\b(\d+(?:[.,]\d+)?)\s?(dCi|TDI|TSI|HDI|CDTi|TDCi|i[-–—]?\s*VTEC|PureTech|EcoBoost|BlueHDi)\b/gi
  )
  for (const m of withDisplacement) {
    const disp = m[1]
    const code = m[2]
    tokens.push(`${disp.replace(",", ".")} ${code}`)
  }

  if (/\b(hybride rechargeable|plug[-\s]?in\s+hybrid|phev)\b/i.test(t)) tokens.push("Hybride rechargeable")
  if (/\b(électrique|electric vehicle|electrique)\b/i.test(t)) tokens.push("Électrique")
  if (/\b(hybride)\b/i.test(t)) tokens.push("Hybride")

  return uniq(tokens.map(normalizeEngineToken).filter(Boolean))
}

function extractParagraphsFallback(text, maxParagraphs = 3) {
  const t = normalizeSpace(text)
  if (!t) return []
  const paras = t
    .split(/\n\s*\n/g)
    .map((p) => normalizeSpace(p))
    .filter(Boolean)
  if (paras.length) return paras.slice(0, maxParagraphs)
  const sentences = t.split(/(?<=[.!?])\s+/).map((s) => normalizeSpace(s)).filter(Boolean)
  return sentences.slice(0, maxParagraphs)
}

function loadExports(inputPath) {
  const stats = fs.existsSync(inputPath) ? fs.statSync(inputPath) : null
  if (!stats) throw new Error(`Input not found: ${inputPath}`)

  if (stats.isDirectory()) {
    const files = fs.readdirSync(inputPath).filter((f) => f.endsWith(".json"))
    return files
      .sort()
      .flatMap((f) => {
        const full = path.join(inputPath, f)
        try {
          const data = JSON.parse(fs.readFileSync(full, "utf8"))
          return Array.isArray(data) ? data : [data]
        } catch {
          return []
        }
      })
  }

  // Single JSON file
  const raw = fs.readFileSync(inputPath, "utf8")
  const data = JSON.parse(raw)
  return Array.isArray(data) ? data : [data]
}

function main() {
  const inPath = getArg("--in", "")
  const outPath = getArg("--out", "")
  if (!inPath) throw new Error("Missing --in <dir|file.json>")
  if (!outPath) throw new Error("Missing --out <path.json>")

  const exports = loadExports(inPath)
  const byModel = {}

  for (const ex of exports) {
    const url = ex?.url
    if (typeof url !== "string" || !url.startsWith("https://")) continue

    const title = typeof ex?.title === "string" ? normalizeSpace(ex.title) : ""
    const excerpt =
      typeof ex?.excerpt === "string" && normalizeSpace(ex.excerpt)
        ? normalizeSpace(ex.excerpt)
        : extractParagraphsFallback(ex?.text || "", 2).join("\n\n")

    const model = modelFromUrl(url)
    const engines = extractEnginesFromText(ex?.text || "") || []
    const finalEngines = engines.length ? engines : ["_unknown"]

    if (!byModel[model]) byModel[model] = { engines: {} }
    for (const engine of finalEngines) {
      if (!byModel[model].engines[engine]) byModel[model].engines[engine] = []
      byModel[model].engines[engine].push({ url, title, excerpt })
    }
  }

  const final = {
    generatedAt: new Date().toISOString(),
    source: { site: "auto-doc.fr", mode: "manual-exports" },
    byModel,
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(final, null, 2), "utf8")
  console.log(`OK: wrote ${outPath} (models=${Object.keys(byModel).length})`)
}

main()

