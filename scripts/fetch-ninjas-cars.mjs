/**
 * Récupère toute la base accessible via l’API Ninjas Cars (une dernière fois)
 * et la stocke en local. Ensuite le site n’utilise plus l’API.
 * Usage: node scripts/fetch-ninjas-cars.mjs
 * Nécessite API_NINJAS_KEY dans .env.local ou .env
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

function loadEnv() {
  const envLocal = path.join(ROOT, ".env.local")
  const env = path.join(ROOT, ".env")
  for (const p of [envLocal, env]) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, "utf8")
      for (const line of content.split("\n")) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
        if (m) {
          const val = m[2].replace(/^["']|["']$/g, "").trim()
          if (!process.env[m[1]]) process.env[m[1]] = val
        }
      }
    }
  }
}
loadEnv()

const BASE = "https://api.api-ninjas.com/v1/cars"
const KEY = process.env.API_NINJAS_KEY
const DELAY_MS = 220

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchApi(params) {
  const url = new URL(BASE)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const res = await fetch(url.toString(), { headers: { "X-Api-Key": KEY } })
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

function normalizeMake(raw) {
  if (!raw || typeof raw !== "string") return ""
  const s = raw.trim()
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ""
}

function normalizeModel(raw) {
  return (raw && typeof raw === "string" ? raw.trim() : "") || ""
}

function mapFuelType(api) {
  if (!api) return ""
  const v = String(api).toLowerCase()
  if (v === "gas" || v === "essence") return "Essence"
  if (v === "diesel") return "Diesel"
  if (v === "electric" || v === "electricity") return "Électrique"
  if (v.includes("hybrid") && (v.includes("plugin") || v.includes("plug-in"))) return "Hybride rechargeable"
  if (v.includes("hybrid")) return "Hybride"
  if (v === "flex fuel" || v === "e85") return "E85"
  if (v === "natural gas" || v === "cng") return "GNV"
  if (v === "lpg" || v === "gpl") return "GPL"
  if (v === "hydrogen") return "Hydrogène"
  return normalizeMake(api)
}

function mapTransmission(api) {
  if (!api) return ""
  const v = String(api).toLowerCase()
  if (v === "a" || v === "automatic" || v === "auto") return "Automatique"
  if (v === "m" || v === "manual") return "Manuelle"
  if (v.includes("automated") || v.includes("robot") || v.includes("dct") || v.includes("dual clutch")) return "Semi-automatique (robotisée)"
  if (v.includes("cvt")) return "Automatique"
  return String(api).trim()
}

const currentYear = new Date().getFullYear()
const yearsToQuery = []
for (let y = 1990; y <= currentYear; y++) yearsToQuery.push(y)

async function main() {
  if (!KEY) {
    console.error("API_NINJAS_KEY manquant. Définir dans .env.local ou .env")
    process.exit(1)
  }

  const allMakes = new Set()
  console.log("Phase 1 — Récupération des marques (chaque année)...")
  for (const year of yearsToQuery) {
    const cars = await fetchApi({ year })
    for (const c of cars) {
      if (c.make) allMakes.add(normalizeMake(c.make))
    }
    await sleep(DELAY_MS)
  }

  const makes = Array.from(allMakes).filter(Boolean).sort((a, b) => a.localeCompare(b))
  console.log(`${makes.length} marques trouvées.`)

  const byMake = {}
  const byMakeModel = {}

  for (let i = 0; i < makes.length; i++) {
    const make = makes[i]
    const makeKey = make.toLowerCase()
    console.log(`Phase 2 — [${i + 1}/${makes.length}] ${make} (par année)...`)
    const modelsSet = new Set()
    const fuelSet = new Set()
    const transSet = new Set()
    const yearsSet = new Set()

    for (const year of yearsToQuery) {
      const cars = await fetchApi({ make: makeKey, year })
      for (const c of cars) {
        if (c.model) modelsSet.add(normalizeModel(c.model))
        const f = mapFuelType(c.fuel_type)
        if (f) fuelSet.add(f)
        const t = mapTransmission(c.transmission)
        if (t) transSet.add(t)
        if (typeof c.year === "number" && c.year >= 1990) yearsSet.add(c.year)
      }
      await sleep(DELAY_MS)
    }

    const models = Array.from(modelsSet).filter(Boolean).sort((a, b) => a.localeCompare(b))
    byMake[make] = {
      models,
      fuelTypes: Array.from(fuelSet).sort((a, b) => a.localeCompare(b)),
      transmissions: Array.from(transSet).sort((a, b) => a.localeCompare(b)),
      years: Array.from(yearsSet).sort((a, b) => a - b),
    }

    byMakeModel[make] = {}
    for (let j = 0; j < models.length; j++) {
      const model = models[j]
      const modelKey = model.toLowerCase()
      process.stdout.write(`  [${j + 1}/${models.length}] ${model}... `)
      const fuelM = new Set()
      const transM = new Set()
      const yearsM = new Set()
      const cars = await fetchApi({ make: makeKey, model: modelKey })
      for (const c of cars) {
        const f = mapFuelType(c.fuel_type)
        if (f) fuelM.add(f)
        const t = mapTransmission(c.transmission)
        if (t) transM.add(t)
        if (typeof c.year === "number" && c.year >= 1990) yearsM.add(c.year)
      }
      byMakeModel[make][model] = {
        fuelTypes: Array.from(fuelM).sort((a, b) => a.localeCompare(b)),
        transmissions: Array.from(transM).sort((a, b) => a.localeCompare(b)),
        years: Array.from(yearsM).sort((a, b) => a - b),
      }
      console.log("ok")
      await sleep(DELAY_MS)
    }
  }

  const out = {
    fetchedAt: new Date().toISOString(),
    makes,
    byMake,
    byMakeModel,
  }

  const outPath = path.join(ROOT, "data", "ninjas-cars-local.json")
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8")
  console.log(`Écrit: ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
