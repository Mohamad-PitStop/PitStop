/**
 * Lecture de la base véhicules stockée en local (data/ninjas-cars-local.json).
 * Le site n’utilise plus l’API Ninjas — tout est servi depuis ce fichier.
 */

import fs from "node:fs"
import path from "node:path"

export type NinjasLocalByMake = {
  models: string[]
  fuelTypes: string[]
  transmissions: string[]
  years: number[]
}

export type NinjasLocalModelDetails = {
  fuelTypes: string[]
  transmissions: string[]
  years: number[]
}

export type NinjasLocalData = {
  fetchedAt: string
  makes: string[]
  byMake: Record<string, NinjasLocalByMake>
  byMakeModel?: Record<string, Record<string, NinjasLocalModelDetails>>
}

let cached: NinjasLocalData | null = null

function load(): NinjasLocalData | null {
  if (cached) return cached
  try {
    const filePath = path.join(process.cwd(), "data", "ninjas-cars-local.json")
    const raw = fs.readFileSync(filePath, "utf8")
    const data = JSON.parse(raw) as NinjasLocalData
    if (data && Array.isArray(data.makes) && data.byMake && typeof data.byMake === "object") {
      cached = data
      return cached
    }
  } catch {
    // fichier absent ou invalide
  }
  return null
}

export function getLocalMakes(): string[] | null {
  const data = load()
  return data ? data.makes : null
}

function findMakeKey(byMake: Record<string, NinjasLocalByMake>, make: string): string | null {
  const key = make.trim()
  if (byMake[key]) return key
  const lower = key.toLowerCase()
  const found = Object.keys(byMake).find((k) => k.toLowerCase() === lower)
  return found ?? null
}

export function getLocalModels(make: string): string[] | null {
  const data = load()
  if (!data?.byMake) return null
  const key = findMakeKey(data.byMake, make)
  const entry = key ? data.byMake[key] : null
  return entry?.models ?? null
}

function findModelKey(models: string[], model: string): string | null {
  const key = model.trim()
  if (!key) return null
  const lower = key.toLowerCase()
  const found = models.find((m) => m.toLowerCase() === lower)
  return found ?? null
}

/** Détails pour un make+model (carburant, transmission, années). Préfère byMakeModel si présent. */
export function getLocalDetails(make: string, model: string): NinjasLocalByMake | NinjasLocalModelDetails | null {
  const data = load()
  if (!data?.byMake) return null
  const makeKey = findMakeKey(data.byMake, make)
  if (!makeKey) return null
  const makeEntry = data.byMake[makeKey]
  if (data.byMakeModel?.[makeKey] && model.trim()) {
    const modelKey = findModelKey(makeEntry.models, model)
    if (modelKey && data.byMakeModel[makeKey][modelKey])
      return data.byMakeModel[makeKey][modelKey]
  }
  return makeEntry
}

export function hasLocalData(): boolean {
  return load() !== null
}
