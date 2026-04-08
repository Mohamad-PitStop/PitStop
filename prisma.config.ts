import { resolve } from "node:path"
import { config as loadEnv } from "dotenv"
import { defineConfig } from "prisma/config"
import { getDatabaseUrl } from "./lib/database-config"

// Prisma CLI ne charge pas .env.local par défaut (contrairement à Next.js).
loadEnv({ path: resolve(process.cwd(), ".env") })
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true })

export default defineConfig({
  datasource: {
    url: getDatabaseUrl(),
  },
})

