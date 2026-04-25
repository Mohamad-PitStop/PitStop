import { generateText, Output, type LanguageModelUsage } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import type { SystemModelMessage } from "@ai-sdk/provider-utils"
import { NextResponse } from "next/server"
import { z } from "zod"

const cache = new Map<string, { options: string[]; hasMultipleAutoTypes: boolean; cachedAt: number }>()

const TTL = 7 * 24 * 60 * 60 * 1000 // 1 semaine en ms

export const runtime = "nodejs"

const BodySchema = z.object({
  marque: z.string().min(1),
  modele: z.string().optional(),
  variante: z.string().optional(),
  annee: z.string().optional(),
  carburant: z.string().optional(),
})

const OptionsSchema = z.object({
  options: z.array(z.string()),
})

const SYSTEM_TEXT = `Tu es une base de données automobile exhaustive, multi-marchés (France, Europe, Amérique du Nord, autres marchés internationaux).
Tu connais TOUS les véhicules de toutes les générations, passés et présents, y compris les modèles discontinués, les éditions limitées, les variantes spécifiques à un marché et les motorisations rares ou optionnelles.
Règle d'or : ne jamais tronquer une liste. Mieux vaut inclure une option rare ou marginale que d'en omettre une.
Réponds UNIQUEMENT en JSON valide, sans texte autour, sans markdown, sans backticks.`


const systemMessage: SystemModelMessage = {
  role: "system",
  content: SYSTEM_TEXT,
  providerOptions: {
    anthropic: {
      cacheControl: { type: "ephemeral" },
    },
  },
}

function logAnthropicCacheStats(usage: LanguageModelUsage) {
  const data = usage.raw as
    | {
        cache_creation_input_tokens?: number | null
        cache_read_input_tokens?: number | null
        input_tokens?: number | null
      }
    | undefined
  console.log("Cache stats:", {
    cache_creation: data?.cache_creation_input_tokens,
    cache_read: data?.cache_read_input_tokens,
    input_tokens: data?.input_tokens,
  })
}

type InferredStep = "modeles" | "variantes" | "annees" | "carburants" | "transmissions"

/**
 * Post-traitement des transmissions retournées par Claude :
 * - Sépare les options manuelles des automatiques
 * - Toutes les boîtes automatiques sont regroupées en une seule option "Automatique"
 * - Retourne aussi hasMultipleAutoTypes pour permettre au front d'afficher un champ
 *   "Type de boîte automatique" dans les infos complémentaires si plusieurs types existent
 */
function normalizeTransmissions(options: string[]): { normalized: string[]; hasMultipleAutoTypes: boolean } {
  const isManual = (t: string) => /^manuelle/i.test(t.trim())

  const manuals = options.filter(isManual)
  const autos = options.filter((t) => !isManual(t))

  // Dédupliquer les autos (insensible à la casse) pour compter les types distincts
  const uniqueAutos = [...new Map(autos.map((t) => [t.trim().toLowerCase(), t.trim()])).values()]
  const hasMultipleAutoTypes = uniqueAutos.length > 1

  // Normaliser la casse des manuelles (première lettre en majuscule)
  const normalizedManuals = manuals.map((t) => t.charAt(0).toUpperCase() + t.slice(1))
  // Toujours une seule entrée "Automatique" pour l'affichage côté client
  const normalizedAutos = uniqueAutos.length > 0 ? ["Automatique"] : []

  return { normalized: [...normalizedManuals, ...normalizedAutos], hasMultipleAutoTypes }
}

function inferStep(body: z.infer<typeof BodySchema>): InferredStep {
  const modele = body.modele?.trim()
  if (!modele) return "modeles"

  if (!Object.prototype.hasOwnProperty.call(body, "variante")) return "variantes"

  const annee = body.annee?.trim()
  if (!annee) return "annees"

  const carburant = body.carburant?.trim()
  if (!carburant) return "carburants"

  return "transmissions"
}

