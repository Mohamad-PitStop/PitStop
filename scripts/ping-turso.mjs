import { resolve } from "node:path"
import { config as loadEnv } from "dotenv"
import { createClient } from "@libsql/client"

loadEnv({ path: resolve(process.cwd(), ".env") })
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true })

const url = process.env.DATABASE_URL?.trim()
const authToken = process.env.TURSO_AUTH_TOKEN?.trim()

if (!url) {
  console.error("DATABASE_URL manquant.")
  process.exit(1)
}

const client = createClient({
  url,
  ...(authToken ? { authToken } : {}),
})

const r = await client.execute("SELECT 1 AS ok")
console.log("Connexion Turso OK, réponse:", r.rows)
client.close()
