import rawCatalog from "@/data/vehicle-compatibility-catalog.json"

type FuelTypesByBrandModel = Record<string, Record<string, string[]>>
type TransmissionByBrandModel = Record<string, Record<string, string[]>>
/** model + carburant -> transmissions (prioritaire sur transmissionByModel) */
type TransmissionByModelFuel = Record<string, Record<string, Record<string, string[]>>>
type CompatibilityCatalog = {
  fuelTypes: FuelTypesByBrandModel
  transmissionTypes: string[]
  transmissionByModel: TransmissionByBrandModel
  transmissionByModelFuel?: TransmissionByModelFuel
}

function assertStringArray(value: unknown, ctx: string): asserts value is string[] {
  if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
    throw new Error(`${ctx} doit être string[]`)
  }
}

function validateCatalog(input: unknown): CompatibilityCatalog {
  if (!input || typeof input !== "object") throw new Error("vehicle-compatibility-catalog invalide")
  const obj = input as Record<string, unknown>

  if (!obj.fuelTypes || typeof obj.fuelTypes !== "object") throw new Error("fuelTypes manquant")
  if (!obj.transmissionByModel || typeof obj.transmissionByModel !== "object") throw new Error("transmissionByModel manquant")
  assertStringArray(obj.transmissionTypes, "transmissionTypes")

  const fuelTypes: FuelTypesByBrandModel = {}
  for (const [brand, modelsRaw] of Object.entries(obj.fuelTypes as Record<string, unknown>)) {
    if (!modelsRaw || typeof modelsRaw !== "object") continue
    const models: Record<string, string[]> = {}
    for (const [model, fuelsRaw] of Object.entries(modelsRaw as Record<string, unknown>)) {
      assertStringArray(fuelsRaw, `fuelTypes.${brand}.${model}`)
      models[model] = fuelsRaw
    }
    fuelTypes[brand] = models
  }

  const transmissionByModel: TransmissionByBrandModel = {}
  for (const [brand, modelsRaw] of Object.entries(obj.transmissionByModel as Record<string, unknown>)) {
    if (!modelsRaw || typeof modelsRaw !== "object") continue
    const models: Record<string, string[]> = {}
    for (const [model, transRaw] of Object.entries(modelsRaw as Record<string, unknown>)) {
      assertStringArray(transRaw, `transmissionByModel.${brand}.${model}`)
      models[model] = transRaw
    }
    transmissionByModel[brand] = models
  }

  let transmissionByModelFuel: TransmissionByModelFuel | undefined
  if (obj.transmissionByModelFuel && typeof obj.transmissionByModelFuel === "object") {
    transmissionByModelFuel = {}
    for (const [brand, modelsRaw] of Object.entries(obj.transmissionByModelFuel as Record<string, unknown>)) {
      if (!modelsRaw || typeof modelsRaw !== "object") continue
      const models: Record<string, Record<string, string[]>> = {}
      for (const [model, fuelsRaw] of Object.entries(modelsRaw as Record<string, unknown>)) {
        if (!fuelsRaw || typeof fuelsRaw !== "object") continue
        const fuels: Record<string, string[]> = {}
        for (const [fuel, transRaw] of Object.entries(fuelsRaw as Record<string, unknown>)) {
          assertStringArray(transRaw, `transmissionByModelFuel.${brand}.${model}.${fuel}`)
          fuels[fuel] = transRaw
        }
        models[model] = fuels
      }
      transmissionByModelFuel[brand] = models
    }
  }

  return {
    fuelTypes,
    transmissionTypes: obj.transmissionTypes,
    transmissionByModel,
    transmissionByModelFuel,
  }
}

const catalog = validateCatalog(rawCatalog)

export function getAvailableFuelTypesForSelection(marque: string, modele: string): string[] {
  if (!marque) return []
  const brandFuels = catalog.fuelTypes[marque]
  if (brandFuels) {
    if (modele && brandFuels[modele]) return brandFuels[modele]
    if (brandFuels._default) return brandFuels._default
  }
  return catalog.fuelTypes._default?._default ?? ["Essence", "Diesel", "Hybride", "Hybride rechargeable"]
}

export function getAvailableTransmissionTypesForSelection(
  marque: string,
  modele: string,
  carburant: string
): string[] {
  // Priorité: modèle + carburant -> transmissions (transmissionByModelFuel)
  const byModelFuel = catalog.transmissionByModelFuel?.[marque]?.[modele]?.[carburant]
  if (byModelFuel && byModelFuel.length > 0) {
    return byModelFuel
  }

  // Sinon: par modèle (transmissionByModel)
  let options = catalog.transmissionTypes
  if (marque) {
    const brandTrans = catalog.transmissionByModel[marque]
    if (brandTrans) {
      if (modele && brandTrans[modele]) options = brandTrans[modele]
      else if (brandTrans._default) options = brandTrans._default
    }
  }

  // Règle globale: Électrique/Hydrogène -> pas de manuelle.
  if (carburant === "Électrique" || carburant === "Hydrogène") {
    return options.filter((t) => t !== "Manuelle")
  }
  return options
}

