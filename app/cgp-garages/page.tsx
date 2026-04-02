import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "CGP Garages — PitStop",
  description: "CGP (garages) PitStop.",
}

const documentText = `CONDITIONS GÉNÉRALES DE PARTENARIAT (B2B)
PitStop – Garages partenaires (Belgique)
Version : 1.0
Date d'entrée en vigueur : 2 avril 2026

Article 1 — Parties
Les présentes Conditions Générales de Partenariat (ci-après « CGP B2B ») régissent les relations entre :
• PitStop (Mohamad Ali Ahmad, activité en nom propre),
et
• tout Garage Partenaire ayant accepté les présentes CGP B2B.

Article 2 — Objet
Les CGP B2B ont pour objet de définir les conditions de :
• référencement du Garage sur la plateforme PitStop ;
• transmission de leads et réservations ;
• gestion des acomptes et règles d'annulation/no-show ;
• principe d'alignement avec les estimations communiquées au Client ;
• obligations réciproques de qualité et transparence.

Article 3 — Qualification des rôles
3.1 PitStop agit comme intermédiaire numérique et outil d'aide à l'orientation commerciale.
3.2 Le Garage est l'unique prestataire d'exécution des services techniques (diagnostic atelier, réparation, remplacement, entretien, etc.).
3.3 Le Garage assume l'entière responsabilité professionnelle, technique, assurantielle, légale et réglementaire de ses prestations.

Article 4 — Référencement et conditions économiques
4.1 Le partenariat peut inclure une mensualité de référencement/partenariat.
4.2 Les montants B2B sont exprimés hors TVA (HTVA), sauf mention contraire.
4.3 Les modalités de facturation et paiement sont définies contractuellement entre les parties.

Article 5 — Engagement de cohérence commerciale
5.1 Le Garage s'engage à maintenir une cohérence raisonnable avec les fourchettes présentées via PitStop, lorsque l'état réel du véhicule le permet.
5.2 En cas d'écart, le Garage s'engage à fournir au Client une justification claire, précise et argumentée (ex. avarie cachée, usure structurelle, opération complémentaire indispensable).
5.3 PitStop promeut une relation de confiance : transparence du devis, pédagogie client, traçabilité des explications.

Article 6 — Acompte et réservations
6.1 L'acompte client de 25 EUR est collecté conformément aux règles exposées au Client.
6.2 Le Garage reconnaît les mécanismes suivants :
• annulation > 18h : remboursement automatique ;
• annulation entre 18h et 1h : traitement direct Client/Garage ;
• annulation < 1h : acompte conservé ;
• no-show (≥45 min sans nouvelle) : acompte conservé ;
• retard >45 min avec information : acompte conservé, intervention possible à la discrétion du Garage.
6.3 Le Garage conserve la faculté de justifier la conservation de l'acompte lorsque des coûts de préparation réels ont été engagés.

Article 7 — Obligations du Garage partenaire
Le Garage s'engage à :
• disposer des autorisations, assurances et compétences nécessaires ;
• traiter les clients PitStop avec diligence et professionnalisme ;
• respecter les plages de rendez-vous et informer rapidement en cas d'imprévu ;
• maintenir à jour les informations utiles (horaires, disponibilité, types de prestation) ;
• éviter toute pratique trompeuse ou abusive.

Article 8 — Obligations de PitStop
PitStop s'engage à :
• assurer l'exploitation raisonnable de la plateforme ;
• transmettre les informations utiles au Garage ;
• favoriser la qualité de qualification des demandes ;
• maintenir un cadre de transparence dans la relation tripartite Client–PitStop–Garage.

Article 9 — Données personnelles et confidentialité
9.1 Chaque partie agit en conformité avec le RGPD et la législation belge applicable.
9.2 Les données reçues via PitStop ne peuvent être utilisées par le Garage qu'aux fins d'exécution des services convenus.
9.3 Les parties s'obligent à préserver la confidentialité des informations commerciales, techniques et clients échangées.

Article 10 — Propriété intellectuelle
10.1 PitStop conserve l'ensemble des droits sur la plateforme, ses marques, interfaces, contenus, outils, bases et éléments distinctifs.
10.2 Le Garage s'interdit toute reproduction, extraction ou usage non autorisé des actifs PitStop.

Article 11 — Responsabilité
11.1 Chaque partie répond de ses propres fautes et manquements.
11.2 PitStop n'est pas responsable de la mauvaise exécution de la prestation mécanique par le Garage.
11.3 Le Garage n'est pas responsable des indisponibilités techniques imputables exclusivement à PitStop, sauf faute prouvée du Garage dans l'usage des outils.

Article 12 — Fraude, abus, atteinte à l'image
En cas de fraude, pratiques commerciales trompeuses, atteinte à l'image de PitStop, non-conformité grave ou comportement déloyal, PitStop peut suspendre ou résilier le partenariat, sans préjudice des dommages et intérêts éventuels.

Article 13 — Durée, suspension et résiliation
13.1 Le partenariat prend effet à la date d'acceptation contractuelle.
13.2 Il peut être suspendu/résilié en cas de manquement grave ou répété, après notification, sauf urgence ou gravité particulière justifiant effet immédiat.

Article 14 — Preuve électronique
Les échanges électroniques, journaux techniques, horodatages, confirmations et enregistrements informatiques constituent des éléments de preuve recevables entre les parties jusqu'à preuve contraire.

Article 15 — Force majeure
Aucune partie ne sera tenue responsable d'un retard ou d'une inexécution causés par un cas de force majeure au sens du droit belge.

Article 16 — Nullité partielle et non-renonciation
16.1 La nullité d'une clause n'affecte pas la validité des autres clauses.
16.2 L'absence de mise en oeuvre immédiate d'un droit par une partie n'emporte pas renonciation.

Article 17 — Cession
Le Garage ne peut céder tout ou partie de ses droits/obligations au titre des présentes sans accord préalable écrit de PitStop.

Article 18 — Modification des CGP B2B
PitStop peut modifier les CGP B2B à tout moment.
Les nouvelles versions sont portées à la connaissance du Garage et s'appliquent selon les modalités contractuelles convenues.

Article 19 — Droit applicable et litiges
19.1 Les CGP B2B sont soumises au droit belge.
19.2 Les litiges relèvent de la compétence des juridictions de Nivelles, sauf disposition impérative contraire.`

export default function CgpGaragesPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4 space-y-8">
          <header className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Conditions générales de partenariat (garages)
            </h1>
            <p className="text-muted-foreground">
              PitStop — Garages partenaires (Belgique)
              <br />
              Dernière mise à jour : 2 avril 2026
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

