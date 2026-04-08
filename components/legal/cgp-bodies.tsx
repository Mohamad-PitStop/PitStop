import Link from "next/link"

export function CgpBodyFr() {
  return (
    <div className="container mx-auto max-w-4xl px-4 space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          Conditions générales de partenariat (B2B)
        </h1>
        <p className="text-muted-foreground">
          PitStop : Garages partenaires (Belgique)
          <br />
          Version 1.1 : Dernière mise à jour : 5 avril 2026
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 1 : Parties</h2>
        <p className="text-muted-foreground">
          Les présentes Conditions Générales de Partenariat (ci-après « CGP B2B ») régissent les relations entre :
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>
            PitStop (Mohamad Ali Ahmad, personne physique, activité exercée en nom propre : aucune structure commerciale
            enregistrée à ce stade, sans numéro BCE ni numéro de TVA belge),
          </li>
          <li>et tout Garage Partenaire ayant accepté les présentes CGP B2B.</li>
        </ul>
        <p className="text-muted-foreground">
          Les informations d&apos;identification légale (forme juridique, numéro BCE, numéro de TVA) seront mises à jour lors du
          passage en exploitation commerciale officielle.
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
          <li>obligations réciproques de qualité et transparence ;</li>
          <li>
            espaces professionnels dédiés (tableau de bord garage) permettant la gestion des disponibilités, des réservations, des
            demandes de reversement d&apos;acompte et, le cas échéant, des collaborateurs.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 3 : Qualification des rôles</h2>
        <p className="text-muted-foreground">
          3.1 PitStop agit comme intermédiaire numérique et outil d&apos;aide à l&apos;orientation commerciale.
          <br />
          3.2 Le Garage est l&apos;unique prestataire d&apos;exécution des services techniques (diagnostic atelier, réparation,
          remplacement, entretien, etc.).
          <br />
          3.3 Le Garage assume l&apos;entière responsabilité professionnelle, technique, assurantielle, légale et réglementaire de
          ses prestations.
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
          5.1 Le Garage s&apos;engage à maintenir une cohérence raisonnable avec les fourchettes présentées via PitStop, lorsque
          l&apos;état réel du véhicule le permet.
          <br />
          5.2 En cas d&apos;écart, le Garage s&apos;engage à fournir au Client une justification claire, précise et argumentée (ex.
          avarie cachée, usure structurelle, opération complémentaire indispensable).
          <br />
          5.3 PitStop promeut une relation de confiance : transparence du devis, pédagogie client, traçabilité des explications.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 6 : Acompte et réservations</h2>
        <p className="text-muted-foreground">
          6.1 L&apos;acompte client de 25 EUR est collecté conformément aux règles exposées au Client.
        </p>
        <p className="text-muted-foreground">6.2 Le Garage reconnaît les mécanismes suivants :</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>annulation &gt; 12h : remboursement automatique ;</li>
          <li>
            annulation entre 12h et 1h : traitement direct Client/Garage ; le Garage peut aussi, avec l&apos;accord du Client,
            enregistrer une annulation depuis son espace PitStop conduisant au remboursement lorsque les outils de paiement le
            permettent ;
          </li>
          <li>annulation &lt; 1h : acompte conservé ;</li>
          <li>no-show (≥15 min sans nouvelle) : acompte conservé ;</li>
          <li>retard &gt;15 min avec information : acompte conservé, intervention possible à la discrétion du Garage.</li>
        </ul>
        <p className="text-muted-foreground">
          6.3 Le Garage conserve la faculté de justifier la conservation de l&apos;acompte lorsque des coûts de préparation réels
          ont été engagés.
        </p>
        <p className="text-muted-foreground">
          6.4 Réservation multi-garages : le Client désigne un Garage sur la plateforme ; l&apos;acompte est attribué à ce Garage
          dans le suivi interne PitStop.
        </p>
        <p className="text-muted-foreground">
          6.5 Séquestre et absence de Stripe Connect : l&apos;acompte est encaissé via le prestataire de paiement du Client ;
          PitStop assure un suivi en base de données en vue d&apos;un reversement manuel sur l&apos;IBAN professionnel fourni
          par le Garage, sans recours à Stripe Connect pour le compte du Garage. Un délai minimal après l&apos;heure de fin du
          rendez-vous peut être exigé par la plateforme avant toute demande de retrait par le Garage.
        </p>
        <p className="text-muted-foreground">
          6.6 Demandes de reversement : le Garage peut initier une demande depuis son espace professionnel selon les statuts
          affichés ; l&apos;administrateur PitStop confirme le virement bancaire et peut enregistrer une référence. En cas
          d&apos;annulation ou de remboursement Client conforme aux CGV B2C, la ligne de reversement correspondante est annulée
          ou ajustée en cohérence avec ce traitement.
        </p>
        <p className="text-muted-foreground">
          6.7 Disponibilités : le Garage renseigne ses plages, fermetures exceptionnelles et blocages dans son espace ; les
          créneaux proposés au Client sont calculés à partir des données stockées sur la plateforme (sans obligation de
          synchronisation Google Calendar par garage).
        </p>
        <p className="text-muted-foreground">
          6.8 Horaires d&apos;ouverture : toute demande de modification substantielle passe par le formulaire prévu ; PitStop
          (administration) peut devoir valider la demande avant application sur le profil public du Garage.
        </p>
        <p className="text-muted-foreground">
          6.9 Comptes employés : le Garage peut inviter des collaborateurs par e-mail ; l&apos;accès « garagiste » est activé
          après acceptation de l&apos;invitation et sous réserve des paramètres du Garage et des présentes CGP B2B.
        </p>
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
          9.2 Les données reçues via PitStop ne peuvent être utilisées par le Garage qu&apos;aux fins d&apos;exécution des services
          convenus.
          <br />
          9.3 Les parties s&apos;obligent à préserver la confidentialité des informations commerciales, techniques et clients
          échangées.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 10 : Propriété intellectuelle</h2>
        <p className="text-muted-foreground">
          10.1 PitStop conserve l&apos;ensemble des droits sur la plateforme, ses marques, interfaces, contenus, outils, bases et
          éléments distinctifs.
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
          11.3 Le Garage n&apos;est pas responsable des indisponibilités techniques imputables exclusivement à PitStop, sauf faute
          prouvée du Garage dans l&apos;usage des outils.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 12 : Fraude, abus, atteinte à l&apos;image</h2>
        <p className="text-muted-foreground">
          En cas de fraude, pratiques commerciales trompeuses, atteinte à l&apos;image de PitStop, non-conformité grave ou
          comportement déloyal, PitStop peut suspendre ou résilier le partenariat, sans préjudice des dommages et intérêts
          éventuels.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 13 : Durée, suspension et résiliation</h2>
        <p className="text-muted-foreground">
          13.1 Le partenariat prend effet à la date d&apos;acceptation contractuelle.
          <br />
          13.2 Il peut être suspendu/résilié en cas de manquement grave ou répété, après notification, sauf urgence ou gravité
          particulière justifiant effet immédiat.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 14 : Preuve électronique</h2>
        <p className="text-muted-foreground">
          Les échanges électroniques, journaux techniques, horodatages, confirmations et enregistrements informatiques constituent
          des éléments de preuve recevables entre les parties jusqu&apos;à preuve contraire.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 15 : Force majeure</h2>
        <p className="text-muted-foreground">
          Aucune partie ne sera tenue responsable d&apos;un retard ou d&apos;une inexécution causés par un cas de force majeure au
          sens du droit belge.
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
          Le Garage ne peut céder tout ou partie de ses droits/obligations au titre des présentes sans accord préalable écrit de
          PitStop.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 18 : Modification des CGP B2B</h2>
        <p className="text-muted-foreground">
          PitStop peut modifier les CGP B2B à tout moment. Les nouvelles versions sont portées à la connaissance du Garage et
          s&apos;appliquent selon les modalités contractuelles convenues.
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
  )
}

