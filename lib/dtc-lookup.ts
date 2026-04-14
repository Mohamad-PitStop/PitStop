import { createClient } from "@libsql/client"
import { generateObject } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { getDatabaseUrl, getTursoAuthToken } from "@/lib/database-config"

export type DtcRecord = {
  code: string
  manufacturer: string
  type: string
  description_en: string
  description_fr: string | null
  symptomes: string[] | null
  causes: string[] | null
  solution: string | null
  gravite: "low" | "medium" | "high" | null
}

// Cache mémoire : survive le lifetime du process Next.js (warm entre requêtes)
const cache = new Map<string, DtcRecord | null>()

function getDb() {
  const authToken = getTursoAuthToken()
  return createClient({
    url: getDatabaseUrl(),
    ...(authToken ? { authToken } : {}),
  })
}

// Regex : codes DTC standards (P/B/C/U + 4 caractères alphanumériques)
const DTC_RE = /\b([PBCU][0-9][0-9A-Z]{2}[0-9A-Z])\b/gi

// Mots-clés "voyant tableau de bord" — FR / EN / NL
const WARNING_LIGHT_RE =
  /\b(voyant|témoin|témoin lumineux|témoin d[e']|warning\s*light|check\s*engine|engine\s*light|dashboard\s*light|dashboard\s*warning|kontrollelampje|controlelamp(?:je)?|waarschuwingslamp(?:je)?|dashboard\s*lamp|motorkontrolllys)\b/i

const EnrichSchema = z.object({
  description_fr: z.string(),
  symptomes: z.array(z.string()).max(4),
  causes: z.array(z.string()).max(4),
  solution: z.string(),
  gravite: z.enum(["low", "medium", "high"]),
})

/**
 * Enrichit un code non encore traité via Claude Haiku (lazy, à la demande).
 * Sauvegarde le résultat en base pour les prochaines fois.
 */
async function enrichOnDemand(record: DtcRecord): Promise<DtcRecord> {
  try {
    const { object } = await generateObject({
      model: anthropic("claude-haiku-4-5-20251001"),
      schema: EnrichSchema,
      system:
        "Tu es un expert en diagnostic automobile. Pour le code DTC fourni, retourne les informations demandées en français.",
      prompt: `Code DTC : ${record.code}\nDescription (EN) : ${record.description_en}\n\nFournis : description_fr (max 80 chars), symptomes (2-4 symptômes observables), causes (2-4 causes probables par ordre de probabilité), solution (1-2 phrases), gravite (low/medium/high).`,
    })

    const enriched: DtcRecord = {
      ...record,
      description_fr: object.description_fr,
      symptomes: object.symptomes,
      causes: object.causes,
      solution: object.solution,
      gravite: object.gravite,
    }

    // Sauvegarde en base (fire & forget — ne bloque pas la réponse)
    const db = getDb()
    db.execute({
      sql: `UPDATE dtc_codes
            SET description_fr = ?, symptomes = ?, causes = ?, solution = ?, gravite = ?, enriched = 1
            WHERE code = ? AND manufacturer = ?`,
      args: [
        object.description_fr,
        JSON.stringify(object.symptomes),
        JSON.stringify(object.causes),
        object.solution,
        object.gravite,
        record.code,
        record.manufacturer,
      ],
    }).finally(() => db.close())

    return enriched
  } catch {
    // Si l'enrichissement échoue, on retourne le record brut (description EN)
    return record
  }
}

/**
 * Détecte si le texte mentionne un voyant tableau de bord.
 */
export function detectsWarningLight(text: string): boolean {
  return WARNING_LIGHT_RE.test(text)
}

/**
 * Extrait tous les codes DTC présents dans le texte (dédupliqués, majuscules).
 */
export function extractDtcCodes(text: string): string[] {
  const matches = text.matchAll(DTC_RE)
  const found = new Set<string>()
  for (const m of matches) found.add(m[1].toUpperCase())
  return Array.from(found)
}

/**
 * Récupère les fiches DTC pour une liste de codes.
 * - Si enriched=1 : retourne les données complètes
 * - Si enriched=0 : enrichit à la demande via Haiku et sauvegarde
 * Priorise le code constructeur (marque) si disponible, sinon GENERIC.
 * Max 5 fiches retournées.
 */
export async function lookupDtcCodes(
  codes: string[],
  marque?: string | null
): Promise<DtcRecord[]> {
  if (codes.length === 0) return []

  const db = getDb()
  const results: DtcRecord[] = []
  const normalizedMarque = marque?.toUpperCase().trim() ?? null

  for (const code of codes.slice(0, 5)) {
    const cacheKey = `${code}|${normalizedMarque ?? "GENERIC"}`

    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)
      if (cached) results.push(cached)
      continue
    }

    // Cherche d'abord le code constructeur, puis GENERIC en fallback
    let record: DtcRecord | null = null

    if (normalizedMarque) {
      const r = await db.execute({
        sql: `SELECT code, manufacturer, type, description_en, description_fr,
                     symptomes, causes, solution, gravite, enriched
              FROM dtc_codes
              WHERE code = ? AND manufacturer = ?
              LIMIT 1`,
        args: [code, normalizedMarque],
      })
      if (r.rows.length > 0) record = rowToRecord(r.rows[0])
    }

    if (!record) {
      const r = await db.execute({
        sql: `SELECT code, manufacturer, type, description_en, description_fr,
                     symptomes, causes, solution, gravite, enriched
              FROM dtc_codes
              WHERE code = ? AND manufacturer = 'GENERIC'
              LIMIT 1`,
        args: [code],
      })
      if (r.rows.length > 0) record = rowToRecord(r.rows[0])
    }

    // Enrichissement lazy si le code existe mais n'est pas encore enrichi
    if (record && !record.description_fr) {
      record = await enrichOnDemand(record)
    }

    cache.set(cacheKey, record)
    if (record) results.push(record)
  }

  db.close()
  return results
}

