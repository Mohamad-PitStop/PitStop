import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "SLA — PitStop",
  description: "Annexe SLA (Service Level Agreement) de la plateforme PitStop.",
}

export default function SlaPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4 space-y-8">
          <header className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              SLA : Service Level Agreement
            </h1>
            <p className="text-muted-foreground">
              Annexe 1 : Plateforme PitStop (services numériques)
              <br />
              Version 1.1 : Dernière mise à jour : 5 avril 2026
              <br />
              Portée : cette annexe est opposable dans le cadre des CGV (clients) et des CGP (garages) PitStop. Elle constitue un engagement de moyens.
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">1. Objet et valeur juridique</h2>
            <p className="text-muted-foreground">
              Le présent Service Level Agreement (ci-après « SLA ») définit les niveaux de service cibles de la plateforme PitStop en matière de disponibilité, de gestion des incidents, de maintenance et de communication.
            </p>
            <p className="text-muted-foreground">
              Le SLA constitue un <span className="font-medium text-foreground">engagement de moyens</span> au sens du droit belge des obligations (article 5:71 du nouveau Code civil belge). Il ne saurait être qualifié de garantie de résultat. PitStop ne peut être tenu responsable d&apos;interruptions ou de dégradations de service résultant de causes extérieures à son contrôle raisonnable.
            </p>
            <p className="text-muted-foreground">
              Les niveaux de service définis ci-après s&apos;appliquent à la version de production de la plateforme. Durant la phase de test restreinte (bêta), ils sont fournis à titre indicatif et sans engagement contractuel exécutoire.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">2. Périmètre fonctionnel couvert</h2>
            <p className="text-muted-foreground">Le SLA couvre la disponibilité technique des fonctions suivantes :</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>consultation des pages publiques PitStop ;</li>
              <li>authentification, gestion du compte utilisateur, gestion des crédits ;</li>
              <li>parcours de diagnostic assisté par IA ;</li>
              <li>parcours de prise de rendez-vous avec acompte ;</li>
              <li>APIs internes nécessaires au fonctionnement applicatif.</li>
            </ul>
            <p className="text-muted-foreground">Les éléments suivants sont expressément exclus du périmètre des obligations de résultat :</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>la disponibilité des infrastructures tierces (Stripe, Vercel, Turso, Anthropic, DNS, réseau mobile/opérateur, etc.) ;</li>
              <li>les interruptions causées par un événement de force majeure au sens du droit belge ;</li>
              <li>les indisponibilités résultant d&apos;actions malveillantes externes (attaques DDoS, intrusions, etc.) ;</li>
              <li>les indisponibilités imputables à une mauvaise configuration ou à un usage non conforme côté utilisateur ;</li>
              <li>les fonctionnalités en cours de déploiement ou en phase de test bêta.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">3. Disponibilité cible</h2>
            <p className="text-muted-foreground">
              3.1 La disponibilité mensuelle cible de la plateforme est fixée à <span className="font-medium text-foreground">99,5 %</span> (engagement de moyens).
            </p>
            <p className="text-muted-foreground">
              3.2 La disponibilité est calculée sur le mois civil selon la formule suivante :
            </p>
            <p className="text-muted-foreground pl-4 border-l-2 border-border italic">
              Disponibilité (%) = ((Durée totale du mois - Durée d&apos;indisponibilité imputable) / Durée totale du mois) × 100
            </p>
            <p className="text-muted-foreground">
              3.3 Sont exclus du calcul de l&apos;indisponibilité : les fenêtres de maintenance planifiée annoncées, les incidents imputables à des prestataires tiers, et les cas de force majeure.
            </p>
            <p className="text-muted-foreground">
              3.4 En cas de non-atteinte de la disponibilité cible pour des raisons imputables à PitStop, l&apos;utilisateur peut adresser une réclamation à <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">pitstopbelgique@gmail.com</a>. Aucune compensation financière automatique n&apos;est prévue dans le cadre de la phase de test.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Gestion de la maintenance</h2>
            <div>
              <h3 className="font-medium text-foreground">4.1 Maintenance planifiée</h3>
              <p className="text-muted-foreground">
                PitStop peut effectuer des opérations de maintenance planifiée (corrective, préventive ou évolutive). Sauf urgence, une information préalable est communiquée aux utilisateurs via la plateforme ou par tout canal approprié, dans un délai raisonnable avant l&apos;intervention.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">4.2 Maintenance urgente</h3>
              <p className="text-muted-foreground">
                En cas de faille de sécurité avérée, de risque de corruption ou de perte de données, ou d&apos;indisponibilité critique affectant l&apos;intégrité du service ou des données utilisateurs, PitStop se réserve le droit d&apos;intervenir sans préavis. Une communication post-intervention sera effectuée dans un délai raisonnable.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">4.3 Fenêtres de maintenance préférentielles</h3>
              <p className="text-muted-foreground">
                Dans la mesure du possible, les opérations de maintenance planifiée sont programmées en dehors des heures de forte utilisation (préférentiellement la nuit ou le week-end). Cette règle n&apos;est pas opposable à PitStop en cas d&apos;urgence technique.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">5. Classification et qualification des incidents</h2>
            <p className="text-muted-foreground">
              Les incidents sont qualifiés selon leur impact fonctionnel sur les utilisateurs :
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><span className="font-medium text-foreground">P1 — Critique :</span> indisponibilité complète du service principal, impossibilité d&apos;effectuer un paiement ou un diagnostic, panne bloquante généralisée affectant l&apos;ensemble des utilisateurs.</li>
              <li><span className="font-medium text-foreground">P2 — Majeur :</span> fonctionnalité centrale indisponible ou fortement dégradée pour une partie significative des utilisateurs ; contournement difficile ou impossible.</li>
              <li><span className="font-medium text-foreground">P3 — Mineur :</span> dégradation non bloquante d&apos;une fonctionnalité secondaire, avec contournement possible ; impact limité sur l&apos;expérience utilisateur.</li>
              <li><span className="font-medium text-foreground">P4 — Cosmétique / Évolution :</span> défaut visuel sans impact fonctionnel, ou demande d&apos;amélioration non urgente.</li>
            </ul>
            <p className="text-muted-foreground">
              La qualification de la priorité d&apos;un incident relève de la seule appréciation de PitStop, sur la base des éléments techniques disponibles au moment de la constatation.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">6. Délais cibles de prise en charge (engagement de moyens)</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>P1 : prise en charge cible en moins d&apos;1 heure à compter de la détection ou signalement ;</li>
              <li>P2 : prise en charge cible en moins de 4 heures ;</li>
              <li>P3 : prise en charge cible en moins d&apos;1 jour ouvré ;</li>
              <li>P4 : intégration au backlog de maintenance sans délai garanti.</li>
            </ul>
            <p className="text-muted-foreground">
              Ces délais concernent la prise en charge (accusé de réception et début d&apos;investigation), non la résolution. Les délais de résolution dépendent de la nature de la cause racine, de la complexité technique, et des éventuelles dépendances vis-à-vis de prestataires tiers. PitStop ne peut garantir un délai de résolution défini pour aucune catégorie d&apos;incident.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">7. Communication lors d&apos;un incident</h2>
            <p className="text-muted-foreground">
              7.1 Pour tout incident de niveau P1 ou P2, PitStop s&apos;engage à communiquer dans un délai raisonnable les informations suivantes :
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>la nature et le périmètre de l&apos;incident ;</li>
              <li>les impacts fonctionnels connus ;</li>
              <li>les actions de remédiation engagées ;</li>
              <li>le statut de progression vers le retour à la normale.</li>
            </ul>
            <p className="text-muted-foreground">
              7.2 La communication s&apos;effectue par voie de notification sur la plateforme ou par tout autre canal jugé approprié par PitStop. Les utilisateurs enregistrés peuvent également être contactés par email pour les incidents de niveau P1 d&apos;une durée supérieure à 4 heures.
            </p>
            <p className="text-muted-foreground">
              7.3 Pour les incidents de niveau P3 et P4, aucune communication proactive individuelle n&apos;est garantie.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">8. Sécurité opérationnelle</h2>
            <p className="text-muted-foreground">
              PitStop met en place, dans la limite de ses moyens techniques, les mesures de sécurité opérationnelle suivantes :
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>journalisation des événements sensibles (authentification, paiements, opérations administratives) ;</li>
              <li>contrôles d&apos;accès administratifs renforcés (restriction par email propriétaire, vérification d&apos;origine des requêtes) ;</li>
              <li>protections anti-rejeu sur les flux critiques de paiement (idempotence des webhooks Stripe) ;</li>
              <li>contrôles de cohérence et de plafonnement sur les opérations sensibles (attribution de crédits, rôles utilisateurs) ;</li>
              <li>chiffrement des mots de passe par algorithme scrypt et des tokens de session par hachage SHA-256.</li>
            </ul>
            <p className="text-muted-foreground">
              Ces mesures constituent un effort raisonnable de sécurisation et ne sauraient être interprétées comme une garantie absolue contre toute intrusion ou violation de données.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">9. Sauvegarde, journalisation et conservation des preuves</h2>
            <p className="text-muted-foreground">
              9.1 PitStop conserve des journaux techniques couvrant :
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>les opérations de diagnostic et de paiement, aux fins de preuve contractuelle ;</li>
              <li>les événements de sécurité sensibles (tentatives de connexion, opérations administratives) ;</li>
              <li>les événements d&apos;incidents techniques aux fins de diagnostic.</li>
            </ul>
            <p className="text-muted-foreground">
              9.2 Ces journaux sont conservés pendant la durée nécessaire à la défense des droits des parties, dans le respect de la politique de confidentialité et de la réglementation applicable (RGPD, droit belge).
            </p>
            <p className="text-muted-foreground">
              9.3 En cas de litige, les journaux techniques de PitStop et de ses prestataires (notamment Stripe et Turso) font foi jusqu&apos;à preuve contraire, conformément à l&apos;article 19 des CGV.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">10. Signalement d&apos;un incident par l&apos;utilisateur</h2>
            <p className="text-muted-foreground">
              10.1 Tout utilisateur qui constate une anomalie ou une indisponibilité peut le signaler à :{" "}
              <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">pitstopbelgique@gmail.com</a>.
            </p>
            <p className="text-muted-foreground">Le signalement doit préciser :</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>la fonctionnalité concernée ;</li>
              <li>la date et l&apos;heure de constatation ;</li>
              <li>le navigateur et l&apos;appareil utilisés ;</li>
              <li>une description précise du comportement observé ;</li>
              <li>toute capture d&apos;écran ou information complémentaire utile.</li>
            </ul>
            <p className="text-muted-foreground">
              10.2 Le signalement par l&apos;utilisateur ne préjuge pas de la qualification de l&apos;incident par PitStop ni de l&apos;application des délais définis à l&apos;article 6.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">11. Limites de responsabilité et exclusions</h2>
            <p className="text-muted-foreground">
              11.1 Le présent SLA constitue un engagement de moyens. PitStop ne souscrit aucune obligation de résultat quant à la disponibilité continue de la plateforme.
            </p>
            <p className="text-muted-foreground">
              11.2 La responsabilité de PitStop au titre du présent SLA est exclue dans les cas suivants :
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>indisponibilité d&apos;un prestataire tiers hors du contrôle de PitStop ;</li>
              <li>force majeure au sens du droit belge ;</li>
              <li>usage non conforme de la plateforme par l&apos;utilisateur ;</li>
              <li>actions malveillantes externes (cyberattaques, etc.) ;</li>
              <li>non-respect par l&apos;utilisateur des prérequis techniques nécessaires à l&apos;accès au service.</li>
            </ul>
            <p className="text-muted-foreground">
              11.3 En aucun cas, PitStop ne saurait être tenu responsable de dommages indirects, pertes d&apos;exploitation, pertes de données ou préjudices immatériels résultant d&apos;une indisponibilité, sauf disposition légale impérative contraire applicable en droit belge de la consommation.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">12. Révision du SLA</h2>
            <p className="text-muted-foreground">
              12.1 PitStop se réserve le droit de modifier le présent SLA à tout moment, pour des raisons techniques, légales ou de sécurité.
            </p>
            <p className="text-muted-foreground">
              12.2 La version opposable est celle publiée sur la plateforme à la date de survenance de l&apos;incident ou du litige concerné.
            </p>
            <p className="text-muted-foreground">
              12.3 Les modifications substantielles affectant les niveaux de service feront l&apos;objet d&apos;une information préalable aux utilisateurs enregistrés.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">13. Droit applicable et juridiction</h2>
            <p className="text-muted-foreground">
              Le présent SLA est soumis au droit belge. Tout litige relatif à son interprétation ou à son exécution relève de la compétence des juridictions de l&apos;arrondissement de Nivelles, sous réserve des règles impératives de protection du consommateur applicables en Belgique.
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
