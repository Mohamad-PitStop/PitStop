import fs from "node:fs"
import path from "node:path"

type KnowledgeEntry = {
  url: string
  title: string
  excerpt: string
}

type KnowledgeFile = {
  byModel?: Record<string, { engines?: Record<string, KnowledgeEntry[]> }>
}

export type AutoDocSnippet = {
  score: number
  model: string
  engine: string
  url: string
  title: string
  excerpt: string
}

let cachedKnowledge: KnowledgeFile | null = null

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length >= 3)
}

function clip(text: string, max = 450): string {
  const t = (text || "").replace(/\s+/g, " ").trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}...`
}

function loadKnowledgeFile(): KnowledgeFile {
  if (cachedKnowledge) return cachedKnowledge

  const filePath = path.join(process.cwd(), "data", "autodoc-problemes-de-voitures-manual.json")
  if (!fs.existsSync(filePath)) {
    cachedKnowledge = {}
    return cachedKnowledge
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8")
    const parsed = JSON.parse(raw) as KnowledgeFile
    cachedKnowledge = parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    cachedKnowledge = {}
  }

  return cachedKnowledge
}

function scoreModelMatch(modelKey: string, marque: string, modele: string): number {
  const modelNorm = normalizeText(modelKey)
  const marqueNorm = normalizeText(marque)
  const modeleNorm = normalizeText(modele)

  let score = 0
  if (modeleNorm && modelNorm.includes(modeleNorm)) score += 35
  if (marqueNorm && modelNorm.includes(marqueNorm)) score += 15

  if (modeleNorm && marqueNorm && modelNorm.includes(`${marqueNorm} ${modeleNorm}`)) score += 20

  if (modelNorm.includes("unknown model")) score -= 30
  return score
}

function scoreProblemOverlap(problemTokens: string[], haystack: string): number {
  if (problemTokens.length === 0) return 0
  const text = normalizeText(haystack)
  let hits = 0
  for (const tok of problemTokens) {
    if (text.includes(tok)) hits++
  }
  return hits * 4
}

function fuelHintScore(carburant: string | null | undefined, content: string): number {
  const c = normalizeText(content)
  const fuel = normalizeText(carburant || "")
  if (!fuel) return 0

  if (fuel.includes("diesel") && /(diesel|dci|tdi|hdi|cdti|tdci)/.test(c)) return 6
  if (fuel.includes("essence") && /(essence|tsi|tce|puretech|ecoboost|vtec)/.test(c)) return 6
  if (fuel.includes("hybride") && /(hybride|hybrid|phev)/.test(c)) return 6
  if (fuel.includes("electrique") && /(electrique|electric|ev)/.test(c)) return 6
  return 0
}

export function getAutoDocContext(input: {
  marque: string
  modele: string
  probleme: string
  carburant?: string | null
  limit?: number
}): { snippets: AutoDocSnippet[]; contextBlock: string } {
  const knowledge = loadKnowledgeFile()
  const byModel = knowledge.byModel || {}
  const limit = input.limit ?? 6
  const problemTokens = tokenize(input.probleme || "")

  const candidates: AutoDocSnippet[] = []

  for (const [modelKey, payload] of Object.entries(byModel)) {
    const modelScore = scoreModelMatch(modelKey, input.marque, input.modele)
    const engines = payload?.engines || {}

    for (const [engineKey, entries] of Object.entries(engines)) {
      for (const entry of entries || []) {
        if (!entry?.url) continue
        const content = `${entry.title || ""}\n${entry.excerpt || ""}`
        const score =
          modelScore +
          scoreProblemOverlap(problemTokens, content) +
          fuelHintScore(input.carburant, content)

        // Gate minimum relevance to avoid polluting prompt.
        if (score < 18) continue

        candidates.push({
          score,
          model: modelKey.trim(),
          engine: engineKey,
          url: entry.url,
          title: entry.title || "",
          excerpt: clip(entry.excerpt || ""),
        })
      }
    }
  }

  const deduped = Array.from(
    new Map(
      candidates
        .sort((a, b) => b.score - a.score)
        .map((c) => [`${c.url}|${c.engine}`, c] as const)
    ).values()
  ).slice(0, limit)

  if (deduped.length === 0) {
    return { snippets: [], contextBlock: "" }
  }

  const contextBlock = [
    "Connaissances mecaniques AutoDoc (retours de pannes frequentes, a utiliser seulement si pertinent):",
    ...deduped.map(
      (s, idx) =>
        `${idx + 1}) Modele: ${s.model} | Moteur: ${s.engine} | Titre: ${s.title}\n` +
        `   Extrait: ${s.excerpt}\n` +
        `   Source: ${s.url}`
    ),
  ].join("\n")

  return { snippets: deduped, contextBlock }
}

