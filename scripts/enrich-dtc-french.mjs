/**
 * Enrichit les codes DTC avec Claude Haiku :
 *   - description_fr  : traduction française
 *   - symptomes       : JSON array (2-4 symptômes)
 *   - causes          : JSON array (2-4 causes probables)
 *   - solution        : solution courante (1-2 phrases)
 *   - gravite         : "low" | "medium" | "high"
 *
 * Traite les codes en batches de 30. Reprend où il s'est arrêté (enriched = 0).
 * Lance : node scripts/enrich-dtc-french.mjs
 * Coût estimé : ~1-2 € pour les 18 805 codes (Claude Haiku)
 */
import { resolve } from "node:path"
import { config as loadEnv } from "dotenv"
import { createClient } from "@libsql/client"
loadEnv({ path: resolve(process.cwd(), ".env") })
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true })

const url = process.env.DATABASE_URL?.trim()
const authToken = process.env.TURSO_AUTH_TOKEN?.trim()
const apiKey = process.env.ANTHROPIC_API_KEY?.trim()

if (!url) { console.error("DATABASE_URL manquant"); process.exit(1) }
if (!apiKey) { console.error("ANTHROPIC_API_KEY manquant"); process.exit(1) }

const db = createClient({ url, ...(authToken ? { authToken } : {}) })

const BATCH_SIZE = 10
const DELAY_MS = 300 // pause entre batches pour éviter rate-limit

const SYSTEM_PROMPT = `Tu es un expert en diagnostic automobile.
Pour chaque code DTC fourni (code + description en anglais), retourne un objet JSON avec exactement ces champs :
- description_fr : traduction française concise de la description (max 80 caractères)
- symptomes : tableau de 2 à 4 symptômes observables par le conducteur (en français)
- causes : tableau de 2 à 4 causes probables (en français, ordre décroissant de probabilité)
- solution : solution courante en 1-2 phrases (en français)
- gravite : "low" (voyant info, non urgent), "medium" (à corriger prochainement), "high" (dangereux ou immobilisant)

Réponds UNIQUEMENT avec un tableau JSON valide, sans markdown, sans texte avant/après.
Format exact : [{"code":"P0001","description_fr":"...","symptomes":["..."],"causes":["..."],"solution":"...","gravite":"low"}]`

async function enrichBatch(rows) {
  const input = rows.map((r) => `${r.code}: ${r.description_en}`).join("\n")

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: input }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text ?? ""

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    // Tenter d'extraire le JSON si du texte parasite s'est glissé
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) throw new Error(`JSON invalide reçu : ${text.slice(0, 200)}`)
    parsed = JSON.parse(match[0])
  }

  return parsed
}

async function saveBatch(enriched) {
  await db.batch(
    enriched.map((e) => ({
      sql: `UPDATE dtc_codes
            SET description_fr = ?,
                symptomes       = ?,
                causes          = ?,
                solution        = ?,
                gravite         = ?,
                enriched        = 1
            WHERE code = ? AND manufacturer = 'GENERIC'`,
      args: [
        e.description_fr ?? null,
        e.symptomes ? JSON.stringify(e.symptomes) : null,
        e.causes ? JSON.stringify(e.causes) : null,
        e.solution ?? null,
        e.gravite ?? "medium",
        e.code,
      ],
    }))
  )
}

// Compter ce qu'il reste
const total = await db.execute(
  "SELECT COUNT(*) as nb FROM dtc_codes WHERE enriched = 0 AND manufacturer = 'GENERIC'"
)
const remaining = Number(total.rows[0].nb)
console.log(`Codes à enrichir : ${remaining}`)
if (remaining === 0) {
  console.log("Rien à faire, tous les codes génériques sont déjà enrichis.")
  db.close()
  process.exit(0)
}

let done = 0
let errors = 0

while (true) {
  const result = await db.execute(
    `SELECT code, description_en FROM dtc_codes
     WHERE enriched = 0 AND manufacturer = 'GENERIC'
     LIMIT ${BATCH_SIZE}`
  )
  const rows = result.rows
  if (rows.length === 0) break

  try {
    const enriched = await enrichBatch(rows)
    await saveBatch(enriched)
    done += rows.length
    process.stdout.write(`\r  ${done}/${remaining} enrichis (${errors} erreurs)`)
  } catch (err) {
    errors++
    console.error(`\nErreur batch : ${err.message}`)
    // Marquer comme enriched=2 pour ne pas bloquer (on pourra les retraiter)
    await db.batch(
      rows.map((r) => ({
        sql: "UPDATE dtc_codes SET enriched = 2 WHERE code = ? AND manufacturer = 'GENERIC'",
        args: [r.code],
      }))
    )
  }

  if (rows.length < BATCH_SIZE) break
  await new Promise((r) => setTimeout(r, DELAY_MS))
}

console.log(`\n\nEnrichissement terminé : ${done} codes enrichis, ${errors} batches en erreur.`)
if (errors > 0) {
  console.log("Pour retraiter les erreurs : UPDATE dtc_codes SET enriched = 0 WHERE enriched = 2;")
}
db.close()
