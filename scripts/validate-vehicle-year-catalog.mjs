import fs from "node:fs"
import path from "node:path"

const filePath = path.join(process.cwd(), "data", "vehicle-year-catalog.json")
const modelsFilePath = path.join(process.cwd(), "lib", "vehicle-model-catalog.ts")
const raw = fs.readFileSync(filePath, "utf8")
const data = JSON.parse(raw)
const modelsRaw = fs.readFileSync(modelsFilePath, "utf8")

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function isStringArray(v) {
  return Array.isArray(v) && v.every((x) => typeof x === "string")
}

function validateRange(range, ctx) {
  assert(Array.isArray(range) && range.length === 2, `${ctx}: range must be [start, end]`)
  const [start, end] = range
  assert(Number.isInteger(start) && Number.isInteger(end), `${ctx}: start/end must be integers`)
  assert(start >= 1900, `${ctx}: start year too low`)
  assert(end >= start, `${ctx}: end must be >= start`)
}

function extractCarModels(source) {
  const match = source.match(/export const carModels: Record<string, string\[]> = (\{[\s\S]*?\n\})\n\nexport const carBrands/)
  assert(match && match[1], "Impossible d'extraire carModels depuis vehicle-model-catalog.ts")
  return Function(`return (${match[1]})`)()
}

assert(data && typeof data === "object", "Catalog root must be an object")
assert(data.yearRangesByBrandModel && typeof data.yearRangesByBrandModel === "object", "Missing yearRangesByBrandModel")
assert(data.yearRulesByBrandModel && typeof data.yearRulesByBrandModel === "object", "Missing yearRulesByBrandModel")

for (const [brand, models] of Object.entries(data.yearRangesByBrandModel)) {
  assert(models && typeof models === "object", `Ranges for ${brand} must be an object`)
  for (const [model, range] of Object.entries(models)) {
    validateRange(range, `range ${brand}/${model}`)
  }
}

for (const [brand, models] of Object.entries(data.yearRulesByBrandModel)) {
  assert(models && typeof models === "object", `Rules for ${brand} must be an object`)
  for (const [model, rules] of Object.entries(models)) {
    assert(Array.isArray(rules), `Rules for ${brand}/${model} must be an array`)
    rules.forEach((rule, idx) => {
      const ctx = `rule ${brand}/${model}#${idx}`
      assert(rule && typeof rule === "object", `${ctx}: must be object`)
      validateRange(rule.range, ctx)
      if (rule.carburant !== undefined) assert(isStringArray(rule.carburant), `${ctx}: carburant must be string[]`)
      if (rule.transmission !== undefined) assert(isStringArray(rule.transmission), `${ctx}: transmission must be string[]`)
    })
  }
}

// Cohérence globale: tous les modèles listés sur le site doivent avoir une couverture dédiée
// (plage explicite ou règles), pas uniquement un _default de marque.
const carModels = extractCarModels(modelsRaw)
const missingCoverage = []
for (const [brand, models] of Object.entries(carModels)) {
  for (const model of models) {
    const hasRange = Array.isArray(data.yearRangesByBrandModel?.[brand]?.[model])
    const hasRules = Array.isArray(data.yearRulesByBrandModel?.[brand]?.[model]) && data.yearRulesByBrandModel[brand][model].length > 0
    if (!hasRange && !hasRules) {
      missingCoverage.push(`${brand} / ${model}`)
    }
  }
}

if (missingCoverage.length > 0) {
  console.warn(
    `Attention: couverture années modèle spécifique manquante pour ${missingCoverage.length} modèle(s).\n` +
      `${missingCoverage.slice(0, 120).join("\n")}` +
      (missingCoverage.length > 120 ? "\n..." : "")
  )
}

console.log("vehicle-year-catalog.json is valid")