export function CgpBodyEn() {
  return (
    <div className="container mx-auto max-w-4xl px-4 space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">General partnership terms (B2B)</h1>
        <p className="text-muted-foreground">
          PitStop: Partner garages (Belgium)
          <br />
          Version 1.1: Last updated: 5 April 2026
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 1: Parties</h2>
        <p className="text-muted-foreground">
          These General Partnership Terms (hereinafter “B2B GPT”) govern the relationship between:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>
            PitStop (Mohamad Ali Ahmad, natural person; activity carried on in own name: no registered business structure at this
            stage, no Belgian BCE or VAT number),
          </li>
          <li>and any Partner Garage that has accepted these B2B GPT.</li>
        </ul>
        <p className="text-muted-foreground">
          Legal identification details (legal form, BCE number, VAT number) will be updated when official commercial operations
          begin.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 2: Purpose</h2>
        <p className="text-muted-foreground">The B2B GPT are intended to define the terms for:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>listing the Garage on the PitStop platform;</li>
          <li>transmitting leads and bookings;</li>
          <li>managing deposits and cancellation/no-show rules;</li>
          <li>principle of alignment with estimates communicated to the Customer;</li>
          <li>mutual obligations of quality and transparency;</li>
          <li>
            dedicated professional areas (garage dashboard) for managing availability, bookings, deposit payout requests and,
            where applicable, staff.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 3: Role allocation</h2>
        <p className="text-muted-foreground">
          3.1 PitStop acts as a digital intermediary and tool to support commercial guidance.
          <br />
          3.2 The Garage is the sole contractor for technical services (workshop diagnostics, repair, replacement, maintenance,
          etc.).
          <br />
          3.3 The Garage bears full professional, technical, insurance, legal and regulatory responsibility for its services.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 4: Listing and commercial terms</h2>
        <p className="text-muted-foreground">
          4.1 The partnership may include a monthly listing/partnership fee.
          <br />
          4.2 B2B amounts are stated excluding VAT unless otherwise stated.
          <br />
          4.3 Invoicing and payment terms are defined contractually between the parties.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 5: Commercial consistency commitment</h2>
        <p className="text-muted-foreground">
          5.1 The Garage undertakes to maintain reasonable consistency with the ranges shown via PitStop, where the actual
          condition of the vehicle allows.
          <br />
          5.2 In case of variance, the Garage undertakes to provide the Customer with a clear, precise and reasoned explanation
          (e.g. hidden damage, structural wear, essential additional work).
          <br />
          5.3 PitStop promotes a relationship of trust: transparent quotes, customer education, traceability of explanations.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 6: Deposit and bookings</h2>
        <p className="text-muted-foreground">
          6.1 The Customer deposit of EUR 25 is collected in accordance with the rules communicated to the Customer.
        </p>
        <p className="text-muted-foreground">6.2 The Garage acknowledges the following mechanisms:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>cancellation &gt; 12h: automatic refund;</li>
          <li>
            cancellation between 12h and 1h: direct Customer/Garage handling; the Garage may also, with the Customer&apos;s
            agreement, record a cancellation from its PitStop area leading to a refund where payment tools allow;
          </li>
          <li>cancellation &lt; 1h: deposit retained;</li>
          <li>no-show (≥15 min without notice): deposit retained;</li>
          <li>delay &gt;15 min with notice: deposit retained; work possible at the Garage&apos;s discretion.</li>
        </ul>
        <p className="text-muted-foreground">
          6.3 The Garage may justify retention of the deposit where real preparation costs have been incurred.
        </p>
        <p className="text-muted-foreground">
          6.4 Multi-garage booking: the Customer selects a Garage on the platform; the deposit is allocated to that Garage in
          PitStop&apos;s internal tracking.
        </p>
        <p className="text-muted-foreground">
          6.5 Escrow and no Stripe Connect: the deposit is collected via the Customer&apos;s payment provider; PitStop maintains
          database tracking for manual payout to the professional IBAN provided by the Garage, without Stripe Connect on the
          Garage&apos;s behalf. A minimum delay after the scheduled end of the appointment may be required before the Garage
          can request a payout.
        </p>
        <p className="text-muted-foreground">
          6.6 Payout requests: the Garage may initiate a request from its professional area according to displayed statuses; the
          PitStop administrator confirms the bank transfer and may record a reference. If a Customer cancellation or refund
          applies under the B2C GTS, the corresponding payout line is cancelled or adjusted accordingly.
        </p>
        <p className="text-muted-foreground">
          6.7 Availability: the Garage maintains slots, exceptional closures and blocks in its area; slots offered to the
          Customer are derived from data stored on the platform (no mandatory per-garage Google Calendar sync).
        </p>
        <p className="text-muted-foreground">
          6.8 Opening hours: any material change request goes through the provided form; PitStop (administration) may need to
          approve the request before it applies to the Garage&apos;s public profile.
        </p>
        <p className="text-muted-foreground">
          6.9 Staff accounts: the Garage may invite colleagues by e-mail; “garage staff” access is activated after the
          invitation is accepted and subject to the Garage&apos;s settings and these B2B GPT.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 7: Partner garage obligations</h2>
        <p className="text-muted-foreground">The Garage undertakes to:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>hold the necessary authorisations, insurance and skills;</li>
          <li>treat PitStop customers diligently and professionally;</li>
          <li>respect appointment slots and promptly report unforeseen issues;</li>
          <li>keep useful information up to date (opening hours, availability, types of service);</li>
          <li>avoid any misleading or abusive practice.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 8: PitStop obligations</h2>
        <p className="text-muted-foreground">PitStop undertakes to:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>ensure reasonable operation of the platform;</li>
          <li>transmit useful information to the Garage;</li>
          <li>support good qualification of requests;</li>
          <li>maintain a transparent framework in the three-way Customer–PitStop–Garage relationship.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 9: Personal data and confidentiality</h2>
        <p className="text-muted-foreground">
          9.1 Each party acts in compliance with the GDPR and applicable Belgian law.
          <br />
          9.2 Data received via PitStop may be used by the Garage only for the performance of agreed services.
          <br />
          9.3 The parties undertake to keep confidential commercial, technical and customer information exchanged.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 10: Intellectual property</h2>
        <p className="text-muted-foreground">
          10.1 PitStop retains all rights to the platform, its trademarks, interfaces, content, tools, databases and distinctive
          elements.
          <br />
          10.2 The Garage shall not reproduce, extract or use PitStop assets without authorisation.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 11: Liability</h2>
        <p className="text-muted-foreground">
          11.1 Each party is liable for its own faults and breaches.
          <br />
          11.2 PitStop is not liable for poor performance of mechanical work by the Garage.
          <br />
          11.3 The Garage is not liable for technical unavailability attributable solely to PitStop, unless the Garage is proved
          at fault in using the tools.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 12: Fraud, abuse, harm to reputation</h2>
        <p className="text-muted-foreground">
          In case of fraud, misleading commercial practices, harm to PitStop&apos;s reputation, serious non-compliance or
          disloyal conduct, PitStop may suspend or terminate the partnership, without prejudice to any damages.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 13: Term, suspension and termination</h2>
        <p className="text-muted-foreground">
          13.1 The partnership takes effect on the date of contractual acceptance.
          <br />
          13.2 It may be suspended/terminated in case of serious or repeated breach, after notice, unless urgency or particular
          seriousness justifies immediate effect.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 14: Electronic evidence</h2>
        <p className="text-muted-foreground">
          Electronic exchanges, technical logs, timestamps, confirmations and computer records are admissible evidence between
          the parties unless proven otherwise.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 15: Force majeure</h2>
        <p className="text-muted-foreground">
          Neither party shall be liable for delay or non-performance caused by force majeure within the meaning of Belgian law.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 16: Partial invalidity and no waiver</h2>
        <p className="text-muted-foreground">
          16.1 Invalidity of one clause does not affect the validity of the others.
          <br />
          16.2 Failure by a party to enforce a right immediately does not constitute waiver.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 17: Assignment</h2>
        <p className="text-muted-foreground">
          The Garage may not assign all or part of its rights/obligations under these terms without PitStop&apos;s prior written
          consent.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 18: Amendment of the B2B GPT</h2>
        <p className="text-muted-foreground">
          PitStop may amend the B2B GPT at any time. New versions are brought to the Garage&apos;s attention and apply according
          to the agreed contractual arrangements.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 19: Applicable law and disputes</h2>
        <p className="text-muted-foreground">
          19.1 The B2B GPT are governed by Belgian law.
          <br />
          19.2 Disputes fall within the jurisdiction of the courts of Nivelles, unless mandatory law provides otherwise.
        </p>
      </section>

      <div className="pt-2">
        <Link href="/" className="text-primary hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  )
}

export function CgpBodyNl() {
  return (
    <div className="container mx-auto max-w-4xl px-4 space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Algemene partnerschapsvoorwaarden (B2B)</h1>
        <p className="text-muted-foreground">
          PitStop: Partnergarages (België)
          <br />
          Versie 1.1: Laatst bijgewerkt: 5 april 2026
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 1: Partijen</h2>
        <p className="text-muted-foreground">
          Deze Algemene Partnerschapsvoorwaarden (hierna « B2B APV ») regelen de verhouding tussen:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>
            PitStop (Mohamad Ali Ahmad, natuurlijke persoon; activiteit op eigen naam: geen geregistreerde handelsstructuur op dit
            moment, geen Belgisch KBO- of btw-nummer),
          </li>
          <li>en elke Partnergarage die deze B2B APV heeft aanvaard.</li>
        </ul>
        <p className="text-muted-foreground">
          Wettelijke identificatiegegevens (rechtsvorm, KBO-nummer, btw-nummer) worden bijgesteld bij de officiële start van de
          commerciële exploitatie.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 2: Voorwerp</h2>
        <p className="text-muted-foreground">De B2B APV hebben tot doel de voorwaarden vast te leggen voor:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>vermelding van de Garage op het PitStop-platform;</li>
          <li>doorgeven van leads en reserveringen;</li>
          <li>beheer van voorschotten en regels voor annulering/no-show;</li>
          <li>beginsel van afstemming op de aan de Klant gecommuniceerde schattingen;</li>
          <li>wederzijdse verplichtingen tot kwaliteit en transparantie;</li>
          <li>
            toegewijde professionele omgevingen (garage-dashboard) voor beheer van beschikbaarheid, reserveringen,
            uitbetalingsaanvragen voor het voorschot en, indien van toepassing, medewerkers.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 3: Rolverdeling</h2>
        <p className="text-muted-foreground">
          3.1 PitStop treedt op als digitale tussenpersoon en hulpmiddel voor commerciële oriëntatie.
          <br />
          3.2 De Garage is de enige uitvoerende dienstverlener voor technische diensten (werkplaatsdiagnose, herstel, vervanging,
          onderhoud, enz.).
          <br />
          3.3 De Garage draagt de volledige professionele, technische, verzekerings-, juridische en reglementaire
          verantwoordelijkheid voor zijn prestaties.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 4: Vermelding en economische voorwaarden</h2>
        <p className="text-muted-foreground">
          4.1 Het partnerschap kan een maandelijkse vermelding/partnerschapsvergoeding omvatten.
          <br />
          4.2 B2B-bedragen zijn uitgedrukt exclusief btw, tenzij anders vermeld.
          <br />
          4.3 Facturatie en betaling worden contractueel tussen de partijen vastgelegd.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 5: Verplichting tot commerciële coherentie</h2>
        <p className="text-muted-foreground">
          5.1 De Garage verbindt zich ertoe redelijke coherentie te handhaven met de via PitStop getoonde bandbreedtes, voor zover
          de werkelijke staat van het voertuig dit toelaat.
          <br />
          5.2 Bij afwijking verbindt de Garage zich ertoe de Klant een duidelijke, nauwkeurige en onderbouwde uitleg te geven (bv.
          verborgen schade, structurele slijtage, noodzakelijke bijkomende ingreep).
          <br />
          5.3 PitStop bevordert een vertrouwensrelatie: transparante offerte, klantpedagogie, traceerbaarheid van uitleg.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 6: Voorschot en reserveringen</h2>
        <p className="text-muted-foreground">
          6.1 Het Klantenvoorschot van 25 EUR wordt geïnd overeenkomstig de aan de Klant gecommuniceerde regels.
        </p>
        <p className="text-muted-foreground">6.2 De Garage erkent de volgende mechanismen:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>annulering &gt; 12u: automatische terugbetaling;</li>
          <li>
            annulering tussen 12u en 1u: rechtstreekse afhandeling Klant/Garage; de Garage kan ook, met akkoord van de Klant,
            een annulering registreren vanuit zijn PitStop-omgeving die leidt tot terugbetaling voor zover de betaaltools dit
            toelaten;
          </li>
          <li>annulering &lt; 1u: voorschot behouden;</li>
          <li>no-show (≥15 min zonder bericht): voorschot behouden;</li>
          <li>vertraging &gt;15 min met bericht: voorschot behouden; ingreep mogelijk naar goeddunken van de Garage.</li>
        </ul>
        <p className="text-muted-foreground">
          6.3 De Garage kan het behoud van het voorschot rechtvaardigen wanneer reële voorbereidingskosten zijn gemaakt.
        </p>
        <p className="text-muted-foreground">
          6.4 Reservering met meerdere garages: de Klant kiest een Garage op het platform; het voorschot wordt aan die Garage
          toegewezen in de interne opvolging van PitStop.
        </p>
        <p className="text-muted-foreground">
          6.5 Bewaring en geen Stripe Connect: het voorschot wordt geïnd via de betaaldienstverlener van de Klant; PitStop houdt
          een opvolging in de databank aan voor manuele uitbetaling naar de professionele IBAN van de Garage, zonder Stripe
          Connect ten behoeve van de Garage. Een minimale termijn na het geplande einde van de afspraak kan vereist zijn voordat
          de Garage een uitbetaling kan aanvragen.
        </p>
        <p className="text-muted-foreground">
          6.6 Uitbetalingsaanvragen: de Garage kan een aanvraag indienen vanuit zijn professionele omgeving volgens de getoonde
          statussen; de PitStop-beheerder bevestigt de bankoverschrijving en kan een referentie registreren. Bij annulering of
          terugbetaling aan de Klant in overeenstemming met de B2C-AV wordt de overeenkomstige uitbetalingslijn geannuleerd of
          dienovereenkomstig aangepast.
        </p>
        <p className="text-muted-foreground">
          6.7 Beschikbaarheid: de Garage beheert tijdssloten, uitzonderlijke sluitingen en blokkeringen in zijn omgeving; aan de
          Klant aangeboden slots worden afgeleid van gegevens op het platform (geen verplichte Google Agenda-synchronisatie per
          garage).
        </p>
        <p className="text-muted-foreground">
          6.8 Openingsuren: elke wezenlijke wijzigingsaanvraag verloopt via het voorziene formulier; PitStop (administratie) kan
          de aanvraag moeten goedkeuren voordat ze op het openbare profiel van de Garage geldt.
        </p>
        <p className="text-muted-foreground">
          6.9 Medewerkersaccounts: de Garage kan collega&apos;s per e-mail uitnodigen; toegang als « garagist » wordt geactiveerd
          na aanvaarding van de uitnodiging en onder voorbehoud van de instellingen van de Garage en deze B2B APV.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 7: Verplichtingen van de partnergarage</h2>
        <p className="text-muted-foreground">De Garage verbindt zich ertoe:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>over de nodige vergunningen, verzekeringen en competenties te beschikken;</li>
          <li>PitStop-klanten zorgvuldig en professioneel te behandelen;</li>
          <li>afspraakvensters te respecteren en snel te informeren bij onvoorziene omstandigheden;</li>
          <li>nuttige informatie actueel te houden (uren, beschikbaarheid, soorten diensten);</li>
          <li>misleidende of misbruikende praktijken te vermijden.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 8: Verplichtingen van PitStop</h2>
        <p className="text-muted-foreground">PitStop verbindt zich ertoe:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>redelijke exploitatie van het platform te waarborgen;</li>
          <li>nuttige informatie aan de Garage door te geven;</li>
          <li>goede kwalificatie van aanvragen te bevorderen;</li>
          <li>een transparant kader te handhaven in de driehoeksverhouding Klant–PitStop–Garage.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 9: Persoonsgegevens en vertrouwelijkheid</h2>
        <p className="text-muted-foreground">
          9.1 Elke partij handelt in overeenstemming met de AVG en de toepasselijke Belgische wetgeving.
          <br />
          9.2 Gegevens ontvangen via PitStop mogen door de Garage uitsluitend worden gebruikt voor de uitvoering van de overeengekomen
          diensten.
          <br />
          9.3 De partijen verbinden zich ertoe de vertrouwelijkheid van uitgewisselde commerciële, technische en klantinformatie te
          bewaren.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 10: Intellectuele eigendom</h2>
        <p className="text-muted-foreground">
          10.1 PitStop behoudt alle rechten op het platform, merken, interfaces, inhoud, tools, databanken en onderscheidende
          elementen.
          <br />
          10.2 De Garage onthoudt zich van elke reproductie, extractie of niet-geautoriseerd gebruik van PitStop-bezittingen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 11: Aansprakelijkheid</h2>
        <p className="text-muted-foreground">
          11.1 Elke partij is aansprakelijk voor eigen fouten en tekortkomingen.
          <br />
          11.2 PitStop is niet aansprakelijk voor slechte uitvoering van mechanisch werk door de Garage.
          <br />
          11.3 De Garage is niet aansprakelijk voor technische onbeschikbaarheid die uitsluitend aan PitStop kan worden toegeschreven,
          tenzij fout van de Garage bij gebruik van de tools wordt bewezen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 12: Fraude, misbruik, imagoschade</h2>
        <p className="text-muted-foreground">
          Bij fraude, misleidende handelspraktijken, schade aan het imago van PitStop, ernstige niet-nakoming of oneerlijk gedrag kan
          PitStop het partnerschap schorsen of beëindigen, onverminderd eventuele schadevergoeding.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 13: Duur, schorsing en beëindiging</h2>
        <p className="text-muted-foreground">
          13.1 Het partnerschap vangt aan op de datum van contractuele aanvaarding.
          <br />
          13.2 Het kan worden geschorst/beëindigd bij ernstige of herhaalde inbreuk, na kennisgeving, behalve bij urgentie of bijzondere
          ernst die onmiddellijke ingreep rechtvaardigt.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 14: Elektronisch bewijs</h2>
        <p className="text-muted-foreground">
          Elektronische uitwisselingen, technische logboeken, tijdstempels, bevestigingen en computerregistraties vormen bewijs dat
          tussen partijen kan worden gebruikt tot het tegendeel is bewezen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 15: Overmacht</h2>
        <p className="text-muted-foreground">
          Geen partij is aansprakelijk voor vertraging of niet-nakoming door overmacht in de zin van het Belgische recht.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 16: Gedeeltelijke nietigheid en geen verzaking</h2>
        <p className="text-muted-foreground">
          16.1 Nietigheid van één bepaling tast de geldigheid van de andere niet aan.
          <br />
          16.2 Het uitblijven van onmiddellijke handhaving van een recht door een partij houdt geen verzaking in.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 17: Overdracht</h2>
        <p className="text-muted-foreground">
          De Garage mag al zijn rechten/verplichtingen uit deze voorwaarden niet overdragen zonder voorafgaande schriftelijke
          toestemming van PitStop.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 18: Wijziging van de B2B APV</h2>
        <p className="text-muted-foreground">
          PitStop kan de B2B APV te allen tijde wijzigen. Nieuwe versies worden aan de Garage meegedeeld en zijn van toepassing volgens
          de overeengekomen contractuele modaliteiten.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 19: Toepasselijk recht en geschillen</h2>
        <p className="text-muted-foreground">
          19.1 De B2B APV zijn onderworpen aan het Belgische recht.
          <br />
          19.2 Geschillen vallen onder de bevoegdheid van de rechtbanken van Nijvel, tenzij dwingend recht anders bepaalt.
        </p>
      </section>

      <div className="pt-2">
        <Link href="/" className="text-primary hover:underline">
          Terug naar de startpagina
        </Link>
      </div>
    </div>
  )
}
