/**
 * Libellés typiquement anglais (doublons ou variantes) à exclure pour ne garder que le français.
 */
function isLikelyEnglishModelLabel(s: string): boolean {
  const t = s.trim()
  if (!t) return true

  // BMW / Mini : "1 Series", "2 Series Active Tourer", "X Series" marketing
  if (/\b\d+\s+Series\b/i.test(t)) return true
  if (/\bSeries\s+(Active|Gran)/i.test(t)) return true

  // Mercedes : A-Class, CLA-Class, G-Class
  if (/-Class\b/i.test(t)) return true

  // Finitions / carrosseries anglaises
  if (/\bSedan\b/i.test(t)) return true
  if (/\bWagon\b/i.test(t)) return true
  if (/\bHatchback\b/i.test(t)) return true
  if (/\bConvertible\b/i.test(t)) return true
  if (/\bEstate\b/i.test(t)) return true
  if (/\bLiftback\b/i.test(t)) return true
  if (/\bCrossover\b/i.test(t)) return true

  // "Coupe" sans accent (anglais) — "Coupé" / "Gran Coupé" restent
  if (/\bCoupe\b/i.test(t) && !/Coupé/i.test(t)) return true

  return false
}

/** Ne conserve que les libellés jugés français (ou neutres : codes alphanumériques). */
export function filterFrenchModelLabels(models: string[]): string[] {
  return models.filter((m) => !isLikelyEnglishModelLabel(m))
}

const keyNorm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()

/**
 * Unifie tirets / points pour que « DS3 », « DS 3 », « DS-3 », « ID.3 » se regroupent.
 * Ne casse pas les décimales type « 1.4 » (chiffre.d.chiffre).
 */
function normalizeSeparatorsForDedupe(s: string): string {
  let t = s
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, "-")
    .replace(/-/g, " ")
  // « ID.3 », « e.208 » : lettre + point + chiffres
  t = t.replace(/([A-Za-zÀ-ÿ])\.(\d+)/g, "$1 $2")
  // « ID.Buzz »
  t = t.replace(/([A-Za-zÀ-ÿ])\.([A-Za-zÀ-ÿ])/g, "$1 $2")
  return t.replace(/\s+/g, " ").trim()
}

/**
 * Suffixes de carrosserie / variante à retirer pour regrouper (le détail va dans « Variante / finition »).
 * Ordre : plus long d’abord pour « Gran Tourer » avant « Tourer », etc.
 */
const VARIANT_MODEL_SUFFIXES: RegExp[] = [
  /\s+Shooting\s+Brake$/i,
  /\s+Active\s+Tourer$/i,
  /\s+Gran\s+Tourer$/i,
  /\s+Gran\s+Coupe$/i,
  /\s+Gran\s+Coupé$/i,
  /\s+Gran\s+Turismo$/i,
  /\s+e-tron\s+Sportback$/i,
  /\s+Sportback$/i,
  /\s+Allroad$/i,
  /\s+Offroad$/i,
  /\s+\d+\s+portes$/i,
  /\s+(Berline|Break|Touring|Avant|Limousine|Cabriolet|Spider|Roadster|Cabrio|Monospace|Combi|Van|Fastback|Liftback|Estate|Wagon|Hatchback|Sedan|Convertible|Crossback|Picasso|SpaceTourer|Longue|SW|CC|SUV)$/i,
  /\s+Coupé$/i,
  /\s+Coupe$/i,
  /\s+Tourer$/i,
  /\s+xDrive$/i,
  /\s+4MATIC$/i,
  /\s+Quattro$/i,
  /\s+Electric$/i,
  /\s+Électrique$/i,
  /\s+Hybrid$/i,
  /\s+Hybride$/i,
  /\s+Plug[-\s]?in$/i,
  /\s+PHEV$/i,
  /\s+XL$/i,
  /\s+LWB$/i,
]

function stripVariantSuffixesOnce(name: string): string {
  let s = name.trim()
  for (const re of VARIANT_MODEL_SUFFIXES) {
    const next = s.replace(re, "").trim()
    if (next !== s) return next
  }
  return s
}

/**
 * Clé de regroupement : modèle sans les segments variante/carrosserie en fin de libellé,
 * puis normalisation (accents, casse) et suppression des espaces pour fusionner
 * « DS 3 » / « DS3 », « XC 60 » / « XC60 », etc.
 */
export function modelBaseKeyForDedupe(name: string): string {
  let s = normalizeSeparatorsForDedupe(name.trim())
  let prev = ""
  while (s !== prev && s.length > 0) {
    prev = s
    const next = stripVariantSuffixesOnce(s)
    if (next === s) break
    s = next
  }
  return keyNorm(s).replace(/\s/g, "")
}

/**
 * Une entrée par « famille » de modèle : si plusieurs libellés ne diffèrent que par la variante en fin de chaîne,
 * on ne garde que le plus court (ex. « Mini » plutôt que « Mini 5 portes »).
 */
export function dedupeModelsByVariantBase(models: string[]): string[] {
  const groups = new Map<string, string[]>()
  for (const m of models) {
    const t = m.trim()
    if (!t) continue
    const k = modelBaseKeyForDedupe(t)
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(t)
  }
  const out: string[] = []
  for (const labels of groups.values()) {
    labels.sort((a, b) => a.length - b.length || a.localeCompare(b, "fr"))
    out.push(labels[0])
  }
  return out.sort((a, b) => a.localeCompare(b, "fr"))
}

/**
 * Fusionne le catalogue local et la liste renvoyée par /api/vehicle-options.
 * L'intersection stricte supprimait des modèles présents au catalogue (ex. Série 1…8 BMW)
 * dès que le LLM ne les renvoyait pas avec la même chaîne exacte ou les omettait.
 */
export function mergeVerifiedModelLists(base: string[], verified: string[]): string[] {
  /** Même logique que modelBaseKeyForDedupe pour éviter catalogue + API en double. */
  const mergeKey = (s: string) => modelBaseKeyForDedupe(s)

  const byMergeKey = new Map<string, string>()

  const preferLabel = (existing: string, incoming: string): string => {
    const ex = existing.trim()
    const inc = incoming.trim()
    if (inc.length < ex.length) return inc
    if (inc.length > ex.length) return ex
    return ex.localeCompare(inc, "fr") <= 0 ? ex : inc
  }

  for (const m of base) {
    const t = m.trim()
    if (!t) continue
    const k = mergeKey(t)
    const prev = byMergeKey.get(k)
    byMergeKey.set(k, prev ? preferLabel(prev, t) : t)
  }
  for (const v of verified) {
    const t = v.trim()
    if (!t) continue
    const k = mergeKey(t)
    const prev = byMergeKey.get(k)
    byMergeKey.set(k, prev ? preferLabel(prev, t) : t)
  }
  return [...byMergeKey.values()].sort((a, b) => a.localeCompare(b, "fr"))
}
