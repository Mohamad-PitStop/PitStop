import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "Politique IA : PitStop",
  description: "Clauses spécifiques liées à l'intelligence artificielle : PitStop.",
}

export default function PolitiqueIaPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4 space-y-8">
          <header className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Politique IA</h1>
            <p className="text-muted-foreground">
              PitStop : Service de diagnostic automobile assisté par IA
              <br />
              Version 1.1 : Dernière mise à jour : 2 avril 2026
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">1. Nature du service et qualification juridique du système</h2>
            <p className="text-muted-foreground">
              Le service PitStop repose sur un système d&apos;intelligence artificielle (IA) automatisé, alimenté par un modèle de langage de grande taille (LLM) fourni par Anthropic, Inc. Ce système analyse les informations déclarées par l&apos;utilisateur afin de produire une estimation indicative des causes possibles d&apos;un dysfonctionnement automobile et des fourchettes de coûts associées.
            </p>
            <p className="text-muted-foreground">
              Au sens du Règlement (UE) 2024/1689 sur l&apos;intelligence artificielle (AI Act), PitStop agit en qualité de déployeur d&apos;un système d&apos;IA à usage général. Les résultats produits constituent des sorties automatisées à titre purement informatif et ne sauraient être qualifiés d&apos;avis technique certifié, de diagnostic professionnel homologué, ni d&apos;expertise au sens de l&apos;article 962 du Code judiciaire belge.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">2. Limites techniques et épistémiques du système</h2>
            <p className="text-muted-foreground">L&apos;utilisateur reconnaît expressément que :</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>le système d&apos;IA ne dispose d&apos;aucune capacité d&apos;inspection physique du véhicule et fonde exclusivement son analyse sur les données textuelles déclarées par l&apos;utilisateur ;</li>
              <li>la qualité, la précision et la pertinence des résultats sont directement fonction de l&apos;exactitude, de la complétude et de la fidélité des informations communiquées ;</li>
              <li>des erreurs, des omissions, des hallucinations ou des approximations peuvent survenir, y compris pour des véhicules ou des symptômes courants ;</li>
              <li>certaines pannes, défauts structurels ou avaries cachées sont, par nature, indétectables sans un examen physique réalisé par un professionnel qualifié ;</li>
              <li>les estimations tarifaires sont fondées sur des référentiels de marché belges et des données historiques ; elles ne constituent pas un devis contractuel au sens de l&apos;article 1583 du Code civil belge.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">3. Absence de garantie : clause de non-responsabilité</h2>
            <p className="text-muted-foreground">
              PitStop ne souscrit aucune obligation de résultat quant à l&apos;exactitude des diagnostics générés. En particulier, PitStop ne garantit pas :
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>l&apos;exactitude, la complétude ou la fiabilité des estimations produites par le système d&apos;IA ;</li>
              <li>l&apos;exhaustivité de l&apos;identification des causes ou des pièces concernées ;</li>
              <li>l&apos;adéquation des fourchettes tarifaires avec les conditions réelles du marché local au moment de l&apos;intervention ;</li>
              <li>l&apos;absence d&apos;erreur, de biais ou d&apos;omission dans les réponses générées.</li>
            </ul>
            <p className="text-muted-foreground">
              La responsabilité de PitStop est limitée à une obligation de moyens dans la mise à disposition du service numérique, conformément à l&apos;article 5:71 du nouveau Code civil belge.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">4. Obligation de vérification à charge de l&apos;utilisateur</h2>
            <p className="text-muted-foreground">
              L&apos;utilisateur reconnaît et accepte expressément que toute information fournie par le service PitStop doit obligatoirement être soumise à la vérification d&apos;un professionnel qualifié avant toute décision d&apos;intervention, d&apos;achat de pièces ou d&apos;engagement contractuel avec un garage.
            </p>
            <p className="text-muted-foreground">L&apos;utilisateur s&apos;engage à :</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>ne pas prendre de décision technique, financière ou de sécurité critique sur la seule base des résultats fournis par le système d&apos;IA ;</li>
              <li>consulter un garagiste agréé pour tout diagnostic définitif ;</li>
              <li>informer le garage partenaire de tout écart constaté entre l&apos;estimation PitStop et la réalité constatée lors de l&apos;inspection physique.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">5. Traitement des données personnelles par le système d&apos;IA</h2>
            <p className="text-muted-foreground">
              Les données saisies par l&apos;utilisateur lors d&apos;un diagnostic (description du symptôme, informations du véhicule) sont transmises à l&apos;API d&apos;Anthropic, Inc. aux fins de génération de la réponse. Ce traitement est encadré par la{" "}
              <Link href="/confidentialite" className="text-primary hover:underline">Politique de confidentialité</Link>{" "}
              de PitStop et les conditions d&apos;utilisation d&apos;Anthropic. PitStop ne conserve pas les échanges bruts transmis au modèle au-delà de ce qui est strictement nécessaire au service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">6. Usage raisonnable et interdictions</h2>
            <p className="text-muted-foreground">Est strictement interdite toute utilisation du service à des fins :</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>de tests automatisés massifs ou de sollicitations répétées à caractère abusif (scraping, stress testing) ;</li>
              <li>d&apos;extraction, de reproduction ou d&apos;exploitation commerciale des réponses générées sans autorisation préalable écrite de PitStop ;</li>
              <li>de contournement des mécanismes de sécurité ou des limites d&apos;usage fixées par PitStop ou par Anthropic ;</li>
              <li>contraires à la législation belge applicable, notamment en matière de protection des données (RGPD) et de droit de la consommation.</li>
            </ul>
            <p className="text-muted-foreground">
              Toute violation de ces interdictions peut entraîner la suspension immédiate de l&apos;accès au service, sans préjudice de toute action en responsabilité.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">7. Évolution du système d&apos;IA et du service</h2>
            <p className="text-muted-foreground">PitStop se réserve le droit de modifier à tout moment, sans préavis ni indemnité :</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>le modèle d&apos;IA sous-jacent, son fournisseur ou sa version ;</li>
              <li>les paramètres, instructions et contraintes appliqués au système (system prompt) ;</li>
              <li>les fonctionnalités exposées à l&apos;utilisateur ;</li>
              <li>les conditions d&apos;accès au service.</li>
            </ul>
            <p className="text-muted-foreground">
              Les modifications substantielles affectant les droits des utilisateurs feront l&apos;objet d&apos;une information préalable sur la plateforme.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">8. Droit applicable</h2>
            <p className="text-muted-foreground">
              Les présentes clauses sont soumises au droit belge. Tout litige relatif à leur interprétation ou à leur exécution relève de la compétence exclusive des juridictions de l&apos;arrondissement de Nivelles, sous réserve des règles impératives de protection du consommateur applicables en Belgique.
            </p>
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
