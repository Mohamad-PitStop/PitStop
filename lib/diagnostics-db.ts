import { createClient } from "@libsql/client"

const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db"
const authToken = process.env.TURSO_AUTH_TOKEN

function getDb() {
  return createClient({
    url: dbUrl,
    ...(authToken ? { authToken } : {}),
  })
}

let userIdColumnEnsured = false
let statusColumnEnsured = false

async function ensureUserIdColumn() {
  if (userIdColumnEnsured) return
  const db = getDb()
  try {
    await db.execute(`ALTER TABLE DiagnosticRequest ADD COLUMN userId TEXT`)
  } catch {
    // colonne déjà présente
  }
  userIdColumnEnsured = true
}

async function ensureStatusColumn() {
  if (statusColumnEnsured) return
  const db = getDb()
  try {
    await db.execute(
      `ALTER TABLE DiagnosticRequest ADD COLUMN status TEXT NOT NULL DEFAULT 'in_progress'`
    )
  } catch {
    // colonne déjà présente
  }
  statusColumnEnsured = true
}

export type DiagnosticStatus = "in_progress" | "completed" | "abandoned"

export type DiagnosticRow = {
  id: string
  createdAt: string
  marque: string
  modele: string
  variante: string | null
  carburant: string | null
  transmission: string | null
  annee: string
  kilometrage: string
  probleme: string
  followUps: string | null
  promptText: string
  userId: string | null
  status: DiagnosticStatus
}

export type DiagnosticInsertInput = {
  marque: string
  modele: string
  variante: string | null
  carburant: string | null
  transmission: string | null
  annee: string
  kilometrage: string
  probleme: string
  followUps: string | null
  promptText: string
  userId?: string | null
}

export async function createDiagnosticRequest(input: DiagnosticInsertInput): Promise<string> {
  await ensureUserIdColumn()
  await ensureStatusColumn()
  const db = getDb()
  const id = globalThis.crypto?.randomUUID?.() ?? `diag-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  await db.execute({
    sql: `INSERT INTO DiagnosticRequest (
            id,
            "createdAt",
            marque,
            modele,
            variante,
            carburant,
            transmission,
            annee,
            kilometrage,
            probleme,
            "followUps",
            "promptText",
            userId,
            status
          ) VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_progress')`,
    args: [
      id,
      input.marque,
      input.modele,
      input.variante,
      input.carburant,
      input.transmission,
      input.annee,
      input.kilometrage,
      input.probleme,
      input.followUps,
      input.promptText,
      input.userId ?? null,
    ],
  })

  return id
}

export async function updateDiagnosticStatus(id: string, status: DiagnosticStatus): Promise<void> {
  await ensureStatusColumn()
  const db = getDb()
  await db.execute({
    sql: `UPDATE DiagnosticRequest SET status = ? WHERE id = ?`,
    args: [status, id],
  })
}

export async function getDiagnosticRequestById(id: string): Promise<DiagnosticRow | null> {
  await ensureUserIdColumn()
  await ensureStatusColumn()
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT id, "createdAt", marque, modele, variante, carburant, transmission, annee, kilometrage, probleme, "followUps", "promptText", userId, status
          FROM DiagnosticRequest WHERE id = ? LIMIT 1`,
    args: [id],
  })
  if (result.rows.length === 0) return null
  return mapRow(result.rows[0])
}

export async function updateDiagnosticRequestFollowUps(input: {
  id: string
  followUps: string | null
  promptText: string
  userId?: string | null
}): Promise<void> {
  await ensureUserIdColumn()
  await ensureStatusColumn()
  const db = getDb()

  await db.execute({
    sql: `UPDATE DiagnosticRequest
          SET "followUps" = ?, "promptText" = ?, userId = COALESCE(?, userId)
          WHERE id = ?`,
    args: [input.followUps, input.promptText, input.userId ?? null, input.id],
  })
}

export async function getDiagnosticRequests(limit: number): Promise<DiagnosticRow[]> {
  await ensureStatusColumn()
  const db = getDb()
  const limitNum = Math.min(Math.max(1, limit), 500)
  const result = await db.execute({
    sql: `SELECT id, "createdAt", marque, modele, variante, carburant, transmission, annee, kilometrage, probleme, "followUps", "promptText", userId, status
          FROM DiagnosticRequest
          ORDER BY "createdAt" DESC
          LIMIT ?`,
    args: [limitNum],
  })

  return result.rows.map(mapRow)
}

export async function getDiagnosticsByUserId(userId: string, limit: number): Promise<DiagnosticRow[]> {
  await ensureUserIdColumn()
  await ensureStatusColumn()
  const db = getDb()
  const limitNum = Math.min(Math.max(1, limit), 200)
  const result = await db.execute({
    sql: `SELECT id, "createdAt", marque, modele, variante, carburant, transmission, annee, kilometrage, probleme, "followUps", "promptText", userId, status
          FROM DiagnosticRequest
          WHERE userId = ?
          ORDER BY "createdAt" DESC
          LIMIT ?`,
    args: [userId, limitNum],
  })
  return result.rows.map(mapRow)
}

function mapRow(row: Record<string, unknown>): DiagnosticRow {
  return {
    id: String(row.id),
    createdAt: String(row.createdAt),
    marque: String(row.marque),
    modele: String(row.modele),
    variante: row.variante != null ? String(row.variante) : null,
    carburant: row.carburant != null ? String(row.carburant) : null,
    transmission: row.transmission != null ? String(row.transmission) : null,
    annee: String(row.annee),
    kilometrage: String(row.kilometrage),
    probleme: String(row.probleme),
    followUps: row.followUps != null ? String(row.followUps) : null,
    promptText: String(row.promptText),
    userId: row.userId != null ? String(row.userId) : null,
    status: (row.status as DiagnosticStatus) ?? "in_progress",
  }
}
