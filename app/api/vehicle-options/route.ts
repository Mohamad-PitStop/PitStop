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

const SYSTEM_TEXT = `Tu es une base de données automobile experte couvrant tous les véhicules vendus en Europe.
Réponds UNIQUEMENT en JSON valide, sans texte autour, sans markdown, sans backticks.`

const ANTHROPIC_PROMPT_CACHE_HEADERS = {
  "anthropic-beta": "prompt-caching-2024-07-31",
} as const

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
      return `Liste ABSOLUMENT TOUS les modèles de ${m} vendus en Europe, passé et présent, sans exception. Inclus :
- Toutes les séries numérotées (ex pour BMW : Série 1, Série 2, Série 3, Série 4, Série 5, Série 6, Série 7, Série 8)
- Tous les SUV et crossovers (ex pour BMW : X1, X2, X3, X4, X5, X6, X7, XM)
- Toutes les versions M (ex pour BMW : M2, M3, M4, M5, M8)
- Tous les modèles électriques et hybrides (ex pour BMW : i3, i4, i5, i7, iX, iX1, iX3)
- Tous les modèles Z et Gran (ex pour BMW : Z3, Z4, Gran Turismo, Gran Coupé)
- Tous les modèles discontinués
- Tous les modèles de niche et éditions limitées vendus en Europe
Ne regroupe pas les modèles, liste chaque modèle séparément.
Ne tronque pas la liste sous aucun prétexte.
Réponds avec : { "options": ["modele1", "modele2", ...] }`
    case "variantes":
      return `Pour ${m} ${mo} vendu en Europe, liste toutes les variantes distinctes (ex: 3 portes, 5 portes, break, coupé, cabriolet, etc.).
Si ce modèle n'a pas de variantes distinctes, retourne un tableau vide.
Réponds avec : { "options": ["variante1", "variante2", ...] }`
    case "annees":
      return `Pour ${m} ${mo}${v ? ` ${v}` : ""} vendu en Europe, liste toutes les années de production disponibles.
Réponds avec : { "options": ["2015", "2016", ...] }`
    case "carburants":
      return `Pour ${m} ${mo}${v ? ` ${v}` : ""} ${a} vendu en Europe, liste les carburants disponibles pour cette configuration exacte (ex: essence, diesel, hybride, électrique, GPL, etc.).
Réponds avec : { "options": ["essence", "diesel", ...] }`
    case "transmissions":
      return `Pour ${m} ${mo}${v ? ` ${v}` : ""} ${a} ${c} vendu en Europe, liste TOUTES les transmissions qui ont existé pour cette configuration, en incluant toutes les boîtes commercialisées selon les marchés européens (ex: manuelle 5 ou 6 vitesses, automatique, DCT, DSG, TCT, EDC, PDK, robotisée, CVT, etc.).
Sois exhaustif — ne retourne jamais une seule option si plusieurs ont existé, même si l'une d'elles était minoritaire ou optionnelle.
Réponds avec : { "options": ["manuelle", "automatique"] }`
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
      model: anthropic("claude-sonnet-4-20250514"),
      headers: ANTHROPIC_PROMPT_CACHE_HEADERS,
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
