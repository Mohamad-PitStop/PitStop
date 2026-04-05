import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "Conditions générales de partenariat : PitStop",
  description: "CGP (B2B) de PitStop pour les garages partenaires.",
}

export default function CgpGaragesPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4 space-y-8">
          <header className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Conditions générales de partenariat (B2B)
            </h1>
            <p className="text-muted-foreground">
              PitStop : Garages partenaires (Belgique)
              <br />
              Version 1.0 : Dernière mise à jour : 2 avril 2026
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 1 : Parties</h2>
            <p className="text-muted-foreground">
              Les présentes Conditions Générales de Partenariat (ci-après « CGP B2B ») régissent les relations entre :
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>PitStop (Mohamad Ali Ahmad, personne physique, activité exercée en nom propre : aucune structure commerciale enregistrée à ce stade, sans numéro BCE ni numéro de TVA belge),</li>
              <li>et tout Garage Partenaire ayant accepté les présentes CGP B2B.</li>
            </ul>
            <p className="text-muted-foreground">
              Les informations d&apos;identification légale (forme juridique, numéro BCE, numéro de TVA) seront mises à jour lors du passage en exploitation commerciale officielle.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 2 : Objet</h2>
            <p className="text-muted-foreground">Les CGP B2B ont pour objet de définir les conditions de :</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>référencement du Garage sur la plateforme PitStop ;</li>
              <li>transmission de leads et réservations ;</li>
              <li>gestion des acomptes et règles d&apos;annulation/no-show ;</li>
              <li>principe d&apos;alignement avec les estimations communiquées au Client ;</li>
              <li>obligations réciproques de qualité et transparence.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 3 : Qualification des rôles</h2>
            <p className="text-muted-foreground">
              3.1 PitStop agit comme intermédiaire numérique et outil d&apos;aide à l&apos;orientation commerciale.
              <br />
              3.2 Le Garage est l&apos;unique prestataire d&apos;exécution des services techniques (diagnostic atelier, réparation, remplacement, entretien, etc.).
              <br />
              3.3 Le Garage assume l&apos;entière responsabilité professionnelle, technique, assurantielle, légale et réglementaire de ses prestations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 4 : Référencement et conditions économiques</h2>
            <p className="text-muted-foreground">
              4.1 Le partenariat peut inclure une mensualité de référencement/partenariat.
              <br />
              4.2 Les montants B2B sont exprimés hors TVA (HTVA), sauf mention contraire.
              <br />
              4.3 Les modalités de facturation et paiement sont définies contractuellement entre les parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 5 : Engagement de cohérence commerciale</h2>
            <p className="text-muted-foreground">
              5.1 Le Garage s&apos;engage à maintenir une cohérence raisonnable avec les fourchettes présentées via PitStop, lorsque l&apos;état réel du véhicule le permet.
              <br />
              5.2 En cas d&apos;écart, le Garage s&apos;engage à fournir au Client une justification claire, précise et argumentée (ex. avarie cachée, usure structurelle, opération complémentaire indispensable).
              <br />
              5.3 PitStop promeut une relation de confiance : transparence du devis, pédagogie client, traçabilité des explications.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 6 : Acompte et réservations</h2>
            <p className="text-muted-foreground">6.1 L&apos;acompte client de 25 EUR est collecté conformément aux règles exposées au Client.</p>
            <p className="text-muted-foreground">6.2 Le Garage reconnaît les mécanismes suivants :</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>annulation &gt; 18h : remboursement automatique ;</li>
              <li>annulation entre 18h et 1h : traitement direct Client/Garage ;</li>
              <li>annulation &lt; 1h : acompte conservé ;</li>
              <li>no-show (≥45 min sans nouvelle) : acompte conservé ;</li>
              <li>retard &gt;45 min avec information : acompte conservé, intervention possible à la discrétion du Garage.</li>
            </ul>
            <p className="text-muted-foreground">6.3 Le Garage conserve la faculté de justifier la conservation de l&apos;acompte lorsque des coûts de préparation réels ont été engagés.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 7 : Obligations du Garage partenaire</h2>
            <p className="text-muted-foreground">Le Garage s&apos;engage à :</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>disposer des autorisations, assurances et compétences nécessaires ;</li>
              <li>traiter les clients PitStop avec diligence et professionnalisme ;</li>
              <li>respecter les plages de rendez-vous et informer rapidement en cas d&apos;imprévu ;</li>
              <li>maintenir à jour les informations utiles (horaires, disponibilité, types de prestation) ;</li>
              <li>éviter toute pratique trompeuse ou abusive.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 8 : Obligations de PitStop</h2>
            <p className="text-muted-foreground">PitStop s&apos;engage à :</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>assurer l&apos;exploitation raisonnable de la plateforme ;</li>
              <li>transmettre les informations utiles au Garage ;</li>
              <li>favoriser la qualité de qualification des demandes ;</li>
              <li>maintenir un cadre de transparence dans la relation tripartite Client–PitStop–Garage.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 9 : Données personnelles et confidentialité</h2>
            <p className="text-muted-foreground">
              9.1 Chaque partie agit en conformité avec le RGPD et la législation belge applicable.
              <br />
              9.2 Les données reçues via PitStop ne peuvent être utilisées par le Garage qu&apos;aux fins d&apos;exécution des services convenus.
              <br />
              9.3 Les parties s&apos;obligent à préserver la confidentialité des informations commerciales, techniques et clients échangées.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 10 : Propriété intellectuelle</h2>
            <p className="text-muted-foreground">
              10.1 PitStop conserve l&apos;ensemble des droits sur la plateforme, ses marques, interfaces, contenus, outils, bases et éléments distinctifs.
              <br />
              10.2 Le Garage s&apos;interdit toute reproduction, extraction ou usage non autorisé des actifs PitStop.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 11 : Responsabilité</h2>
            <p className="text-muted-foreground">
              11.1 Chaque partie répond de ses propres fautes et manquements.
              <br />
              11.2 PitStop n&apos;est pas responsable de la mauvaise exécution de la prestation mécanique par le Garage.
              <br />
              11.3 Le Garage n&apos;est pas responsable des indisponibilités techniques imputables exclusivement à PitStop, sauf faute prouvée du Garage dans l&apos;usage des outils.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 12 : Fraude, abus, atteinte à l&apos;image</h2>
            <p className="text-muted-foreground">
              En cas de fraude, pratiques commerciales trompeuses, atteinte à l&apos;image de PitStop, non-conformité grave ou comportement déloyal, PitStop peut suspendre ou résilier le partenariat, sans préjudice des dommages et intérêts éventuels.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 13 : Durée, suspension et résiliation</h2>
            <p className="text-muted-foreground">
              13.1 Le partenariat prend effet à la date d&apos;acceptation contractuelle.
              <br />
              13.2 Il peut être suspendu/résilié en cas de manquement grave ou répété, après notification, sauf urgence ou gravité particulière justifiant effet immédiat.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 14 : Preuve électronique</h2>
            <p className="text-muted-foreground">
              Les échanges électroniques, journaux techniques, horodatages, confirmations et enregistrements informatiques constituent des éléments de preuve recevables entre les parties jusqu&apos;à preuve contraire.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 15 : Force majeure</h2>
            <p className="text-muted-foreground">
              Aucune partie ne sera tenue responsable d&apos;un retard ou d&apos;une inexécution causés par un cas de force majeure au sens du droit belge.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 16 : Nullité partielle et non-renonciation</h2>
            <p className="text-muted-foreground">
              16.1 La nullité d&apos;une clause n&apos;affecte pas la validité des autres clauses.
              <br />
              16.2 L&apos;absence de mise en œuvre immédiate d&apos;un droit par une partie n&apos;emporte pas renonciation.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 17 : Cession</h2>
            <p className="text-muted-foreground">
              Le Garage ne peut céder tout ou partie de ses droits/obligations au titre des présentes sans accord préalable écrit de PitStop.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 18 : Modification des CGP B2B</h2>
            <p className="text-muted-foreground">
              PitStop peut modifier les CGP B2B à tout moment. Les nouvelles versions sont portées à la connaissance du Garage et s&apos;appliquent selon les modalités contractuelles convenues.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 19 : Droit applicable et litiges</h2>
            <p className="text-muted-foreground">
              19.1 Les CGP B2B sont soumises au droit belge.
              <br />
              19.2 Les litiges relèvent de la compétence des juridictions de Nivelles, sauf disposition impérative contraire.
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
