import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "Politique IA — PitStop",
  description: "Politique IA PitStop.",
}

const documentText = `CLAUSES SPÉCIFIQUES – INTELLIGENCE ARTIFICIELLE
PitStop — Service de diagnostic automobile assisté par IA
Version : 1.1 — Date d'entrée en vigueur : 2 avril 2026

1. Nature du service et qualification juridique du système
Le service PitStop repose sur un système d'intelligence artificielle (IA) automatisé, alimenté par un modèle de langage de grande taille (LLM) fourni par Anthropic, Inc. Ce système analyse les informations déclarées par l'utilisateur afin de produire une estimation indicative des causes possibles d'un dysfonctionnement automobile et des fourchettes de coûts associées.

Au sens du Règlement (UE) 2024/1689 sur l'intelligence artificielle (AI Act), PitStop agit en qualité de déployeur d'un système d'IA à usage général. Les résultats produits constituent des sorties automatisées à titre purement informatif et ne sauraient être qualifiés d'avis technique certifié, de diagnostic professionnel homologué, ni d'expertise au sens de l'article 962 du Code judiciaire belge.

2. Limites techniques et épistémiques du système
L'utilisateur reconnaît expressément que :
• le système d'IA ne dispose d'aucune capacité d'inspection physique du véhicule et fonde exclusivement son analyse sur les données textuelles déclarées par l'utilisateur ;
• la qualité, la précision et la pertinence des résultats sont directement fonction de l'exactitude, de la complétude et de la fidélité des informations communiquées ;
• des erreurs, des omissions, des hallucinations ou des approximations peuvent survenir, y compris pour des véhicules ou des symptômes courants ;
• certaines pannes, défauts structurels ou avaries cachées sont, par nature, indétectables sans un examen physique réalisé par un professionnel qualifié ;
• les estimations tarifaires sont fondées sur des référentiels de marché belges et des données historiques ; elles ne constituent pas un devis contractuel au sens de l'article 1583 du Code civil belge.

3. Absence de garantie — clause de non-responsabilité
PitStop ne souscrit aucune obligation de résultat quant à l'exactitude des diagnostics générés. En particulier, PitStop ne garantit pas :
• l'exactitude, la complétude ou la fiabilité des estimations produites par le système d'IA ;
• l'exhaustivité de l'identification des causes ou des pièces concernées ;
• l'adéquation des fourchettes tarifaires avec les conditions réelles du marché local au moment de l'intervention ;
• l'absence d'erreur, de biais ou d'omission dans les réponses générées.

La responsabilité de PitStop est limitée à une obligation de moyens dans la mise à disposition du service numérique, conformément à l'article 5:71 du nouveau Code civil belge.

4. Obligation de vérification à charge de l'utilisateur
L'utilisateur reconnaît et accepte expressément que toute information fournie par le service PitStop doit obligatoirement être soumise à la vérification d'un professionnel qualifié avant toute décision d'intervention, d'achat de pièces ou d'engagement contractuel avec un garage.

L'utilisateur s'engage à :
• ne pas prendre de décision technique, financière ou de sécurité critique sur la seule base des résultats fournis par le système d'IA ;
• consulter un garagiste agréé pour tout diagnostic définitif ;
• informer le garage partenaire de tout écart constaté entre l'estimation PitStop et la réalité constatée lors de l'inspection physique.

5. Traitement des données personnelles par le système d'IA
Les données saisies par l'utilisateur lors d'un diagnostic (description du symptôme, informations du véhicule) sont transmises à l'API d'Anthropic, Inc. aux fins de génération de la réponse. Ce traitement est encadré par la Politique de confidentialité de PitStop et les conditions d'utilisation d'Anthropic. PitStop ne conserve pas les échanges bruts transmis au modèle au-delà de ce qui est strictement nécessaire au service.

6. Usage raisonnable et interdictions
Est strictement interdite toute utilisation du service à des fins :
• de tests automatisés massifs ou de sollicitations répétées à caractère abusif (scraping, stress testing) ;
• d'extraction, de reproduction ou d'exploitation commerciale des réponses générées sans autorisation préalable écrite de PitStop ;
• de contournement des mécanismes de sécurité ou des limites d'usage fixées par PitStop ou par Anthropic ;
• contraires à la législation belge applicable, notamment en matière de protection des données (RGPD) et de droit de la consommation.

Toute violation de ces interdictions peut entraîner la suspension immédiate de l'accès au service, sans préjudice de toute action en responsabilité.

7. Évolution du système d'IA et du service
PitStop se réserve le droit de modifier à tout moment, sans préavis ni indemnité :
• le modèle d'IA sous-jacent, son fournisseur ou sa version ;
• les paramètres, instructions et contraintes appliqués au système (system prompt) ;
• les fonctionnalités exposées à l'utilisateur ;
• les conditions d'accès au service.

Les modifications substantielles affectant les droits des utilisateurs feront l'objet d'une information préalable sur la plateforme.

8. Droit applicable
Les présentes clauses sont soumises au droit belge. Tout litige relatif à leur interprétation ou à leur exécution relève de la compétence exclusive des juridictions de l'arrondissement de Nivelles, sous réserve des règles impératives de protection du consommateur applicables en Belgique.`

export default function PolitiqueIaPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4 space-y-8">
          <header className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Politique IA</h1>
            <p className="text-muted-foreground">
              Clauses spécifiques liées à l&apos;intelligence artificielle — PitStop
              <br />
              Version 1.1 — Dernière mise à jour : 2 avril 2026
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Texte intégral</h2>
            <p className="text-muted-foreground whitespace-pre-line">{documentText}</p>
          </section>

          <div className="pt-2">
            <Link href="/" className="text-primary hover:underline">
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

