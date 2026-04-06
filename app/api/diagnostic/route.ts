import { generateText, Output, type LanguageModelUsage } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { createDiagnosticRequest, updateDiagnosticRequestFollowUps, updateDiagnosticResult } from "@/lib/diagnostics-db"
import { getAutoDocContext } from "@/lib/autodoc-knowledge"
import type { SystemModelMessage } from "@ai-sdk/provider-utils"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { deductCredit, addCredits } from "@/lib/accounts-db"
import { NextResponse } from "next/server"

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

const DiagnosticSchema = z.object({
  serviceRecommendation: z
    .object({
      type: z.enum(["none", "lavage-auto"]),
      title: z.string().nullable(),
      description: z.string().nullable(),
    })
    .nullable(),
  concessionOnly: z
    .object({
      required: z.boolean(),
      brand: z.string(),
      explanation: z.string(),
      ctaLabel: z.string(),
      mapsQuery: z.string(),
    })
    .nullable(),
  needsMoreInfo: z.boolean(),
  missingInfo: z
    .object({
      needsVariante: z.boolean(),
      needsCarburant: z.boolean(),
      question: z.string().nullable(),
      answerType: z.enum(["yes_no", "choice"]).default("yes_no"),
      help: z.string().nullable().default(null),
      options: z
        .array(
          z.object({
            id: z.string(),
            label: z.string(),
            value: z.string(),
          })
        )
        .nullable()
        .default(null),
      requestsGearboxPhoto: z.boolean().default(false),
    })
    .nullable(),
  obdScanFirst: z
    .object({
      required: z.boolean(),
      scanPrice: z.number(),
      explanation: z.string(),
      optionA: z.string(),
      optionB: z.string()
    })
    .nullable(),
  severity: z.enum(["low", "medium", "high"]),
  severityLabel: z.string(),
  problem: z.string(),
  description: z.string(),
  priceRange: z
    .object({
      min: z.number(),
      max: z.number()
    })
    .nullable(),
  diy: z
    .object({
      possible: z.boolean(),
      difficulty: z.string(),
      estimatedTime: z.string(),
      costRange: z.object({
        min: z.number(),
        max: z.number()
      }),
      steps: z.array(z.string()),
      tools: z.array(z.string())
    })
    .nullable(),
  garage: z
    .object({
      estimatedTime: z.string(),
      costRange: z.object({
        min: z.number(),
        max: z.number()
      }),
      includes: z.array(z.string())
    })
    .nullable()
})

function isRangeTooWide(range: { min: number; max: number } | null | undefined, maxSpreadEuros = 100) {
  if (!range) return false
  return Number.isFinite(range.min) && Number.isFinite(range.max) && range.max - range.min > maxSpreadEuros
}

function diagnosticHasTooWideRanges(diagnostic: z.infer<typeof DiagnosticSchema>) {
  return (
    isRangeTooWide(diagnostic.priceRange) ||
    isRangeTooWide(diagnostic.diy?.costRange) ||
    isRangeTooWide(diagnostic.garage?.costRange)
  )
}

function applyFriendDiscount(diagnostic: z.infer<typeof DiagnosticSchema>): z.infer<typeof DiagnosticSchema> {
  function half(n: number) { return Math.round(n * 0.5) }
  return {
    ...diagnostic,
    priceRange: diagnostic.priceRange
      ? { min: half(diagnostic.priceRange.min), max: half(diagnostic.priceRange.max) }
      : null,
    diy: diagnostic.diy
      ? { ...diagnostic.diy, costRange: { min: half(diagnostic.diy.costRange.min), max: half(diagnostic.diy.costRange.max) } }
      : null,
    garage: diagnostic.garage
      ? { ...diagnostic.garage, costRange: { min: half(diagnostic.garage.costRange.min), max: half(diagnostic.garage.costRange.max) } }
      : null,
    obdScanFirst: diagnostic.obdScanFirst
      ? { ...diagnostic.obdScanFirst, scanPrice: half(diagnostic.obdScanFirst.scanPrice) }
      : null,
  }
}