function buildUserPrompt(body: z.infer<typeof BodySchema>, step: InferredStep): string {
  const m = body.marque.trim()
  const mo = body.modele?.trim() ?? ""
  const v = (body.variante ?? "").trim()
  const a = (body.annee ?? "").trim()
  const c = (body.carburant ?? "").trim()

  switch (step) {
    case "modeles":
      return `Liste ABSOLUMENT TOUS les modèles de ${m}, passé et présent, sans exception, tous marchés confondus (France, Europe, Amérique du Nord, autres). Inclus :
- Toutes les séries numérotées et générations successives (ex pour BMW : Série 1, Série 2, Série 3, Série 4, Série 5, Série 6, Série 7, Série 8)
- Tous les SUV, crossovers et 4x4 (ex pour BMW : X1, X2, X3, X4, X5, X6, X7, XM)
- Toutes les versions sportives / M / AMG / RS / ST / N / GTI / Type R (ex pour BMW : M2, M3, M4, M5, M8)
- Tous les modèles électriques, hybrides, hybrides rechargeables et hydrogène (ex pour BMW : i3, i4, i5, i7, iX, iX1, iX2, iX3)
- Tous les coupés, cabriolets, roadsters, breaks, monospaces, fourgons et utilitaires légers
- Tous les modèles discontinués, anciens, oubliés, ou retirés du marché
- Toutes les éditions limitées et modèles de niche, même rares
- Tous les noms commerciaux différents selon les marchés (ex : Yaris/Vitz, Auris/Corolla, etc.) — liste chaque dénomination utilisée en France/Europe
Ne regroupe pas les modèles, liste chaque modèle séparément (une entrée par dénomination).
Ne tronque JAMAIS la liste sous aucun prétexte. Si tu hésites entre inclure ou exclure, INCLUS.
Réponds avec : { "options": ["modele1", "modele2", ...] }`
    case "variantes":
      return `Pour ${m} ${mo}, liste TOUTES les variantes de carrosserie distinctes ayant existé sur l'ensemble des générations (ex : 3 portes, 5 portes, berline, break, SW, Touring, Avant, Sportback, coupé, cabriolet, roadster, fastback, liftback, monospace, long châssis, etc.).
Inclus toutes les variantes même rares ou propres à une seule génération.
Si ce modèle n'a jamais eu qu'une seule carrosserie, retourne un tableau vide.
Réponds avec : { "options": ["variante1", "variante2", ...] }`
    case "annees":
      return `Pour ${m} ${mo}${v ? ` ${v}` : ""}, liste TOUTES les années de production, de la toute première année de la première génération à la dernière année commercialisée (ou l'année en cours si encore produit).
Couvre TOUTES les générations successives en une plage continue : ne saute aucune année, même celle d'un changement de génération.
Inclus les années de pré-série / restylages / fins de carrière.
Réponds avec : { "options": ["2024", "2023", ...] }`
    case "carburants":
      return `Pour ${m} ${mo}${v ? ` ${v}` : ""} année ${a}, liste TOUS les carburants ayant été commercialisés cette année-là pour ce modèle, sur tous les marchés et tous les niveaux de finition.
Inclus systématiquement (si applicable) : essence, diesel, hybride, hybride rechargeable (PHEV), électrique, GPL, GNV / CNG, E85 / éthanol, hydrogène, micro-hybride / mild hybrid.
Sois EXHAUSTIF : si une motorisation a existé même en option, en série limitée, ou sur un marché spécifique, INCLUS-la.
Ne renvoie jamais une seule option si plusieurs ont coexisté la même année.
Réponds avec : { "options": ["Essence", "Diesel", ...] }`
    case "transmissions":
      return `Pour ${m} ${mo}${v ? ` ${v}` : ""} année ${a} en ${c}, liste TOUTES les transmissions qui ont existé pour cette configuration, sur tous les marchés et toutes les finitions (ex : manuelle 5 vitesses, manuelle 6 vitesses, automatique classique, DCT, DSG, TCT, EDC, PDK, S tronic, ZF 8HP, robotisée, CVT, e-CVT, mono-rapport pour électriques, etc.).
Inclus systématiquement chaque type ayant été disponible, même en option, sur un seul niveau de finition, ou sur un marché spécifique.
Ne renvoie jamais une seule option si plusieurs ont coexisté.
Réponds avec : { "options": ["Manuelle 6 vitesses", "Automatique DSG 7 rapports", ...] }`
    default:
      return ""
  }
}

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>
  try {
    body = BodySchema.parse(await req.json())
  } catch {
    return Response.json({ options: [] as string[], error: true })
  }

  /** Inclut l’étape pour éviter la collision : { marque, modele } (variantes) vs { marque, modele, variante: "" } (années). */
  const step = inferStep(body)
  const cacheKey = [
    step,
    body.marque.trim(),
    body.modele?.trim() ?? "",
    body.variante?.trim() ?? "",
    body.annee?.trim() ?? "",
    body.carburant?.trim() ?? "",
  ]
    .join("|")
    .toLowerCase()

  const entry = cache.get(cacheKey)
  if (entry && Date.now() - entry.cachedAt < TTL) {
    return NextResponse.json({ options: entry.options, hasMultipleAutoTypes: entry.hasMultipleAutoTypes })
  }

  try {
    const prompt = buildUserPrompt(body, step)

    const { output, usage } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: [systemMessage],
      prompt,
      output: Output.object({ schema: OptionsSchema }),
    })
    logAnthropicCacheStats(usage)

    const rawOptions = output?.options ?? []
    let options: string[]
    let hasMultipleAutoTypes = false
    if (step === "transmissions") {
      const result = normalizeTransmissions(rawOptions)
      options = result.normalized
      hasMultipleAutoTypes = result.hasMultipleAutoTypes
    } else {
      options = rawOptions
    }
    cache.set(cacheKey, { options, hasMultipleAutoTypes, cachedAt: Date.now() })
    return Response.json({ options, hasMultipleAutoTypes })
  } catch (error) {
    console.error("vehicle-options API error:", error)
    return Response.json({ options: [] as string[], hasMultipleAutoTypes: false, error: true })
  }
}
