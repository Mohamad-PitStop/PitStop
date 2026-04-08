import { PrismaClient } from "@/generated/prisma"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { getDatabaseUrl, getTursoAuthToken } from "@/lib/database-config"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const databaseUrl = getDatabaseUrl()
const authToken = getTursoAuthToken()
const adapter = new PrismaLibSql({ url: databaseUrl, authToken })

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

