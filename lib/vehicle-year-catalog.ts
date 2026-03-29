import rawCatalog from "@/data/vehicle-year-catalog.json"
import { carModels } from "@/lib/vehicle-model-catalog"

type YearRange = [number, number]
type YearRule = {
  range: YearRange
  carburant?: string[]
  transmission?: string[]
}
type YearCatalog = {
  yearRangesByBrandModel: Record<string, Record<string, YearRange>>
  yearRulesByBrandModel: Record<string, Record<string, YearRule[]>>
}

const CURRENT_YEAR = new Date().getFullYear()
const MODEL_YEAR_OVERRIDES: Record<string, Record<string, YearRange>> = {
  Dodge: {
    Challenger: [2008, CURRENT_YEAR],
    Charger: [2006, CURRENT_YEAR],
    Durango: [1998, CURRENT_YEAR],
    "Ram 1500": [1994, CURRENT_YEAR],
  },
}

function normalizeRange(input: unknown): YearRange {
  if (!Array.isArray(input) || input.length !== 2) throw new Error("Year range invalide")
  const start = Number(input[0])
  const endRaw = Number(input[1])
  if (!Number.isFinite(start) || !Number.isFinite(endRaw)) throw new Error("Year range non numérique")
  const end = Math.min(Math.trunc(endRaw), CURRENT_YEAR)
  return [Math.trunc(start), Math.max(Math.trunc(start), end)]
}

function validateCatalog(input: unknown): YearCatalog {
  if (!input || typeof input !== "object") throw new Error("Catalog JSON invalide")
  const obj = input as Record<string, unknown>
  const rangesRaw = obj.yearRangesByBrandModel
  const rulesRaw = obj.yearRulesByBrandModel
  if (!rangesRaw || typeof rangesRaw !== "object") throw new Error("yearRangesByBrandModel manquant")
  if (!rulesRaw || typeof rulesRaw !== "object") throw new Error("yearRulesByBrandModel manquant")

  const yearRangesByBrandModel: Record<string, Record<string, YearRange>> = {}
  for (const [brand, modelsRaw] of Object.entries(rangesRaw as Record<string, unknown>)) {
    if (!modelsRaw || typeof modelsRaw !== "object") continue
    const models: Record<string, YearRange> = {}
    for (const [model, rangeRaw] of Object.entries(modelsRaw as Record<string, unknown>)) {
      models[model] = normalizeRange(rangeRaw)
    }
    yearRangesByBrandModel[brand] = models
  }

  const yearRulesByBrandModel: Record<string, Record<string, YearRule[]>> = {}
  for (const [brand, modelsRaw] of Object.entries(rulesRaw as Record<string, unknown>)) {
    if (!modelsRaw || typeof modelsRaw !== "object") continue
    const models: Record<string, YearRule[]> = {}
    for (const [model, listRaw] of Object.entries(modelsRaw as Record<string, unknown>)) {
      if (!Array.isArray(listRaw)) continue
      const rules: YearRule[] = []
      for (const ruleRaw of listRaw) {
        if (!ruleRaw || typeof ruleRaw !== "object") continue
        const ruleObj = ruleRaw as Record<string, unknown>
        const carburant = Array.isArray(ruleObj.carburant) ? ruleObj.carburant.map(String) : undefined
        const transmission = Array.isArray(ruleObj.transmission) ? ruleObj.transmission.map(String) : undefined
        rules.push({ range: normalizeRange(ruleObj.range), carburant, transmission })
      }
      models[model] = rules
    }
    yearRulesByBrandModel[brand] = models
  }

  return { yearRangesByBrandModel, yearRulesByBrandModel }
}

const { yearRangesByBrandModel, yearRulesByBrandModel } = validateCatalog(rawCatalog)

function computeCoverageIssues() {
  const issues: string[] = []
  for (const [brand, models] of Object.entries(carModels)) {
    const rangesForBrand = yearRangesByBrandModel[brand] ?? {}
    const rulesForBrand = yearRulesByBrandModel[brand] ?? {}

    for (const model of models) {
      const hasExplicitRange = Array.isArray(rangesForBrand[model])
      const hasRules = Array.isArray(rulesForBrand[model]) && rulesForBrand[model].length > 0
      if (!hasExplicitRange && !hasRules) {
        issues.push(`${brand} / ${model}`)
      }
    }
  }
  return issues
}

const coverageIssues = computeCoverageIssues()
if (process.env.NODE_ENV !== "production" && coverageIssues.length > 0) {
  const preview = coverageIssues.slice(0, 25).join(", ")
  console.warn(
    `[catalog] ${coverageIssues.length} modèle(s) sans plage d'années dédiée. Exemples: ${preview}${coverageIssues.length > 25 ? ", ..." : ""}`
  )
}

function buildYearOptions([startRaw, endRaw]: YearRange): string[] {
  const end = Math.min(endRaw, CURRENT_YEAR)
  const start = Math.max(1980, Math.min(startRaw, end))
  const years: string[] = []
  for (let y = end; y >= start; y -= 1) years.push(String(y))
  return years
}

function matchRuleValue(selected: string, allowed?: string[]) {
  if (!allowed || allowed.length === 0) return true
  if (!selected) return true
  return allowed.includes(selected)
}

export function getAvailableYearsForModel(
  marque: string,
  modele: string,
  carburant: string,
  transmission: string
): string[] {
  if (!marque || !modele) return []
  const overrideRange = MODEL_YEAR_OVERRIDES[marque]?.[modele]
  const brandCatalog = yearRangesByBrandModel[marque]
  const modelRange = brandCatalog?.[modele]
  const brandDefaultRange = brandCatalog?._default ?? [1990, CURRENT_YEAR]
  const defaultRange = overrideRange ?? modelRange ?? brandDefaultRange

  // Quand carburant et transmission ne sont pas encore choisis (année avant carburant/transmission),
  // on retourne la plage par défaut du modèle.
  if (!carburant && !transmission) {
    if (overrideRange) return buildYearOptions(overrideRange)
    if (modelRange) return buildYearOptions(modelRange)

    // Si des règles existent pour ce modèle, on prend leur enveloppe en priorité.
    const modelRules = yearRulesByBrandModel[marque]?.[modele] ?? []
    if (modelRules.length > 0) {
      const starts = modelRules.map((r) => r.range[0])
      const ends = modelRules.map((r) => r.range[1])
      const minStart = Math.min(...starts)
      const maxEnd = Math.max(...ends)
      return buildYearOptions([minStart, maxEnd])
    }
    return buildYearOptions(brandDefaultRange)
  }

  const rules = yearRulesByBrandModel[marque]?.[modele]
  if (rules && rules.length > 0) {
    for (const rule of rules) {
      const fuelOk = matchRuleValue(carburant, rule.carburant)
      const transOk = matchRuleValue(transmission, rule.transmission)
      if (fuelOk && transOk) return buildYearOptions(rule.range)
    }
  }

  if (defaultRange) return buildYearOptions(defaultRange)

  // Si pas de règle correspondante mais qu'on a des règles modèle, retourner leur enveloppe.
  if (rules && rules.length > 0) {
    const starts = rules.map((r) => r.range[0])
    const ends = rules.map((r) => r.range[1])
    return buildYearOptions([Math.min(...starts), Math.max(...ends)])
  }
  return buildYearOptions(brandDefaultRange)
}
