import fs from "node:fs"
import path from "node:path"

const filePath = path.join(process.cwd(), "data", "vehicle-compatibility-catalog.json")
const raw = fs.readFileSync(filePath, "utf8")
const data = JSON.parse(raw)

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function isStringArray(v) {
  return Array.isArray(v) && v.every((x) => typeof x === "string")
}

assert(data && typeof data === "object", "Catalog root must be an object")
assert(data.fuelTypes && typeof data.fuelTypes === "object", "Missing fuelTypes")
assert(data.transmissionByModel && typeof data.transmissionByModel === "object", "Missing transmissionByModel")
assert(isStringArray(data.transmissionTypes), "transmissionTypes must be string[]")

for (const [brand, models] of Object.entries(data.fuelTypes)) {
  assert(models && typeof models === "object", `fuelTypes.${brand} must be an object`)
  for (const [model, fuels] of Object.entries(models)) {
    assert(isStringArray(fuels), `fuelTypes.${brand}.${model} must be string[]`)
  }
}

for (const [brand, models] of Object.entries(data.transmissionByModel)) {
  assert(models && typeof models === "object", `transmissionByModel.${brand} must be an object`)
  for (const [model, transmissions] of Object.entries(models)) {
    assert(isStringArray(transmissions), `transmissionByModel.${brand}.${model} must be string[]`)
  }
}

if (data.transmissionByModelFuel) {
  assert(typeof data.transmissionByModelFuel === "object", "transmissionByModelFuel must be an object")
  for (const [brand, models] of Object.entries(data.transmissionByModelFuel)) {
    assert(models && typeof models === "object", `transmissionByModelFuel.${brand} must be an object`)
    for (const [model, fuels] of Object.entries(models)) {
      assert(fuels && typeof fuels === "object", `transmissionByModelFuel.${brand}.${model} must be an object`)
      for (const [fuel, transmissions] of Object.entries(fuels)) {
        assert(isStringArray(transmissions), `transmissionByModelFuel.${brand}.${model}.${fuel} must be string[]`)
      }
    }
  }
}

console.log("vehicle-compatibility-catalog.json is valid")
