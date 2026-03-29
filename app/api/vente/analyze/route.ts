import { generateText, type LanguageModelUsage } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import type { SystemModelMessage } from "@ai-sdk/provider-utils"
import { fetchAutoScout24MarketSnapshot } from "@/lib/autoscout24-market"
import { VENTE_TAB_ENABLED } from "@/lib/feature-flags"

const ANTHROPIC_PROMPT_CACHE_HEADERS = {
  "anthropic-beta": "prompt-caching-2024-07-31",
} as const

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

export const runtime = "nodejs"

type Body = {
  marque: string
  modele: string
  variante?: string
  carburant: string
  transmission: string
  annee: string
  kilometrage: string
  etat: string
  entretien: string
  proprietaires: string
  prixNeuf?: string
  demarre?: boolean
  accidente: boolean
  controleTechnique: boolean
  description: string
  cylindree?: string
  puissance?: string
  nombrePortes?: string
  typeCarrosserie?: string
  photos?: string[] // base64
  estimate?: { low: number; mid: number; high: number }
}

export async function POST(req: Request) {
  try {
    if (!VENTE_TAB_ENABLED) {
      return Response.json(
        {
          error:
            "L'estimation de reprise n'est pas disponible pour le moment. Cette fonctionnalité sera prochainement accessible.",
        },
        { status: 503 }
      )
    }

    const body = (await req.json()) as Body
    const {
      marque,
      modele,
      variante,
      carburant,
      transmission,
      annee,
      kilometrage,
      etat,
      entretien,
      proprietaires,
      prixNeuf,
      demarre,
      accidente,
      controleTechnique,
      description,
      cylindree,
      puissance,
      nombrePortes,
      typeCarrosserie,
      photos,
      estimate,
    } = body

    const extraParts = [
      cylindree?.trim() && `Cylindrée: ${cylindree.trim()}`,
      puissance?.trim() && `Puissance: ${puissance.trim()}`,
      nombrePortes?.trim() && `Nombre de portes: ${nombrePortes.trim()}`,
      typeCarrosserie?.trim() && `Type carrosserie: ${typeCarrosserie.trim()}`,
    ].filter(Boolean)

    const vehicleSummary = [
      `Marque: ${marque}, Modèle: ${modele}`,
      variante ? `Variante: ${variante}` : null,
      `Carburant: ${carburant}, Transmission: ${transmission}`,
      `Année: ${annee}, Kilométrage: ${kilometrage} km`,
      extraParts.length ? `Infos complémentaires: ${extraParts.join(", ")}` : null,
      `État général: ${etat}, Historique entretien: ${entretien}`,
      `Nombre de propriétaires: ${proprietaires}`,
      prixNeuf ? `Prix neuf (indiqué): ${prixNeuf} €` : null,
      typeof demarre === "boolean"
        ? `Le véhicule démarre: ${demarre ? "Oui" : "Non"}`
        : null,
      accidente ? "Le véhicule est (ou a été) accidenté." : null,
      controleTechnique ? "Contrôle technique récent OK." : null,
      photos?.length
        ? `Le client a joint ${photos.length} photo(s) du véhicule.`
        : null,
    ]
      .filter(Boolean)
      .join("\n")

    const estimateLine =
      estimate != null
        ? `\nLe client a reçu une fourchette de prix de rachat (garage partenaire): ${estimate.low} € - ${estimate.mid} € (conseillé) - ${estimate.high} €.`
        : ""

    const autoscoutSnapshot = await fetchAutoScout24MarketSnapshot({
      marque,
      modele,
      variante,
      annee,
      kilometrage,
      carburant,
      transmission,
    }).catch(() => null)

    const marketLine = autoscoutSnapshot
      ? `\nDonnées marché ${autoscoutSnapshot.source} (Belgique) pour "${autoscoutSnapshot.query}" : échantillon=${autoscoutSnapshot.sampleSize}, bas=${autoscoutSnapshot.marketLow} €, médian=${autoscoutSnapshot.marketMedian} €, haut=${autoscoutSnapshot.marketHigh} €.\nURL de recherche: ${autoscoutSnapshot.searchUrl}`
      : "\nDonnées marché AutoScout24 indisponibles pour cette requête (aucun comparable exploitable récupéré). Dans ce cas, reste prudent et conservateur sur l'ordre de grandeur."

    const comparablesLine =
      autoscoutSnapshot && autoscoutSnapshot.listings.length > 0
        ? `\nComparables AutoScout24 (extraits):\n${autoscoutSnapshot.listings
            .slice(0, 6)
            .map(
              (item, idx) =>
                `${idx + 1}) ${item.title} | ${item.priceEur} €${item.url ? ` | ${item.url}` : ""}`
            )
            .join("\n")}`
        : "\nComparables AutoScout24 détaillés: non disponibles."

    const systemText = `Tu es PitStop, garagiste avec 25 ans d'expérience et qualifié pour la vente et le rachat de voitures d'occasion. L'onglet Vente sert à la vente des véhicules aux garages partenaires: le client vend sa voiture à un marchand (garage partenaire). Le garage doit dégager sa marge en plus du prix de rachat, donc le prix proposé au client est un prix de rachat, nécessairement inférieur au prix du marché (vente entre particuliers).

RÈGLE PRIX (TRÈS IMPORTANTE): Aligne-toi sur les prix du marché AutoScout24 Belgique (AutoScout24.be) pour un véhicule comparable (marque, modèle, année, kilométrage, état). Le prix de rachat par un garage partenaire doit être en dessous de ce marché (le garage doit revendre avec une marge). Exemple: une Giulietta en état correct vaut environ 6000-7000 € sur le marché; un prix de rachat garage sera en dessous (ex. 5000-6000 €). Ne propose jamais des ordres de grandeur supérieurs au marché AutoScout24.

DISCOURS: Le client vend à un marchand (garage partenaire). Parle de prix de rachat, reprise, ce qu'un garage partenaire peut proposer. Ne parle pas de mettre une annonce ou publier à X €.

Règles:
- Réponds en français, de façon claire et concise.
- Si la description est vide ou très vague, indique que des précisions (options, état intérieur/extérieur, défauts connus, historique) permettraient d’affiner l’analyse.
- Sinon, résume l’impact des éléments décrits sur la valeur de revente (positif ou négatif) et donne 2 à 4 conseils courts: points à mettre en avant, petits travaux recommandés avant vente, ou précisions à ajouter dans l’annonce.
- Utilise en priorité les données AutoScout24 fournies dans le prompt (médiane/quantiles + comparables extraits). Si ces données sont absentes, indique clairement qu'il s'agit d'une estimation prudente.
- Pour le prix: aligne-toi sur AutoScout24 Belgique; la fourchette affichée est un prix de rachat (en dessous du marché).
- Ton texte doit être affiché tel quel sous la fourchette (paragraphe ou liste courte). N'utilise jamais de markdown (pas d'astérisques ** ni __).`

    const systemMessage: SystemModelMessage = {
      role: "system",
      content: systemText,
      providerOptions: {
        anthropic: {
          cacheControl: { type: "ephemeral" },
        },
      },
    }

    const motorisation = `${carburant} / ${transmission}`
    const prompt = `Véhicule : ${marque} ${modele} ${annee}, ${kilometrage} km, motorisation : ${motorisation}.\n\nProblème décrit par l'utilisateur : ${description.trim() || "(Aucune description fournie.)"}

Contexte et détails pour l'analyse:
${vehicleSummary}
${estimateLine}
${marketLine}
${comparablesLine}

Analyse pour le rachat par un garage partenaire (prix alignés AutoScout24 Belgique, en dessous du marché car marge garage):`

    const { text, usage } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      headers: ANTHROPIC_PROMPT_CACHE_HEADERS,
      system: [systemMessage],
      prompt,
    })
    logAnthropicCacheStats(usage)

    return Response.json({ ok: true, analysis: text })
  } catch (error) {
    console.error("Vente analyze API error:", error)
    return Response.json(
      { ok: false, error: "Erreur lors de l'analyse. Veuillez réessayer." },
      { status: 500 }
    )
  }
}