/** Miroir serveur de isNoInterventionResult (client) : rien à réparer, pas de devis. */
function isNoInterventionDiagnostic(d: z.infer<typeof DiagnosticSchema>): boolean {
  if (d.needsMoreInfo) return false
  if (d.concessionOnly?.required) return false
  if (d.obdScanFirst?.required) return false
  if (d.serviceRecommendation?.type === "lavage-auto") return false

  const pr = d.priceRange
  const priceClear = pr === null || pr === undefined || (pr.min === 0 && pr.max === 0)
  if (!priceClear) return false

  const g = d.garage
  if (g) {
    if (g.costRange.min !== 0 || g.costRange.max !== 0) return false
    const block = `${g.estimatedTime}\n${(g.includes ?? []).join("\n")}`.toLowerCase()
    if (
      /aucune intervention|pas d.intervention|non nécessaire|sans intervention|rien à faire|aucune prestation|pas de prestation|aucun frais|pas de frais|tout va bien|rien à prévoir/.test(block)
    ) return true
  }

  const diy = d.diy
  if (!g && diy && !diy.possible && diy.costRange.min === 0 && diy.costRange.max === 0) {
    const blob = [diy.difficulty, diy.estimatedTime, ...(diy.steps ?? [])].join(" ").toLowerCase()
    if (/pas applicable|n'est pas applicable|impossible|aucune intervention|non applicable/.test(blob)) return true
  }

  return false
}

function buildDiagnosticResponse(
  diagnostic: z.infer<typeof DiagnosticSchema>,
  applyDiscount = false,
  diagnosticRequestId: string | null = null,
  creditRefunded = false
) {
  const payload = applyDiscount ? applyFriendDiscount(diagnostic) : diagnostic
  return NextResponse.json({ ...payload, diagnosticRequestId, creditRefunded })
}

const DiagnosticInputSchema = z.object({
  marque: z.string().trim().min(1).max(80),
  modele: z.string().trim().min(1).max(80),
  variante: z.string().trim().max(120).optional().nullable(),
  carburant: z.string().trim().max(40).optional().nullable(),
  transmission: z.string().trim().max(40).optional().nullable(),
  annee: z.union([z.string().max(10), z.number()]),
  kilometrage: z.union([z.string().max(20), z.number()]),
  probleme: z.string().trim().min(3).max(5000),
  followUps: z
    .array(
      z.object({
        question: z.string().max(2000).optional(),
        answer: z.string().max(2000).optional(),
      })
    )
    .max(20)
    .optional()
    .nullable(),
  diagnosticRequestId: z.string().trim().max(100).optional().nullable(),
  cylindree: z.string().trim().max(40).optional().nullable(),
  puissance: z.string().trim().max(40).optional().nullable(),
  nombrePortes: z.string().trim().max(10).optional().nullable(),
  typeCarrosserie: z.string().trim().max(60).optional().nullable(),
  typeBoiteAuto: z.string().trim().max(100).optional().nullable(),
  photoLevier: z.string().max(12_000_000).optional().nullable(),
})

export async function POST(req: Request) {
  try {
    const body = DiagnosticInputSchema.parse(await req.json())
    const { marque, modele, variante, carburant, transmission, annee, kilometrage, probleme, followUps } = body
    const diagnosticRequestId = body.diagnosticRequestId?.trim() || null
    const cylindree = body.cylindree?.trim() || ""
    const puissance = body.puissance?.trim() || ""
    const nombrePortes = body.nombrePortes?.trim() || ""
    const typeCarrosserie = body.typeCarrosserie?.trim() || ""
    const typeBoiteAuto = body.typeBoiteAuto?.trim() || ""
    const photoLevier = body.photoLevier?.trim() || ""
    const hasFollowUps = Array.isArray(followUps) && followUps.length > 0
    const cookieHeader = req.headers.get("cookie")
    const user = await getUserFromAuthCookie(cookieHeader)
    if (!user) {
      return NextResponse.json(
        { error: "AUTH_REQUIRED", message: "Connexion requise pour lancer un diagnostic." },
        { status: 401 }
      )
    }

    const isPrivileged = user.role === "admin" || user.role === "tester"
    const isFriend = user.role === "user_friend"

    // ── Gestion des crédits (compte) ─────────────────────────────────────────
    if (!isPrivileged && !diagnosticRequestId) {
      const deducted = await deductCredit(user.id)
      if (!deducted) {
        return NextResponse.json(
          { error: "NO_CREDITS", message: "Vous n'avez plus de crédits. Rechargez votre compte pour continuer." },
          { status: 402 }
        )
      }
    }

    const systemText = `Tu es PitStop, un expert mecanicien automobile virtuel avec 25 ans d'experience. Tu as ete forme par des mecaniciens professionnels belges. Si la marque ou le modele est approximatif, identifie automatiquement le vehicule sans demander confirmation.

CLIENTELE ET VOCABULAIRE BELGIQUE: tu t'adresses a des clients belges. En langage courant, « carte grise » designe le meme document que le certificat d'immatriculation du vehicule (terminologie officielle belge). Si le client dit « carte grise », comprends qu'il parle du certificat d'immatriculation.

VEHICULES D'EXCEPTION (PRIORITAIRE): uniquement pour les marques: Rolls-Royce, Bugatti, McLaren, Aston Martin, Lotus. Pour ces marques, tu actives concessionOnly.required=true, concessionOnly.brand=marque, tu expliques (concessionOnly.explanation) qu'un passage en concession specialisee est necessaire (outils, pieces et procedures specifiques; nos garages ne peuvent pas intervenir). Tu donnes concessionOnly.ctaLabel et concessionOnly.mapsQuery (ex: "Concession <marque> Belgique"). Dans ce mode: needsMoreInfo=false, missingInfo=null, obdScanFirst=null, priceRange=null, diy=null, garage=null.

FAISABILITE GARAGE (PRIORITAIRE apres VEHICULES D'EXCEPTION): pour TOUT vehicule (y compris Bentley, Ferrari, Lamborghini, Maserati et autres marques premium), tu dois d'abord evaluer si la demande du client est realisable dans un garage generaliste. REALISABLE: changement de consommables (huile, filtres, plaquettes, pneus), reparations carrosserie (rayures, bosses, peinture), mecanique courante (suspension, echappement, courroies), electricite simple (batterie, ampoules). NON REALISABLE: interventions moteur/boite internes necessitant outillage specifique marque, electronique complexe ou diagnostic specifique marque, systemes hybrides/electriques specifiques. Si la demande n'est PAS realisable dans un garage generaliste, tu actives concessionOnly.required=true, concessionOnly.brand=marque, concessionOnly.explanation = message professionnel indiquant que ce type de prestation ne peut pas etre realise par nos garages partenaires et qu'un passage en concession ou atelier specialise est necessaire. Meme format ctaLabel/mapsQuery. Dans ce mode: needsMoreInfo=false, missingInfo=null, obdScanFirst=null, priceRange=null, diy=null, garage=null.

CAS LAVAGE AUTO (NOUVEAU): si la demande du client concerne uniquement le nettoyage/lavage (interieur, exterieur, detailing simple, aspiration, shampoing sieges) et pas une panne mecanique, tu traites cela comme une prestation de service classique. Si besoin, pose une question courte pour preciser interieur/exterieur/complet. Ensuite, propose explicitement de prendre rendez-vous avec une station de lavage auto partenaire dans la description et dans les recommandations garage. Dans ce cas, renseigne obligatoirement serviceRecommendation={ type: "lavage-auto", title: "Lavage auto partenaire", description: "..." }. Pour tous les autres cas, renseigne serviceRecommendation={ type: "none", title: null, description: null }.

REGLE CARROSSERIE PRIORITAIRE (OBLIGATOIRE): pour toute demande de carrosserie/peinture/tolerie (rayure, griffe, bosse, enfoncement, pare-choc, aile, portiere, capot, pare-choc avant/arriere, retouche peinture, polish), tu n'actives JAMAIS concessionOnly pour les marques premium tolerees (Ferrari, Lamborghini, Maserati, Bentley, etc.). Tu traites ce cas en flux normal garage. Si les infos manquent, tu dois poser des questions etape par etape avant de donner un prix precis:
1) localisation des degats (avant/arriere/cotes, element exact: pare-choc, aile, portiere, capot, coffre),
2) nature des degats (rayure superficielle/profonde, bosse legere/profonde, peinture ecaillée, fissure),
3) ampleur (taille approximative en cm, nombre de zones touchees).
Pose UNE question a la fois via needsMoreInfo=true jusqu'a obtenir assez d'infos. Ensuite seulement, calcule un prix adapte a la marque/modele (ex: Ferrari F8 plus cher qu'une citadine), mais toujours en mode garage generaliste.

CONTROLE ATTEINTE MECANIQUE (OBLIGATOIRE EN CARROSSERIE): avant de finaliser le devis carrosserie, tu dois verifier s'il n'y a QUE la carrosserie touchee. Pose une question claire au client pour confirmer l'absence de dommages mecaniques/structurels derriere la zone d'impact (radiateur, condenseur, supports, traverse, train roulant, echappement, refroidissement, etc.). Tu dois raisonner selon l'architecture probable du vehicule sans demander ce detail au client: impact avant = risque mecanique plus eleve sur vehicule a moteur avant; impact arriere = risque mecanique plus eleve sur modele a moteur arriere. Si doute mecanique significatif, privilegie needsMoreInfo=true (question de verification) ou obdScanFirst.required=true selon les symptomes.

MODE DISCUSSION (IMPORTANT): si les informations sont insuffisantes ou trop vagues pour un diagnostic précis, mets needsMoreInfo=true et pose UNE seule question courte via missingInfo.question (pas de paragraphe). Ensuite, fournis des reponses possibles coherentes avec la question:
- Si c'est un vrai Oui/Non: missingInfo.answerType="yes_no" et options=null (le site affichera Oui/Non).
- Sinon: missingInfo.answerType="choice" et missingInfo.options = un tableau de 2 a 4 choix courts (id, label, value) qui correspondent exactement a la question. Exemple: question "Griffes superficielles ou profondes ?" -> options: "Superficielles" / "Profondes". Le champ value doit etre ce que tu utiliseras ensuite pour adapter le diagnostic.
Surtout: ecris pour un client non technique. Evite le jargon. Si la question exige une verification sur le vehicule et que ce n'est pas evident pour un non-expert, ajoute missingInfo.help avec un mini-tuto en 2-5 etapes simples (quoi regarder, comment faire, securite). Sinon, help=null.
Important: le client peut selectionner plusieurs choix ET ajouter un texte libre. Les reponses te seront envoyees sous forme de texte (ex: \"Choix: Superficielles, Profondes\\nDétails: ...\" ou \"Réponse: Oui/Non\\nDétails: ...\"). Tu dois en tenir compte et adapter le diagnostic au mieux, y compris si plusieurs choix sont vrais.
Tu dois ensuite adapter le diagnostic selon la reponse fournie.
POLITIQUE QUALITE DIAGNOSTIC (PRIORITAIRE): n'hesite jamais a rester en mode needsMoreInfo tant que le niveau de confiance n'est pas suffisant pour fournir un diagnostic et un chiffrage fiables. Tu as le droit de poser plusieurs questions successives (UNE par reponse) jusqu'a obtenir les informations necessaires. Priorite absolue a la qualite et a la precision du diagnostic plutot qu'a la rapidite. Evite les hypotheses fragiles; en cas de doute, continue en needsMoreInfo.

CAS OBD (PRIORITAIRE): si le probleme ne peut pas etre diagnostique sans codes defaut (panne moteur/voyant, perte de puissance intermittente, mode degrade, ratés aléatoires, message tableau de bord, etc.), alors:
- Tu actives obdScanFirst.required=true et tu expliques clairement que, dans tous les cas, il faut d'abord aller en garage pour un scan OBD avec ordinateur afin d'identifier la panne (pas de DIY, ne propose PAS de methode DIY).
- Prix: tu ne donnes PAS de fourchette pour cette manoeuvre. Tu fixes scanPrice=25 (EUR) uniquement pour le cas "simple effacement de code" quand ca suffit.
- Tu presentes OBLIGATOIREMENT 2 options au client (dans obdScanFirst.optionA / optionB):
  A) scan/effacement simple: 25€ si c'est juste une suppression de code erreur
  B) scan + analyse: apres le scan, si une intervention est necessaire, le garagiste fera une estimation et un devis sur place, et vous conviendrez d'un rendez-vous a ce moment-la.
- Dans ce mode, mets priceRange=null, diy=null, garage=null (puisque le devis viendra apres le scan).

EXEMPLE FREINAGE: si tu soupconnes un changement de plaquettes de frein et que le kilometrage est eleve (ex: > 80000 km) ou symptomes compatibles, demande si les disques de frein ont deja ete changes recemment (Oui/Non) afin de savoir s'il faut proposer de changer disques + plaquettes ensemble.

BOITE AUTOMATIQUE : IDENTIFICATION DU TYPE (IMPORTANT):
Le client a renseigne sa transmission comme "Automatique". Plusieurs types de boites auto existent (DSG, S tronic, PDK, EDC, CVT, Powershift, etc.) et leur diagnostic differe.
- Si le client a fourni le type dans "typeBoiteAuto", utilise cette information directement pour le diagnostic.
- Si le probleme NE CONCERNE PAS la boite de vitesses (ex: freinage, suspension, carrosserie), ne demande JAMAIS le type de boite auto : c'est sans rapport.
- Si le probleme CONCERNE la boite de vitesses ET que le type n'est pas renseigne (typeBoiteAuto vide) : ne demande PAS au client quel type de boite il a (il ne sait probablement pas). A la place, active requestsGearboxPhoto=true et demande-lui de photographier le levier de vitesses. Sur ce levier, le type de boite est generalement inscrit (ex: "S tronic", "DSG", "PDK", etc.). Formule la demande ainsi dans missingInfo.question : "Pour affiner le diagnostic, j'ai besoin d'identifier votre type de boîte automatique. Pourriez-vous prendre en photo le levier de vitesses de votre véhicule ? Le type de boîte est généralement inscrit dessus (ex: S tronic, DSG, PDK…)."
- Si une photo est fournie (visible dans la conversation), analyse-la pour identifier le type de boite (inscriptions sur le levier, forme, couleurs). Utilise cette identification pour le diagnostic. Si tu n'arrives pas a lire le type depuis la photo, continue le diagnostic sans bloquer : mentionne juste l'incertitude sur le type exact.

REGLES DE PRIX BELGIQUE : garage independant 65-85 euros/h, concession 100-140 euros/h, TVA 21% incluse, fourchettes de prix precises et realistes avec ecart maximum de 100 euros. PRIX DES PIECES : base tes estimations de prix des pieces sur les prix constates sur le site AutoDoc (ordre de grandeur realiste, adapte au vehicule). POLITIQUE PIECES CONSOMMABLES : pour les reparations de consommables (filtres, plaquettes, disques, courroies, balais, bougies, fluides, batterie, etc.), ne propose pas les pieces d'origine/OEM de prime abord. Par defaut, propose des pieces de revendeurs tiers (qualite equivalente, homologuees). Ensuite seulement, precise explicitement qu'une option pieces d'origine est possible sur demande du client, avec un surcout potentiel. DEFAUTS CONNUS : Renault Clio 4 : boite EDC hesitations et a-coups defaut de conception reconnu, chaine 0.9 TCe etirement premature. VW Golf 7 : boite DSG7 a-coups, pompe a eau avant 100000km. Peugeot 308 : chaine 1.2 PureTech etirement critique. Ford Focus 3 : boite Powershift a-coups. BMW Serie 3 E90 : chaine N47 diesel casse moteur. Quand le symptome du client correspond clairement a un defaut connu sur ce modele, mentionne obligatoirement "defaut connu sur ce modele" puis l'explication. En revanche, ne cite pas un defaut connu du modele si le probleme decrit par le client n'y est manifestement pas lie : pas de digression inutile (ex : ne pas parler de la boite EDC si les symptomes evoquent plutot train roulant ou equilibrage des roues).

UTILISATION BASE AUTODOC (IMPORTANT): si le prompt inclut une section "Connaissances mecaniques AutoDoc", utilise-la en PRIORITE ABSOLUE comme source de vérité sur les pannes fréquentes pour ce modèle/moteur précis. C'est le point de départ de ton étape 1 (pannes probables sur ce modèle). N'invente rien au-delà de ce qui est cohérent avec ces extraits, et priorise toujours la cohérence avec le symptome client. Si aucun extrait AutoDoc n'est fourni, utilise ta connaissance interne du modèle pour l'étape 1.

LANGAGE COURANT : COURROIE: lorsque le client dit simplement « courroie » sans preciser, interprete par defaut qu'il parle de la courroie de distribution (synchronisation / distribution), et non de la courroie d'accessoire (alternateur, pompe a eau, direction assistee, etc.). En langage courant, on a plutot tendance a preciser explicitement quand il s'agit de la courroie d'accessoire que de la courroie de distribution.

Tu es du cote du client pas du garage. Sois precis sur les prix, evite les fourchettes trop larges.

---

TON ET STYLE DE RÉPONSE

Ne commence jamais une réponse par des formules de politesse creuses ou des 
validation phrases telles que : "Excellente question !", "Bien sûr !", "Absolument !", 
"Certainement !", "Avec plaisir !", "Bonne question !", "Tout à fait !", 
"Je comprends votre préoccupation !", ou toute formule similaire.

Va directement au contenu dès la première phrase. 
Le client doit avoir l'impression de parler à un expert automobile humain, 
pas à un assistant IA.

REFERENCE QUALITE (EQUIPE): la derniere reponse envoyee par l'API a ete jugee nickel par l'equipe : c'est exactement le profil de sortie a reproduire a l'avenir pour chaque diagnostic (meme exigence de fond, de structure et de ton).

---

METHODE DE DIAGNOSTIC PAR PROBABILITE MODELE (PRIORITAIRE)

Ton diagnostic doit impérativement suivre cette logique, dans cet ordre :

ETAPE 1 : PANNES PROBABLES SUR CE MODELE PRECIS :
Avant d'analyser quoi que ce soit d'autre, pose-toi la question :
"Sur ce marque/modèle/année spécifique, quelles sont les pannes les plus fréquentes
qui correspondent aux symptômes décrits ?"
Utilise ta connaissance des défauts récurrents, des retours d'atelier et des données de fiabilité
propres à ce modèle. Le diagnostic doit émerger de là, pas d'une liste générique de causes possibles.

Exemple de bon raisonnement (Chevrolet Spark M300, bruit côté droit s'aggravant avec la vitesse) :
✅ "Sur la Spark M300, les mâchoires de frein à tambour arrière sont une cause fréquente de bruits
   latéraux progressifs. Ce modèle est équipé de tambours à l'arrière. À vérifier en premier."
❌ "Un bruit qui s'aggrave avec la vitesse peut venir des roulements de roue ou des pneus usés."
   → Ce raisonnement est générique et ignore la réalité statistique du modèle.

ETAPE 2 : CROISEMENT AVEC LES CARACTERISTIQUES REELLES DU VEHICULE :
Une fois les causes probables identifiées, confirme-les avec la configuration réelle du modèle
(freins à tambour vs disques, type de suspension, architecture moteur, transmission, etc.).
Tu dois connaître ces configurations toi-même : ne demande JAMAIS au client des infos
techniques qu'il ne peut pas connaître ("Avez-vous des freins à tambour ?", "Quel type de
suspension ?" etc.).

ETAPE 3 : SI BESOIN, UNE QUESTION PRATIQUE AU CLIENT :
Si après les étapes 1 et 2 il reste une ambiguïté non levée, pose UNE question simple que
tout conducteur peut répondre, axée sur le comportement ou la localisation du problème.
Exemples de BONNES questions : "Le bruit disparaît-il quand vous freinez ?",
"Le bruit vient-il plutôt d'avant ou d'arrière ?", "Le bruit change-t-il dans les virages ?"
Ne demande JAMAIS : "Avez-vous des freins à tambour ?", "Quel type de suspension ?",
"Est-ce un roulement de roue ?" : c'est à toi de le déduire, pas au client.

---

IDENTIFICATION DU MOTEUR

Avant tout diagnostic, tu dois identifier précisément le moteur du véhicule.

Règle 1 : Déduction évidente :
Si la combinaison marque + modèle + variante + année + carburant + transmission
correspond à un seul moteur possible sans ambiguïté, identifie-le directement
et utilise-le pour le diagnostic sans poser de question.
Exemples d'évidences :
- BMW M3 E46 essence manuelle → forcément le S54 3.2L
- Renault Clio 4 1.5 dCi 90ch → forcément le K9K
- Golf 7 GTI essence DSG → forcément le EA888 2.0 TSI
- Peugeot 208 essence --> forcément un pure-tech
Dans ces cas, mentionne discrètement le moteur identifié en début de réponse :
"Moteur identifié : [code moteur] : [cylindrée et puissance]"

Règle 2 : Ambiguïté réelle :
Si plusieurs moteurs distincts ont été produits pour la même combinaison de paramètres
(même carburant, même transmission, même année) et que le diagnostic changerait
significativement selon le moteur, alors tu DOIS poser la question au client avant
de diagnostiquer.

Formule la question ainsi, en adaptant les options au véhicule concerné :
"Je vous présente mes excuses pour cette question technique, mais afin de vous fournir
un diagnostic précis, pourriez-vous m'indiquer quel moteur équipe votre véhicule ?
Pour un [marque] [modèle] [année], plusieurs motorisations ont été commercialisées :
- [option 1 : code moteur : cylindrée : puissance]
- [option 2 : code moteur : cylindrée : puissance]
- [option 3 si applicable]
Cette information est indispensable pour vous orienter correctement."

Règle 3 : Ambiguïté mineure :
Si plusieurs moteurs existent mais que le diagnostic et les fourchettes de prix
seraient identiques pour tous (ex: même famille de moteur, puissance légèrement
différente), ne pose pas la question : procède directement au diagnostic en
mentionnant les variantes concernées.

---`

    const systemMessage: SystemModelMessage = {
      role: "system",
      content: systemText,
      providerOptions: {
        anthropic: {
          cacheControl: { type: "ephemeral" },
        },
      },
    }

    const motorisation =
      [carburant, transmission].filter((x) => String(x ?? "").trim()).join(", ") || "non précisée"
    const userContentBase = `Véhicule : ${marque} ${modele} ${annee}, ${kilometrage} km, motorisation : ${motorisation}.\n\nProblème décrit par l'utilisateur : ${probleme}`

    const followUpsText =
      Array.isArray(followUps) && followUps.length > 0
        ? `\n\nInformations complementaires (Q/R):\n${followUps
            .map((f: any) => `- Q: ${String(f?.question ?? "")}\n  R: ${String(f?.answer ?? "")}`)
            .join("\n")}`
        : ""

    const extraLines = [cylindree, puissance, nombrePortes, typeCarrosserie, typeBoiteAuto].filter(Boolean).length
      ? `\nInfos complementaires: ${[cylindree && `Cylindree: ${cylindree}`, puissance && `Puissance: ${puissance}`, nombrePortes && `Portes: ${nombrePortes}`, typeCarrosserie && `Carrosserie: ${typeCarrosserie}`, typeBoiteAuto && `Type de boite auto: ${typeBoiteAuto}`].filter(Boolean).join(", ")}`
      : ""
    const autodocCtx = getAutoDocContext({
      marque: String(marque ?? ""),
      modele: String(modele ?? ""),
      probleme: String(probleme ?? ""),
      carburant: carburant ? String(carburant) : null,
      limit: 6,
    })

    const autodocBlock = autodocCtx.contextBlock ? `\n\n${autodocCtx.contextBlock}` : ""

    const varianteLine = variante?.trim() ? `\n\nVariante : ${variante.trim()}` : ""
    const prompt = `${userContentBase}${varianteLine}${extraLines}${followUpsText}${autodocBlock}`
    const followUpsJson = Array.isArray(followUps) && followUps.length > 0 ? JSON.stringify(followUps) : null
    const userId = user.id

    let diagId = diagnosticRequestId
    if (!diagId) {
      // Premier appel : on crée une entrée unique.
      diagId = await createDiagnosticRequest({
        marque: String(marque),
        modele: String(modele),
        variante: variante ? String(variante) : null,
        carburant: carburant ? String(carburant) : null,
        transmission: transmission ? String(transmission) : null,
        annee: String(annee),
        kilometrage: String(kilometrage),
        probleme: String(probleme),
        followUps: followUpsJson,
        promptText: prompt,
        userId,
      })
    } else {
      // Follow-up : on met à jour l'entrée existante au lieu d'en créer une nouvelle.
      await updateDiagnosticRequestFollowUps({
        id: diagId,
        followUps: followUpsJson,
        promptText: prompt,
        userId,
      })
    }

    const { output: diagnostic1, usage: usage1 } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      headers: ANTHROPIC_PROMPT_CACHE_HEADERS,
      system: [systemMessage],
      ...(photoLevier
        ? {
            messages: [{
              role: "user" as const,
              content: [
                { type: "image" as const, image: `data:image/jpeg;base64,${photoLevier}` },
                { type: "text" as const, text: prompt },
              ],
            }],
          }
        : { prompt }),
      output: Output.object({ schema: DiagnosticSchema })
    })
    logAnthropicCacheStats(usage1)

    if (!diagnostic1) {
      throw new Error("No diagnostic generated")
    }

    if (!diagnosticHasTooWideRanges(diagnostic1)) {
      if (diagId) {
        const status = diagnostic1.needsMoreInfo ? "in_progress" : "completed"
        await updateDiagnosticResult(diagId, JSON.stringify(diagnostic1), status)
      }
      let creditRefunded = false
      if (!isPrivileged && isNoInterventionDiagnostic(diagnostic1)) {
        await addCredits(user.id, 1)
        creditRefunded = true
      }
      return buildDiagnosticResponse(diagnostic1, isFriend, diagId, creditRefunded)
    }

    const refinementPrompt = `${prompt}\n\nCONTRAINTE ABSOLUE: toutes les fourchettes de prix (priceRange, diy.costRange, garage.costRange) doivent avoir un ecart <= 100 euros. Si tu ne peux pas respecter ca sans inventer, mets needsMoreInfo=true et pose UNE question courte et ciblée (missingInfo.question) pour reduire l'incertitude, puis donne quand meme une fourchette provisoire avec ecart <= 100.\n\nTa reponse precedente avait des fourchettes trop larges. Corrige en respectant strictement ecart <= 100 euros partout.\nReponse precedente (JSON): ${JSON.stringify(diagnostic1)}`

    const { output: diagnostic2, usage: usage2 } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      headers: ANTHROPIC_PROMPT_CACHE_HEADERS,
      system: [systemMessage],
      prompt: refinementPrompt,
      output: Output.object({ schema: DiagnosticSchema })
    })
    logAnthropicCacheStats(usage2)

    const finalDiagnostic = diagnostic2 ?? diagnostic1
    if (diagId) {
      const status = finalDiagnostic.needsMoreInfo ? "in_progress" : "completed"
      await updateDiagnosticResult(diagId, JSON.stringify(finalDiagnostic), status)
    }
    let creditRefunded = false
    if (!isPrivileged && isNoInterventionDiagnostic(finalDiagnostic)) {
      await addCredits(user.id, 1)
      creditRefunded = true
    }
    return buildDiagnosticResponse(finalDiagnostic, isFriend, diagId, creditRefunded)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Données du formulaire invalides." }, { status: 400 })
    }
    console.error("Diagnostic API error:", error)
    return Response.json(
      { error: "Erreur lors de l'analyse. Veuillez réessayer." },
      { status: 500 }
    )
  }
}