function rowToRecord(row: Record<string, unknown>): DtcRecord {
  return {
    code: String(row.code ?? ""),
    manufacturer: String(row.manufacturer ?? "GENERIC"),
    type: String(row.type ?? "P"),
    description_en: String(row.description_en ?? ""),
    description_fr: row.description_fr ? String(row.description_fr) : null,
    symptomes: parseJsonArray(row.symptomes),
    causes: parseJsonArray(row.causes),
    solution: row.solution ? String(row.solution) : null,
    gravite: (row.gravite as DtcRecord["gravite"]) ?? null,
  }
}

function parseJsonArray(value: unknown): string[] | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(String(value))
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Retourne un bloc de contexte DTC prêt à injecter dans le prompt Claude.
 * Retourne une chaîne vide si aucun code n'est trouvé.
 */
export async function getDtcContext(
  text: string,
  marque?: string | null,
  locale?: string
): Promise<string> {
  if (!detectsWarningLight(text)) return ""

  const codes = extractDtcCodes(text)
  if (codes.length === 0) return ""

  const records = await lookupDtcCodes(codes, marque)
  if (records.length === 0) return ""

  const isFr = !locale || locale === "fr"
  const isNl = locale === "nl"

  const header = isFr
    ? "Fiches DTC (codes défaut détectés dans le problème décrit) :"
    : isNl
      ? "DTC-fiches (foutcodes gedetecteerd in het beschreven probleem) :"
      : "DTC records (fault codes detected in the described problem):"

  const lines = records.map((r, i) => {
    const desc = isFr && r.description_fr ? r.description_fr : r.description_en
    const symptomesStr = r.symptomes?.join(", ") ?? ""
    const causesStr = r.causes?.join(" / ") ?? ""
    const graviteLabel =
      r.gravite === "high"
        ? isFr ? "élevée" : isNl ? "hoog" : "high"
        : r.gravite === "low"
          ? isFr ? "faible" : isNl ? "laag" : "low"
          : isFr ? "moyenne" : isNl ? "gemiddeld" : "medium"

    const parts = [`${i + 1}) ${r.code} — ${desc}`]
    if (r.gravite) parts.push(`   Gravité: ${graviteLabel}`)
    if (symptomesStr) parts.push(`   Symptômes: ${symptomesStr}`)
    if (causesStr) parts.push(`   Causes: ${causesStr}`)
    if (r.solution) parts.push(`   Solution courante: ${r.solution}`)
    return parts.join("\n")
  })

  return `\n\n${header}\n${lines.join("\n\n")}`
}
