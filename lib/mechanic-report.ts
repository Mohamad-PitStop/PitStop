import { generateText, Output, stepCountIs } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"

/**
 * Rapport technique destiné au garagiste qui recevra le client.
 * Génération coûteuse (recherche web + structuration) déférée au moment du
 * téléchargement du PDF, et mise en cache par diagnostic en DB.
 */

export const MechanicReportSchema = z.object({
  engineCode: z.string().nullable(),
  gearboxReference: z.string().nullable(),
  /** true si l'identification précise du moteur n'était pas nécessaire pour ce diagnostic. */
  engineIdentificationNotRequired: z.boolean().default(false),
  suspectedFaultCodes: z
    .array(
      z.object({
        code: z.string(),
        description: z.string(),
      }),
    )
    .default([]),
  partReferences: z
    .array(
      z.object({
        label: z.string(),
        reference: z.string(),
      }),
    )
    .default([]),
  technicalNotes: z.array(z.string()).default([]),
})

export type MechanicReport = z.infer<typeof MechanicReportSchema>

export type MechanicReportInputDiagnostic = {
  problem?: string | null
  description?: string | null
  needsMoreInfo?: boolean
  serviceRecommendation?: { type?: string | null } | null
  concessionOnly?: { required?: boolean } | null
  obdScanFirst?: { required?: boolean } | null
  priceRange?: { min?: number; max?: number } | null
  garage?: unknown | null
  diy?: { possible?: boolean } | null
}

/**
 * Détermine si un rapport garagiste a du sens pour ce diagnostic.
 * Évite la génération coûteuse pour les cas "pas d'intervention" / "info manquante".
 */
export function shouldGenerateMechanicReport(d: MechanicReportInputDiagnostic): boolean {
  if (!d) return false
  if (d.needsMoreInfo) return false
  if (d.serviceRecommendation?.type === "lavage-auto") return false
  if (d.concessionOnly?.required) return false
  if (d.obdScanFirst?.required) return false
  const hasPrice = !!d.priceRange && ((d.priceRange.min ?? 0) > 0 || (d.priceRange.max ?? 0) > 0)
  const hasGarage = !!d.garage
  const hasDiy = !!d.diy?.possible
  if (!hasPrice && !hasGarage && !hasDiy) return false
  return true
}

