/**
 * Télécharge les fichiers .txt du repo Wal33D/dtc-database,
 * parse chaque ligne et insère les codes dans la table dtc_codes de Turso.
 *
 * Lance ce script une seule fois : node scripts/import-dtc-codes.mjs
 * Il est idempotent (INSERT OR IGNORE).
 */
import { resolve } from "node:path"
import { config as loadEnv } from "dotenv"
import { createClient } from "@libsql/client"

loadEnv({ path: resolve(process.cwd(), ".env") })
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true })

const url = process.env.DATABASE_URL?.trim()
const authToken = process.env.TURSO_AUTH_TOKEN?.trim()

if (!url) {
  console.error("DATABASE_URL manquant dans .env.local")
  process.exit(1)
}

const db = createClient({ url, ...(authToken ? { authToken } : {}) })

const BASE_URL =
  "https://raw.githubusercontent.com/Wal33D/dtc-database/main/data/source-data"

// Fichiers génériques (codes universels OBD-II)
const GENERIC_FILES = ["p_codes.txt", "b_codes.txt", "c_codes.txt", "u_codes.txt"]

// Fichiers constructeur
const MANUFACTURER_FILES = [
  "acura_codes.txt",
  "audi_codes.txt",
  "bmw_codes.txt",
  "buick_codes.txt",
  "cadillac_codes.txt",
  "chevy_codes.txt",
  "chrysler_codes.txt",
  "dodge_codes.txt",
  "ford_codes.txt",
  "geo_codes.txt",
  "gm_codes.txt",
  "gmc_codes.txt",
  "honda_codes.txt",
  "infiniti_codes.txt",
  "jaguar_codes.txt",
  "jeep_codes.txt",
  "kia_codes.txt",
  "lexus_codes.txt",
  "lincoln_codes.txt",
  "mazda_codes.txt",
  "mercedes_codes.txt",
  "mercury_codes.txt",
  "mitsubishi_codes.txt",
  "nissan_codes.txt",
  "oldsmobile_codes.txt",
  "other_codes.txt",
  "plymouth_codes.txt",
  "pontiac_codes.txt",
  "saturn_codes.txt",
  "subaru_codes.txt",
  "suzuki_codes.txt",
  "toyota_codes.txt",
  "volkswagen_codes.txt",
]

// Regex : CODE - Description (tolère espaces variés)
const LINE_RE = /^([A-Z][0-9A-Z]{3,4})\s+-\s+(.+)$/

function manufacturerFromFilename(filename) {
  return filename.replace(/_codes\.txt$/, "").toUpperCase()
}

function typeFromCode(code) {
  const prefix = code[0].toUpperCase()
  if (prefix === "P") return "P"
  if (prefix === "B") return "B"
  if (prefix === "C") return "C"
  if (prefix === "U") return "U"
  return "P"
}

async function fetchAndParse(filename, isGeneric) {
  const manufacturer = isGeneric ? "GENERIC" : manufacturerFromFilename(filename)
  const response = await fetch(`${BASE_URL}/${filename}`)
  if (!response.ok) {
    console.warn(`  ⚠ Impossible de télécharger ${filename} (${response.status})`)
    return []
  }
  const text = await response.text()
  const rows = []
  for (const raw of text.split("\n")) {
    const line = raw.trim()
    const m = LINE_RE.exec(line)
    if (!m) continue
    const [, code, description_en] = m
    rows.push({
      code: code.toUpperCase(),
      manufacturer,
      type: typeFromCode(code),
      is_generic: isGeneric ? 1 : 0,
      description_en: description_en.trim(),
    })
  }
  return rows
}

async function insertBatch(rows) {
  if (rows.length === 0) return
  // Turso supporte batchSize de ~100 statements par appel
  const BATCH = 100
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH)
    await db.batch(
      slice.map((r) => ({
        sql: `INSERT OR IGNORE INTO dtc_codes
              (code, manufacturer, type, is_generic, description_en)
              VALUES (?, ?, ?, ?, ?)`,
        args: [r.code, r.manufacturer, r.type, r.is_generic, r.description_en],
      }))
    )
  }
}

let totalInserted = 0

// Fichiers génériques
for (const filename of GENERIC_FILES) {
  process.stdout.write(`Importing ${filename}...`)
  const rows = await fetchAndParse(filename, true)
  await insertBatch(rows)
  console.log(` ${rows.length} codes`)
  totalInserted += rows.length
}

// Fichiers constructeur
for (const filename of MANUFACTURER_FILES) {
  process.stdout.write(`Importing ${filename}...`)
  const rows = await fetchAndParse(filename, false)
  await insertBatch(rows)
  console.log(` ${rows.length} codes`)
  totalInserted += rows.length
}

// Vérification finale
const count = await db.execute("SELECT COUNT(*) as nb FROM dtc_codes")
console.log(`\nTotal importé : ${totalInserted} lignes parsées`)
console.log(`Total en base : ${count.rows[0].nb} codes`)

db.close()
