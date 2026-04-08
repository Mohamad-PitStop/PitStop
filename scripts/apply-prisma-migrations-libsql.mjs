/**
 * Prisma Migrate n’accepte pas les URLs libsql:// sur le moteur SQLite classique.
 * Ce script envoie chaque dossier prisma/migrations (fichier migration.sql) à Turso via executeMultiple.
 */
import { resolve } from "node:path"
import { readdirSync, readFileSync } from "node:fs"
import { config as loadEnv } from "dotenv"
import { createClient } from "@libsql/client"

loadEnv({ path: resolve(process.cwd(), ".env") })
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true })

const url = process.env.DATABASE_URL?.trim()
const authToken = process.env.TURSO_AUTH_TOKEN?.trim()

if (!url?.startsWith("libsql://") && !url?.startsWith("https://")) {
  console.error("DATABASE_URL doit être une URL libsql:// ou https:// (Turso).")
  process.exit(1)
}

const client = createClient({
  url,
  ...(authToken ? { authToken } : {}),
})

const migrationsRoot = resolve(process.cwd(), "prisma", "migrations")
const dirs = readdirSync(migrationsRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((name) => name !== "migration_lock.toml")
  .sort()

for (const dir of dirs) {
  const file = resolve(migrationsRoot, dir, "migration.sql")
  const sql = readFileSync(file, "utf8")
  console.log(`→ ${dir}`)
  try {
    await client.executeMultiple(sql)
  } catch (e) {
    const msg = String(e?.message ?? e)
    if (msg.includes("already exists") || msg.includes("duplicate")) {
      console.warn(`  (déjà appliqué ou conflit ignoré) ${msg.slice(0, 160)}`)
      continue
    }
    throw e
  }
}

console.log("Migrations appliquées sur la base distante.")
client.close()