export async function generateMechanicReport(params: {
  locale: "fr" | "en" | "nl"
  marque: string
  modele: string
  variante?: string | null
  annee: string
  carburant?: string | null
  transmission?: string | null
  cylindree?: string | null
  puissance?: string | null
  typeBoiteAuto?: string | null
  probleme: string
  diagnostic: MechanicReportInputDiagnostic
}): Promise<MechanicReport | null> {
  const { locale, marque, modele, variante, annee, carburant, transmission, cylindree, puissance, typeBoiteAuto, probleme, diagnostic } = params

  const systemPrompt =
    locale === "en"
      ? `You are a senior automotive technician. For the given vehicle and suspected issue, produce a TECHNICAL report meant for the mechanic receiving the client.
Fill ONLY fields you are reasonably confident about. If unknown, return null or [].
- engineCode: the EXACT engine code (e.g. "M47D20", "EA288", "K9K 832"). ABSOLUTE RULE: NEVER invent or guess. Return this field ONLY if the web search results below explicitly identify a single unambiguous code for this exact vehicle (model, year, fuel, power). If multiple variants remain plausible, if the search did not return the code for this specific configuration, or if you are not 100% certain, you MUST return null. A null value is always preferred over an uncertain guess.
- engineIdentificationNotRequired: true ONLY if the diagnosis does not require knowing the engine (bodywork, brakes, tyres, suspension, exhaust outside cat/DPF, simple electrics, wash). In that case, also leave engineCode null. Otherwise false.
- gearboxReference: gearbox reference if applicable (e.g. "ZF 6HP26", "DQ250", "DSG7", "JR5"). Same rule as engineCode: never invent; if uncertain, return null.
- suspectedFaultCodes: DTC codes (P0xxx etc.) likely related to the described symptom. Include short description.
- partReferences: OEM or equivalent part numbers of the likely faulty parts.
- technicalNotes: 2 to 5 short technical notes useful for the mechanic (torque specs, known weaknesses, diagnostic tip).
Be concise. No marketing, no disclaimer. No markdown.`
      : locale === "nl"
      ? `Je bent een ervaren automonteur. Stel voor het opgegeven voertuig en vermoedelijk probleem een TECHNISCH rapport op voor de monteur.
Vul ALLEEN velden in waarover je redelijk zeker bent. Anders null of [].
- engineCode: EXACTE motorcode (bv. "M47D20", "EA288", "K9K 832"). ABSOLUTE REGEL: NOOIT verzinnen of gokken. Geef dit veld ALLEEN terug als de webzoekresultaten hieronder ondubbelzinnig één enkele code identificeren voor exact dit voertuig (model, jaar, brandstof, vermogen). Bij twijfel, meerdere plausibele varianten of ontbrekende bevestiging: geef null terug. Null is altijd beter dan een gok.
- engineIdentificationNotRequired: true ALLEEN als de diagnose geen motoridentificatie vereist (carrosserie, remmen, banden, vering, uitlaat buiten kat/roetfilter, eenvoudige elektriciteit, wassen). In dat geval engineCode ook null laten. Anders false.
- gearboxReference: versnellingsbakreferentie (bv. "ZF 6HP26", "DQ250"). Zelfde regel als engineCode: nooit verzinnen; bij twijfel null.
- suspectedFaultCodes: DTC-codes (P0xxx) gerelateerd aan het symptoom, met korte beschrijving.
- partReferences: OEM of equivalente onderdeelnummers van vermoedelijk defecte onderdelen.
- technicalNotes: 2 tot 5 korte technische notities voor de monteur.
Wees beknopt. Geen marketing, geen disclaimer, geen markdown.`
      : `Tu es un technicien automobile expérimenté. Pour le véhicule et le problème suspecté, rédige un rapport TECHNIQUE destiné au garagiste qui recevra le client.
Remplis UNIQUEMENT les champs pour lesquels tu as une confiance raisonnable. Sinon null ou [].
- engineCode: le code moteur EXACT (ex. "M47D20", "EA288", "K9K 832"). RÈGLE ABSOLUE : N'INVENTE JAMAIS et NE DEVINE JAMAIS. Ne renseigne ce champ QUE si les résultats de recherche web ci-dessous identifient de manière non ambiguë un code unique pour exactement ce véhicule (modèle, année, carburant, puissance). Si plusieurs variantes restent plausibles, si la recherche n'a pas confirmé le code pour cette configuration précise, ou si tu n'as pas une certitude de 100 %, tu DOIS renvoyer null. Une valeur null est TOUJOURS préférable à une supposition. Le client n'a pas renseigné le code moteur, donc sans preuve explicite, on n'affiche rien.
- engineIdentificationNotRequired: true UNIQUEMENT si le diagnostic ne nécessite pas de connaître le moteur (carrosserie/peinture, freinage, pneus, géométrie, suspension, échappement hors cat/FAP, électricité simple, lavage). Dans ce cas, laisse aussi engineCode à null. Sinon false.
- gearboxReference: référence boîte de vitesses le cas échéant (ex. "ZF 6HP26", "DQ250", "DSG7", "JR5"). Même règle que engineCode : jamais d'invention ; si incertain, null.
- suspectedFaultCodes: codes DTC (P0xxx etc.) probablement liés au symptôme. Ajoute une courte description.
- partReferences: numéros OEM ou équivalents des pièces vraisemblablement fautives.
- technicalNotes: 2 à 5 notes techniques courtes utiles au garagiste (couple de serrage, faiblesse connue, astuce de diagnostic).
Sois concis. Pas de marketing, pas de disclaimer, pas de markdown.`

  const vehicleLine = [
    `${marque} ${modele}${variante ? " " + variante : ""} ${annee}`,
    carburant && `fuel=${carburant}`,
    transmission && `transmission=${transmission}`,
    cylindree && `cc=${cylindree}`,
    puissance && `power=${puissance}`,
    typeBoiteAuto && `gearbox=${typeBoiteAuto}`,
  ].filter(Boolean).join(", ")

  const userPrompt =
    `Vehicle: ${vehicleLine}\n` +
    `Customer complaint: ${probleme}\n` +
    `Diagnostic summary: ${diagnostic.problem ?? ""}\n` +
    `Description: ${diagnostic.description ?? ""}`

  // Step 1 : recherche web pour les codes techniques réels (engine code, gearbox ref).
  const searchQuery =
    locale === "en"
      ? `${marque} ${modele} ${annee}${carburant ? " " + carburant : ""}${cylindree ? " " + cylindree : ""}${puissance ? " " + puissance : ""} engine code gearbox reference`
      : locale === "nl"
      ? `${marque} ${modele} ${annee}${carburant ? " " + carburant : ""}${cylindree ? " " + cylindree : ""}${puissance ? " " + puissance : ""} motorcode versnellingsbakreferentie`
      : `${marque} ${modele} ${annee}${carburant ? " " + carburant : ""}${cylindree ? " " + cylindree : ""}${puissance ? " " + puissance : ""} code moteur référence boîte de vitesses`

  let technicalContext = ""
  try {
    const searchPrompt =
      locale === "en"
        ? `You are a technical automotive researcher. For the vehicle below, run SEVERAL focused web searches to find:
1. The EXACT engine code (e.g. M47D20, EA288, K9K 832) for this model/year/fuel/power combination.
2. The EXACT gearbox reference (e.g. ZF 6HP26, DQ250, JR5) if applicable.

Search strategy: first search for the engine code specifically, then run a second search for the gearbox reference, then a third search to cross-check or find variant-specific details if results were ambiguous.

Vehicle: ${searchQuery}

Return a structured list:
- Engine code(s) found: [code] — [year range] — [fuel] — [power] — [source]
- Gearbox reference(s) found: [ref] — [year range] — [transmission type] — [source]
If a code has multiple variants, list ALL of them with their differentiators.`
        : locale === "nl"
        ? `Je bent een technisch automotive onderzoeker. Voer voor onderstaand voertuig MEERDERE gerichte zoekopdrachten uit om te vinden:
1. De EXACTE motorcode (bv. M47D20, EA288, K9K 832) voor deze model/jaar/brandstof/vermogen combinatie.
2. De EXACTE versnellingsbakreferentie (bv. ZF 6HP26, DQ250, JR5) indien van toepassing.

Zoekstrategie: eerst motorcode opzoeken, dan aparte zoekopdracht voor versnellingsbak, dan kruiscontrole bij onduidelijkheid.

Voertuig: ${searchQuery}

Geef een gestructureerde lijst:
- Motorcode(s) gevonden: [code] — [jaarbereik] — [brandstof] — [vermogen] — [bron]
- Versnellingsbakreferentie(s) gevonden: [ref] — [jaarbereik] — [transmissietype] — [bron]
Vermeld ALLE varianten met hun onderscheidende kenmerken.`
        : `Tu es un chercheur automobile technique. Pour le véhicule ci-dessous, effectue PLUSIEURS recherches web ciblées pour trouver :
1. Le CODE MOTEUR EXACT (ex. M47D20, EA288, K9K 832) pour cette combinaison modèle/année/carburant/puissance.
2. La RÉFÉRENCE BOÎTE DE VITESSES EXACTE (ex. ZF 6HP26, DQ250, JR5) le cas échéant.

Stratégie de recherche : cherche d'abord le code moteur spécifiquement, puis une deuxième recherche pour la référence boîte, puis une troisième pour croiser ou préciser si les résultats étaient ambigus.

Véhicule : ${searchQuery}

Retourne une liste structurée :
- Code(s) moteur trouvés : [code] — [plage d'années] — [carburant] — [puissance] — [source]
- Référence(s) boîte trouvées : [réf] — [plage d'années] — [type de transmission] — [source]
Si un code a plusieurs variantes, liste-les TOUTES avec leurs différenciateurs.`

    const searchResult = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      tools: { webSearch: anthropic.tools.webSearch_20250305({ maxUses: 4 }) },
      stopWhen: stepCountIs(5),
      maxOutputTokens: 1500,
      prompt: searchPrompt,
    })
    technicalContext = searchResult.text?.trim() ?? ""
  } catch (err) {
    console.error("Mechanic report web search step failed:", err)
  }

  const enrichedPrompt =
    userPrompt +
    (technicalContext
      ? `\n\nWeb search results for engine code / gearbox reference:\n${technicalContext}\n\nUse the above search results as the SOLE source of truth for engineCode and gearboxReference. The client has NOT provided the engine code. Only return a value if the search results explicitly and unambiguously confirm a single code for this exact vehicle (matching model, year, fuel type AND power). If multiple variants are listed without a definitive match, if the search is silent, or if any doubt remains: return null. Do not pick "the most likely" — return null. A missing value is correct; a fabricated one is a serious error.`
      : "")

  try {
    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      system: systemPrompt,
      maxOutputTokens: 1200,
      prompt: enrichedPrompt,
      output: Output.object({ schema: MechanicReportSchema }),
    })
    return output ?? null
  } catch (err) {
    console.error("Mechanic report structuring step failed:", err)
    return null
  }
}
