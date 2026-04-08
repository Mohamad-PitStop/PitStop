import Link from "next/link"

export function CgvBodyFr() {
  return (
    <div className="container mx-auto max-w-4xl px-4 space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          Conditions générales de vente (B2C)
        </h1>
        <p className="text-muted-foreground">
          PitStop : Clients particuliers (Belgique)
          <br />
          Version 1.1 : Dernière mise à jour : 5 avril 2026
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 1 : Identification de l&apos;éditeur</h2>
        <p className="text-muted-foreground">
          Les présentes Conditions Générales de Vente (ci-après « CGV ») sont éditées par :
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Nom : Ali Ahmad</li>
          <li>Prénom : Mohamad</li>
          <li>Statut : personne physique : activité exercée en nom propre, sans structure commerciale enregistrée à ce stade</li>
          <li>Numéro BCE : non applicable (aucune inscription à la BCE à ce jour)</li>
          <li>Numéro de TVA : non applicable (activité non assujettie à la TVA à ce stade)</li>
          <li>
            Contact :{" "}
            <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
              pitstopbelgique@gmail.com
            </a>
          </li>
        </ul>
        <p className="text-muted-foreground">Ci-après dénommé « PitStop ».</p>
        <p className="text-muted-foreground">
          Ces informations (numéro BCE, numéro de TVA, forme juridique) seront mises à jour lors du passage en exploitation
          commerciale officielle.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 2 : Objet et champ d&apos;application</h2>
        <p className="text-muted-foreground">
          2.1 Les présentes CGV régissent les relations contractuelles entre PitStop et tout utilisateur agissant en qualité
          de consommateur (ci-après « Client »), pour les services suivants :
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>diagnostic automobile assisté par IA ;</li>
          <li>achat de crédits de diagnostic ;</li>
          <li>mise en relation avec un garage partenaire ;</li>
          <li>prise de rendez-vous en garage avec acompte.</li>
        </ul>
        <p className="text-muted-foreground">
          2.2 Les présentes CGV s&apos;appliquent exclusivement aux clients situés en Belgique.
          <br />
          2.3 L&apos;achat de crédits diagnostics est proposé en ligne sur la Plateforme (page « Crédits »), avec paiement
          sécurisé par carte bancaire via Stripe, sous réserve d&apos;acceptation préalable des présentes CGV. Le parcours
          « Vente » (estimation de valeur de reprise auprès des garages partenaires) peut faire l&apos;objet d&apos;un
          déploiement distinct.
          <br />
          2.4 Toute commande, tout achat de crédits, toute réservation et tout usage de la plateforme impliquent
          l&apos;acceptation pleine et entière des présentes CGV.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 3 : Définitions</h2>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Plateforme : le site et les interfaces numériques PitStop ;</li>
          <li>Diagnostic : estimation et orientation fournies par PitStop sur base des informations déclarées par le Client ;</li>
          <li>Crédit : unité de consommation permettant l&apos;accès à un diagnostic ;</li>
          <li>Garage partenaire : professionnel indépendant référencé sur la plateforme ;</li>
          <li>Acompte : somme de 25 EUR versée lors de la réservation d&apos;un rendez-vous.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 4 : Nature du service PitStop</h2>
        <p className="text-muted-foreground">
          4.1 PitStop est un intermédiaire numérique de transparence et d&apos;orientation entre le Client et les garages
          partenaires.
          <br />
          4.2 PitStop ne réalise pas directement les interventions mécaniques, carrosserie, entretien ou réparation. Le garage
          partenaire demeure le seul prestataire d&apos;exécution.
          <br />
          4.3 Les informations fournies par PitStop ont vocation à aider le Client à comprendre les ordres de grandeur de
          coûts et les scénarios techniques probables, sans se substituer à l&apos;examen physique du véhicule.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 5 : Prix et TVA</h2>
        <p className="text-muted-foreground">
          5.1 Sauf stipulation contraire, les prix affichés au Client sont exprimés en EUR TTC.
          <br />
          5.2 Les frais de connexion internet, de communication ou tout frais externe lié à l&apos;usage de la plateforme
          restent à charge du Client.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 6 : Crédits diagnostics : fonctionnement, validité, non-remboursement</h2>
        <p className="text-muted-foreground">
          6.0 Les offres commercialisées (nombre de crédits par pack, prix en EUR TTC, éventuelles promotions) sont
          présentées sur la page « Crédits » au moment de la commande. Le prix et la composition du pack choisis par le
          Client font foi au moment de la validation du paiement.
        </p>
        <p className="text-muted-foreground">
          6.1 1 crédit = 1 diagnostic automobile complet sur la plateforme, incluant les éventuelles questions de suivi dans
          le parcours du diagnostic.
        </p>
        <p className="text-muted-foreground">6.2 Les crédits achetés sont :</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>à durée de validité illimitée ;</li>
          <li>non transférables entre comptes ;</li>
          <li>non remboursables, sauf cas prévu à l&apos;article 12.5.</li>
        </ul>
        <p className="text-muted-foreground">
          6.3 En cas de suppression volontaire du compte Client, les crédits restants sont définitivement perdus, sans
          remboursement.
          <br />
          6.4 En cas de suspension/clôture du compte pour fraude, abus ou manquement grave, les crédits restants sont
          définitivement perdus, sans remboursement.
          <br />
          6.5 Cas « aucun problème » : lorsqu&apos;un diagnostic conclut explicitement à l&apos;absence d&apos;intervention
          nécessaire (selon la logique fonctionnelle de la plateforme), le crédit utilisé est re-crédité au Client.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 7 : Paiement</h2>
        <p className="text-muted-foreground">
          7.1 Les paiements sont opérés via Stripe.
          <br />
          7.2 Les moyens de paiement disponibles sont ceux proposés par Stripe au moment de la transaction.
          <br />
          7.3 Le Client garantit être autorisé à utiliser le moyen de paiement sélectionné.
          <br />
          7.4 PitStop ne conserve pas les données complètes de carte ; ces données sont traitées par le prestataire de
          paiement conformément à ses propres conditions.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 8 : Rétractation (contenus/services numériques)</h2>
        <p className="text-muted-foreground">
          8.1 Le Client reconnaît que l&apos;achat de crédits constitue la fourniture d&apos;un contenu/service numérique
          exécuté immédiatement après confirmation.
        </p>
        <p className="text-muted-foreground">8.2 En validant sa commande, le Client :</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>demande expressément l&apos;exécution immédiate ;</li>
          <li>reconnaît perdre son droit de rétractation dès cette exécution.</li>
        </ul>
        <p className="text-muted-foreground">
          8.3 La présente clause est applicable dans les limites du droit belge et des dispositions impératives protectrices
          du consommateur.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 9 : Réservation de rendez-vous et acompte</h2>
        <p className="text-muted-foreground">
          9.1 L&apos;acompte est obligatoire pour la réservation d&apos;un rendez-vous via la plateforme.
          <br />
          9.2 Le montant de l&apos;acompte est fixe : 25 EUR.
          <br />
          9.3 En principe, l&apos;acompte est déduit de la facture finale du garage.
          <br />
          9.4 Le garage peut conserver l&apos;acompte dans les cas prévus aux articles 10.2 à 10.5 et, le cas échéant,
          lorsque des frais de préparation justifiés sont engagés.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Article 10 : Annulation, retard, no-show</h2>
        <p className="text-muted-foreground">
          Les éléments suivants valent commencement de preuve en cas de litige lié à une réservation : horodatages
          plateforme, historiques de statut, logs applicatifs, confirmations transactionnelles Stripe, échanges écrits
          client/garage, justificatifs garage (commandes de pièces, préparation matérielle, etc.).
        </p>
        <div>
          <h3 className="font-medium text-foreground">10.1 Annulation &gt; 12h avant rendez-vous</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Preuve : horodatage d&apos;annulation comparé à l&apos;horaire du RDV.</li>
            <li>Effet : annulation possible en ligne ; remboursement automatique de l&apos;acompte.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-foreground">10.2 Annulation entre 12h et 1h avant rendez-vous</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Preuve : impossibilité d&apos;annuler en ligne + contact direct garage.</li>
            <li>
              Effet : annulation en ligne indisponible ; le Client doit contacter directement le garage. Le remboursement
              éventuel de l&apos;acompte dépend de l&apos;accord conclu avec le garage ; PitStop peut faciliter la médiation.
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-foreground">10.3 Annulation &lt; 1h avant rendez-vous</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Preuve : horodatage annulation/notification.</li>
            <li>Effet : l&apos;acompte est automatiquement conservé.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-foreground">10.4 No-show (retard ≥ 15 minutes sans information)</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Preuve : heure de RDV + absence de signalement + constat garage.</li>
            <li>Effet : l&apos;acompte est automatiquement conservé.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-foreground">10.5 Retard &gt; 15 minutes avec information du garage</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Preuve : trace d&apos;appel/message + heure.</li>
            <li>
              Effet : le Client doit prévenir le garage. L&apos;acompte est conservé. Si le garage accepte néanmoins de
              réaliser l&apos;inspection/intervention, l&apos;acompte ne sera pas déduit de la facture finale.
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 11 : Estimations, devis et réserve d&apos;examen physique</h2>
        <p className="text-muted-foreground">
          11.1 Les estimations PitStop sont indicatives.
          <br />
          11.2 Elles sont élaborées sur la base des informations fournies par le Client, de standards de marché belges et de
          bases techniques alimentées par des professionnels.
          <br />
          11.3 Le devis final du garage demeure susceptible d&apos;évoluer, notamment en cas de découverte technique majeure
          lors de l&apos;inspection physique du véhicule.
          <br />
          11.4 Le Client reconnaît que le diagnostic à distance est comparable à un pré-entretien technique sans inspection
          visuelle/mécanique directe du véhicule.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Article 12 : Réclamations et régularisations</h2>
        <p className="text-muted-foreground">
          12.1 Toute réclamation doit être adressée à :{" "}
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
          </a>
          .
        </p>
        <p className="text-muted-foreground">12.2 La réclamation doit inclure au minimum :</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>identité du demandeur ;</li>
          <li>email utilisé sur la plateforme ;</li>
          <li>référence du rendez-vous ou de la transaction ;</li>
          <li>date et heure du rendez-vous (le cas échéant) ;</li>
          <li>description précise de la contestation ;</li>
          <li>pièces justificatives disponibles (captures, confirmations, etc.).</li>
        </ul>
        <p className="text-muted-foreground">12.3 Processus de traitement :</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>
            <span className="font-medium text-foreground">Réception &amp; qualification</span> : PitStop enregistre la
            demande et qualifie la nature du litige (paiement, acompte, no-show, annulation, écart de devis, etc.).
          </li>
          <li>
            <span className="font-medium text-foreground">Instruction contradictoire</span> : si un garage est impliqué,
            PitStop peut recueillir ses éléments (chronologie, justificatifs, preuves de contact, etc.).
          </li>
          <li>
            <span className="font-medium text-foreground">Décision motivée</span> : confirmation de la règle appliquée,
            régularisation totale/partielle, ou proposition amiable.
          </li>
          <li>
            <span className="font-medium text-foreground">Clôture</span> : le dossier est clôturé avec conservation des
            éléments de preuve selon les obligations légales applicables.
          </li>
        </ul>
        <p className="text-muted-foreground">
          12.4 En cas d&apos;erreur technique avérée imputable à la plateforme (double facturation, anomalie de débit,
          etc.), PitStop peut procéder à une régularisation (remboursement ou re-crédit).
          <br />
          12.5 Le non-remboursement des crédits (article 6) n&apos;exclut pas les cas de correction pour erreur technique
          avérée.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 13 : Obligations du Client</h2>
        <p className="text-muted-foreground">Le Client s&apos;engage à :</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>fournir des informations exactes, complètes et loyales ;</li>
          <li>ne pas utiliser la plateforme à des fins frauduleuses ;</li>
          <li>ne pas perturber le fonctionnement technique du service ;</li>
          <li>respecter les droits de PitStop, des garages et des tiers.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 14 : Disponibilité du service</h2>
        <p className="text-muted-foreground">
          14.1 PitStop met en œuvre des efforts raisonnables pour maintenir la disponibilité de la plateforme.
          <br />
          14.2 Des interruptions temporaires peuvent intervenir (maintenance, sécurité, incident, mise à jour).
          <br />
          14.3 PitStop ne peut être tenu responsable des indisponibilités imputables à des tiers (hébergeur, paiement,
          opérateur réseau, force majeure, etc.).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 15 : Propriété intellectuelle</h2>
        <p className="text-muted-foreground">
          15.1 La plateforme, ses contenus, marques, interfaces, textes, graphismes, bases et éléments distinctifs sont
          protégés.
          <br />
          15.2 Sauf autorisation écrite préalable, toute reproduction, extraction, adaptation ou exploitation est interdite.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 16 : Responsabilité</h2>
        <p className="text-muted-foreground">
          16.1 PitStop est tenu d&apos;une obligation de moyens dans la fourniture de ses services numériques.
          <br />
          16.2 PitStop n&apos;est pas responsable de l&apos;exécution matérielle des réparations, laquelle relève exclusivement
          du garage partenaire.
          <br />
          16.3 Le Client demeure responsable de ses déclarations, choix de rendez-vous et décisions prises sur la base des
          estimations.
          <br />
          16.4 Les dommages indirects, pertes d&apos;exploitation, pertes d&apos;opportunité ou préjudices immatériels
          consécutifs ne peuvent être imputés à PitStop sauf disposition impérative contraire.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 17 : Données personnelles</h2>
        <p className="text-muted-foreground">
          Le traitement des données personnelles est régi par la{" "}
          <Link href="/confidentialite" className="text-primary hover:underline">
            Politique de confidentialité
          </Link>{" "}
          de PitStop, accessible sur la plateforme. Le Client reconnaît en avoir pris connaissance.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 18 : Suspension / clôture de compte</h2>
        <p className="text-muted-foreground">
          18.1 PitStop peut suspendre ou clôturer un compte en cas de fraude, abus, usage malveillant, violation des CGV ou
          obligation légale.
          <br />
          18.2 Une telle clôture peut entraîner la perte des crédits restants, sans remboursement.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 19 : Preuve électronique</h2>
        <p className="text-muted-foreground">
          Les registres informatiques, logs techniques, confirmations de transaction et horodatages de PitStop et/ou de ses
          prestataires (notamment paiement) font foi entre les parties jusqu&apos;à preuve contraire.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 20 : Force majeure</h2>
        <p className="text-muted-foreground">
          PitStop n&apos;est pas responsable en cas de retard ou inexécution causés par un événement de force majeure au sens
          du droit belge et de la jurisprudence.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 21 : Nullité partielle</h2>
        <p className="text-muted-foreground">
          Si une clause est déclarée nulle ou inapplicable, les autres stipulations demeurent pleinement en vigueur.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 22 : Non-renonciation</h2>
        <p className="text-muted-foreground">
          Le fait pour PitStop de ne pas se prévaloir ponctuellement d&apos;une clause ne vaut pas renonciation définitive à
          s&apos;en prévaloir ultérieurement.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 23 : Modification des CGV</h2>
        <p className="text-muted-foreground">
          PitStop se réserve le droit de modifier les présentes CGV à tout moment. La version opposable est celle en vigueur à
          la date de l&apos;acte concerné (achat, réservation, usage).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 24 : Droit applicable et juridiction</h2>
        <p className="text-muted-foreground">
          24.1 Les présentes CGV sont soumises au droit belge.
          <br />
          24.2 Tout litige relève des juridictions matériellement compétentes de l&apos;arrondissement de Nivelles, sous
          réserve des règles impératives applicables au consommateur.
          <br />
          24.3 Le Client peut également recourir à la plateforme européenne de règlement en ligne des litiges :{" "}
          <a className="text-primary hover:underline" href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer">
            https://ec.europa.eu/consumers/odr
          </a>
        </p>
      </section>

      <div className="pt-2">
        <Link href="/" className="text-primary hover:underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
