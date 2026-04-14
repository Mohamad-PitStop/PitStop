/**
 * Crée la table dtc_codes dans Turso.
 * Lance ce script une seule fois : node scripts/create-dtc-table.mjs
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

await db.execute(`
  CREATE TABLE IF NOT EXISTS dtc_codes (
    code         TEXT NOT NULL,
    manufacturer TEXT NOT NULL DEFAULT 'GENERIC',
    type         TEXT NOT NULL,
    is_generic   INTEGER NOT NULL DEFAULT 1,
    description_en TEXT NOT NULL,
    description_fr TEXT,
    symptomes    TEXT,
    causes       TEXT,
    solution     TEXT,
    gravite      TEXT,
    enriched     INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (code, manufacturer)
  )
`)

await db.execute(`CREATE INDEX IF NOT EXISTS idx_dtc_code ON dtc_codes (code)`)
await db.execute(`CREATE INDEX IF NOT EXISTS idx_dtc_enriched ON dtc_codes (enriched)`)

console.log("Table dtc_codes créée (ou déjà existante). Index créés.")
db.close()
