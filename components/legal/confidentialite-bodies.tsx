import Link from "next/link"

export function ConfidentialiteBodyFr() {
  return (
    <div className="container mx-auto max-w-4xl px-4 space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Politique de confidentialité</h1>
        <p className="text-muted-foreground">
          PitStop : Service de diagnostic automobile assisté par IA
          <br />
          Dernière mise à jour : 5 avril 2026
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
        <p className="text-muted-foreground">
          La présente politique décrit la manière dont PitStop collecte, utilise et protège les données à caractère
          personnel de ses utilisateurs, conformément au RGPD (Règlement (UE) 2016/679) et à la législation belge
          applicable.
        </p>
        <p className="text-muted-foreground">
          Responsable du traitement : Mohamad ALI AHMAD, Braine-l&apos;Alleud, Belgique :{" "}
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
          </a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">2. Données collectées</h2>
        <div>
          <h3 className="font-medium text-foreground">2.1 Données de compte</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Adresse e-mail (création/connexion)</li>
            <li>Nom ou prénom renseigné à l&apos;inscription</li>
            <li>Identifiant utilisateur généré automatiquement</li>
            <li>
              Mot de passe stocké exclusivement sous forme de hachage cryptographique (algorithme scrypt) : PitStop ne
              conserve jamais le mot de passe en clair
            </li>
            <li>
              Jetons de session stockés sous forme hachée (SHA-256) dans un cookie HTTP-only sécurisé ; le jeton brut
              n&apos;est jamais persisté en base de données
            </li>
            <li>Solde de crédits de diagnostic associé au compte</li>
            <li>Rôle utilisateur (utilisateur standard, testeur, administrateur)</li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-foreground">2.2 Données liées aux diagnostics</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Informations véhicule saisies (marque, modèle, année, problème)</li>
            <li>Historique des diagnostics réalisés via le service</li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-foreground">2.3 Données de paiement</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Transactions gérées par Stripe, Inc. (PitStop ne stocke pas vos données bancaires)</li>
            <li>
              Politique Stripe :{" "}
              <a className="text-primary hover:underline" href="https://stripe.com/privacy" target="_blank" rel="noreferrer">
                https://stripe.com/privacy
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-foreground">2.4 Données de navigation (cookies et analytics)</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Vercel Analytics (données anonymisées d&apos;usage)</li>
            <li>Cookies techniques nécessaires au fonctionnement</li>
            <li>Refus possible via la bannière de consentement</li>
          </ul>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">3. Finalités du traitement</h2>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Fourniture du service de diagnostic</li>
          <li>Gestion des comptes et authentification</li>
          <li>Traitement des paiements via Stripe</li>
          <li>Amélioration du service (analytics anonymisés)</li>
          <li>Communication support et informations importantes</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">4. Sous-traitants et transferts</h2>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>
            <span className="font-medium text-foreground">Turso / ChiselStrike Inc.</span> : base de données relationnelle
            (libSQL, compatible SQLite) hébergeant les comptes utilisateurs, sessions, historiques de diagnostics et
            journaux d&apos;audit. Données stockées sur infrastructure AWS eu-west-1 (Irlande, Union européenne). Politique
            de confidentialité :{" "}
            <a className="text-primary hover:underline" href="https://turso.tech/privacy" target="_blank" rel="noreferrer">
              https://turso.tech/privacy
            </a>
          </li>
          <li>
            <span className="font-medium text-foreground">Anthropic, Inc.</span> : traitement des requêtes de diagnostic par
            intelligence artificielle (modèle Claude). Les données saisies lors d&apos;un diagnostic sont transmises à
            l&apos;API Anthropic pour générer la réponse. Établi aux États-Unis. Politique de confidentialité :{" "}
            <a className="text-primary hover:underline" href="https://www.anthropic.com/privacy" target="_blank" rel="noreferrer">
              https://www.anthropic.com/privacy
            </a>
          </li>
          <li>
            <span className="font-medium text-foreground">Stripe, Inc.</span> : traitement sécurisé des paiements (achat de
            crédits, acomptes de réservation). PitStop ne stocke aucune donnée bancaire. Établi aux États-Unis. Politique de
            confidentialité :{" "}
            <a className="text-primary hover:underline" href="https://stripe.com/privacy" target="_blank" rel="noreferrer">
              https://stripe.com/privacy
            </a>
          </li>
          <li>
            <span className="font-medium text-foreground">Vercel, Inc.</span> : hébergement de l&apos;application web et
            collecte de données analytics anonymisées. Établi aux États-Unis. Politique de confidentialité :{" "}
            <a className="text-primary hover:underline" href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">
              https://vercel.com/legal/privacy-policy
            </a>
          </li>
        </ul>
        <p className="text-muted-foreground">
          Les données hébergées dans la base de données Turso sont stockées au sein de l&apos;Union européenne (Irlande) et
          ne font l&apos;objet d&apos;aucun transfert hors EEE. Les prestataires Anthropic, Stripe et Vercel sont établis hors
          EEE ; les transferts sont encadrés par les clauses contractuelles types de la Commission européenne (CCT) ou par
          des mécanismes de protection équivalents reconnus par le RGPD.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">5. Durée de conservation</h2>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Données de compte : jusqu&apos;à suppression du compte ou 3 ans après dernière activité</li>
          <li>Historique diagnostics : pendant la durée de vie du compte actif</li>
          <li>Données de paiement : selon la politique Stripe</li>
          <li>Données analytics : 26 mois maximum (paramétrage standard Vercel Analytics)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">6. Vos droits</h2>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Droit d&apos;accès</li>
          <li>Droit de rectification</li>
          <li>Droit à l&apos;effacement</li>
          <li>Droit à la portabilité</li>
          <li>Droit d&apos;opposition</li>
          <li>Droit de retrait du consentement (cookies analytics)</li>
        </ul>
        <p className="text-muted-foreground">
          Exercice des droits :{" "}
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
          </a>
          <br />
          APD Belgique :{" "}
          <a
            className="text-primary hover:underline"
            href="https://www.autoriteprotectiondonnees.be"
            target="_blank"
            rel="noreferrer"
          >
            https://www.autoriteprotectiondonnees.be
          </a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">7. Cookies</h2>
        <p className="text-muted-foreground">
          PitStop utilise des cookies strictement nécessaires (non refusables) et des cookies analytics (Vercel Analytics)
          déposés uniquement avec votre consentement explicite.
        </p>
        <p className="text-muted-foreground">
          Vous pouvez modifier vos préférences à tout moment via le bouton « Gérer mes préférences ».
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">8. Sécurité</h2>
        <p className="text-muted-foreground">
          PitStop met en œuvre des mesures techniques appropriées pour protéger les données personnelles :
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Chiffrement des communications en transit (HTTPS/TLS)</li>
          <li>Hachage des mots de passe par l&apos;algorithme scrypt : aucun mot de passe n&apos;est stocké en clair</li>
          <li>
            Jetons de session hachés (SHA-256) et transmis exclusivement via cookies HTTP-only, empêchant leur accès par
            JavaScript
          </li>
          <li>Accès restreint à la base de données Turso via token d&apos;authentification sécurisé</li>
          <li>Clés API (Stripe, Anthropic) gérées exclusivement comme variables d&apos;environnement côté serveur</li>
          <li>Journalisation des opérations administratives sensibles (octroi de crédits, modifications de rôles)</li>
        </ul>
        <p className="text-muted-foreground">
          Aucun système d&apos;information n&apos;offre une sécurité absolue. En cas de violation de données susceptible
          d&apos;engendrer un risque pour vos droits et libertés, PitStop s&apos;engage à notifier l&apos;Autorité de
          protection des données (APD) belge dans les délais prévus par le RGPD.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">9. Mises à jour</h2>
        <p className="text-muted-foreground">
          Cette politique peut être mise à jour selon l&apos;évolution du service et de la structure juridique. En cas de
          modification substantielle, les utilisateurs enregistrés seront informés.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">10. Contact</h2>
        <p className="text-muted-foreground">
          Pour toute question relative à cette politique :
          <br />
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
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

export function ConfidentialiteBodyEn() {
  return (
    <div className="container mx-auto max-w-4xl px-4 space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Privacy policy</h1>
        <p className="text-muted-foreground">
          PitStop: AI-assisted automotive diagnostic service
          <br />
          Last updated: 5 April 2026
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
        <p className="text-muted-foreground">
          This policy describes how PitStop collects, uses and protects users&apos; personal data, in accordance with the
          GDPR (Regulation (EU) 2016/679) and applicable Belgian law.
        </p>
        <p className="text-muted-foreground">
          Data controller: Mohamad ALI AHMAD, Braine-l&apos;Alleud, Belgium:{" "}
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
          </a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">2. Data collected</h2>
        <div>
          <h3 className="font-medium text-foreground">2.1 Account data</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Email address (sign-up/sign-in)</li>
            <li>Name or first name provided at registration</li>
            <li>Automatically generated user identifier</li>
            <li>
              Password stored only as a cryptographic hash (scrypt algorithm): PitStop never stores the password in
              plain text
            </li>
            <li>
              Session tokens stored in hashed form (SHA-256) in a secure HTTP-only cookie; the raw token is never persisted
              in the database
            </li>
            <li>Diagnostic credit balance linked to the account</li>
            <li>User role (standard user, tester, administrator)</li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-foreground">2.2 Data related to diagnostics</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Vehicle information entered (make, model, year, issue)</li>
            <li>History of diagnostics performed through the service</li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-foreground">2.3 Payment data</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Transactions processed by Stripe, Inc. (PitStop does not store your bank details)</li>
            <li>
              Stripe policy:{" "}
              <a className="text-primary hover:underline" href="https://stripe.com/privacy" target="_blank" rel="noreferrer">
                https://stripe.com/privacy
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-foreground">2.4 Browsing data (cookies and analytics)</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Vercel Analytics (anonymised usage data)</li>
            <li>Technical cookies required for operation</li>
            <li>Refusal possible via the consent banner</li>
          </ul>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">3. Purposes of processing</h2>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Provision of the diagnostic service</li>
          <li>Account management and authentication</li>
          <li>Payment processing via Stripe</li>
          <li>Service improvement (anonymised analytics)</li>
          <li>Support communications and important notices</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">4. Processors and transfers</h2>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>
            <span className="font-medium text-foreground">Turso / ChiselStrike Inc.</span>: relational database (libSQL,
            SQLite-compatible) hosting user accounts, sessions, diagnostic histories and audit logs. Data stored on AWS
            eu-west-1 infrastructure (Ireland, European Union). Privacy policy:{" "}
            <a className="text-primary hover:underline" href="https://turso.tech/privacy" target="_blank" rel="noreferrer">
              https://turso.tech/privacy
            </a>
          </li>
          <li>
            <span className="font-medium text-foreground">Anthropic, Inc.</span>: processing of diagnostic requests by
            artificial intelligence (Claude model). Data entered during a diagnostic is sent to the Anthropic API to
            generate the response. Based in the United States. Privacy policy:{" "}
            <a className="text-primary hover:underline" href="https://www.anthropic.com/privacy" target="_blank" rel="noreferrer">
              https://www.anthropic.com/privacy
            </a>
          </li>
          <li>
            <span className="font-medium text-foreground">Stripe, Inc.</span>: secure processing of payments (credit
            purchases, booking deposits). PitStop does not store any bank details. Based in the United States. Privacy
            policy:{" "}
            <a className="text-primary hover:underline" href="https://stripe.com/privacy" target="_blank" rel="noreferrer">
              https://stripe.com/privacy
            </a>
          </li>
          <li>
            <span className="font-medium text-foreground">Vercel, Inc.</span>: hosting of the web application and
            collection of anonymised analytics data. Based in the United States. Privacy policy:{" "}
            <a className="text-primary hover:underline" href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">
              https://vercel.com/legal/privacy-policy
            </a>
          </li>
        </ul>
        <p className="text-muted-foreground">
          Data hosted in the Turso database is stored within the European Union (Ireland) and is not transferred outside the
          EEA. Anthropic, Stripe and Vercel are established outside the EEA; transfers are governed by the European
          Commission&apos;s standard contractual clauses (SCCs) or equivalent safeguards recognised under the GDPR.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">5. Retention period</h2>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Account data: until account deletion or 3 years after last activity</li>
          <li>Diagnostic history: for the lifetime of the active account</li>
          <li>Payment data: in accordance with Stripe&apos;s policy</li>
          <li>Analytics data: 26 months maximum (standard Vercel Analytics setting)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">6. Your rights</h2>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Right of access</li>
          <li>Right to rectification</li>
          <li>Right to erasure</li>
          <li>Right to data portability</li>
          <li>Right to object</li>
          <li>Right to withdraw consent (analytics cookies)</li>
        </ul>
        <p className="text-muted-foreground">
          To exercise your rights:{" "}
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
          </a>
          <br />
          Belgian Data Protection Authority (GBA):{" "}
          <a
            className="text-primary hover:underline"
            href="https://www.autoriteprotectiondonnees.be"
            target="_blank"
            rel="noreferrer"
          >
            https://www.autoriteprotectiondonnees.be
          </a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">7. Cookies</h2>
        <p className="text-muted-foreground">
          PitStop uses strictly necessary cookies (which cannot be refused) and analytics cookies (Vercel Analytics) placed
          only with your explicit consent.
        </p>
        <p className="text-muted-foreground">You may change your preferences at any time via the “Manage my preferences” button.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">8. Security</h2>
        <p className="text-muted-foreground">
          PitStop implements appropriate technical measures to protect personal data:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Encryption of communications in transit (HTTPS/TLS)</li>
          <li>Password hashing using the scrypt algorithm: no password is stored in plain text</li>
          <li>Hashed session tokens (SHA-256) transmitted only via HTTP-only cookies, preventing access from JavaScript</li>
          <li>Restricted access to the Turso database via a secure authentication token</li>
          <li>API keys (Stripe, Anthropic) managed exclusively as server-side environment variables</li>
          <li>Logging of sensitive administrative operations (credit grants, role changes)</li>
        </ul>
        <p className="text-muted-foreground">
          No information system offers absolute security. In the event of a personal data breach likely to pose a risk to
          your rights and freedoms, PitStop undertakes to notify the Belgian Data Protection Authority within the timeframes
          provided for by the GDPR.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">9. Updates</h2>
        <p className="text-muted-foreground">
          This policy may be updated as the service and legal structure evolve. In the event of a material change,
          registered users will be informed.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">10. Contact</h2>
        <p className="text-muted-foreground">
          For any questions about this policy:
          <br />
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
          </a>
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

export function ConfidentialiteBodyNl() {
  return (
    <div className="container mx-auto max-w-4xl px-4 space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Privacybeleid</h1>
        <p className="text-muted-foreground">
          PitStop: AI-ondersteunde automobieldiagnosedienst
          <br />
          Laatst bijgewerkt: 5 april 2026
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">1. Inleiding</h2>
        <p className="text-muted-foreground">
          Dit beleid beschrijft hoe PitStop persoonsgegevens van gebruikers verzamelt, gebruikt en beschermt, in overeenstemming
          met de AVG (Verordening (EU) 2016/679) en de toepasselijke Belgische wetgeving.
        </p>
        <p className="text-muted-foreground">
          Verwerkingsverantwoordelijke: Mohamad ALI AHMAD, Braine-l&apos;Alleud, België:{" "}
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
          </a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">2. Verzamelde gegevens</h2>
        <div>
          <h3 className="font-medium text-foreground">2.1 Accountgegevens</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>E-mailadres (registratie/aanmelding)</li>
            <li>Naam of voornaam opgegeven bij registratie</li>
            <li>Automatisch gegenereerde gebruikersidentificatie</li>
            <li>
              Wachtwoord uitsluitend opgeslagen als cryptografische hash (scrypt-algoritme): PitStop bewaart het wachtwoord
              nooit in leesbare vorm
            </li>
            <li>
              Sessietokens opgeslagen in gehashte vorm (SHA-256) in een beveiligde HTTP-only cookie; de ruwe token wordt nooit
              in de database bewaard
            </li>
            <li>Saldo diagnostische credits gekoppeld aan het account</li>
            <li>Gebruikersrol (standaardgebruiker, tester, beheerder)</li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-foreground">2.2 Gegevens met betrekking tot diagnoses</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Ingevoerde voertuiggegevens (merk, model, jaar, probleem)</li>
            <li>Geschiedenis van via de dienst uitgevoerde diagnoses</li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-foreground">2.3 Betalingsgegevens</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Transacties verwerkt door Stripe, Inc. (PitStop slaat uw bankgegevens niet op)</li>
            <li>
              Stripe-beleid:{" "}
              <a className="text-primary hover:underline" href="https://stripe.com/privacy" target="_blank" rel="noreferrer">
                https://stripe.com/privacy
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-foreground">2.4 Surfgegevens (cookies en analytics)</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Vercel Analytics (geanonimiseerde gebruiksgegevens)</li>
            <li>Technische cookies die nodig zijn voor de werking</li>
            <li>Weigering mogelijk via de toestemmingsbanner</li>
          </ul>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">3. Doeleinden van de verwerking</h2>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Levering van de diagnosedienst</li>
          <li>Beheer van accounts en authenticatie</li>
          <li>Verwerking van betalingen via Stripe</li>
          <li>Verbetering van de dienst (geanonimiseerde analytics)</li>
          <li>Supportcommunicatie en belangrijke informatie</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">4. Verwerkers en doorgiften</h2>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>
            <span className="font-medium text-foreground">Turso / ChiselStrike Inc.</span>: relationele database (libSQL,
            SQLite-compatibel) die gebruikersaccounts, sessies, diagnostische geschiedenissen en auditlogboeken host.
            Gegevens opgeslagen op AWS eu-west-1-infrastructuur (Ierland, Europese Unie). Privacybeleid:{" "}
            <a className="text-primary hover:underline" href="https://turso.tech/privacy" target="_blank" rel="noreferrer">
              https://turso.tech/privacy
            </a>
          </li>
          <li>
            <span className="font-medium text-foreground">Anthropic, Inc.</span>: verwerking van diagnostische verzoeken door
            kunstmatige intelligentie (Claude-model). Bij een diagnose worden de ingevoerde gegevens naar de Anthropic-API
            gestuurd om het antwoord te genereren. Gevestigd in de Verenigde Staten. Privacybeleid:{" "}
            <a className="text-primary hover:underline" href="https://www.anthropic.com/privacy" target="_blank" rel="noreferrer">
              https://www.anthropic.com/privacy
            </a>
          </li>
          <li>
            <span className="font-medium text-foreground">Stripe, Inc.</span>: veilige verwerking van betalingen (aankoop van
            credits, reserveringsaanbetalingen). PitStop slaat geen bankgegevens op. Gevestigd in de Verenigde Staten.
            Privacybeleid:{" "}
            <a className="text-primary hover:underline" href="https://stripe.com/privacy" target="_blank" rel="noreferrer">
              https://stripe.com/privacy
            </a>
          </li>
          <li>
            <span className="font-medium text-foreground">Vercel, Inc.</span>: hosting van de webapplicatie en verzameling van
            geanonimiseerde analytics. Gevestigd in de Verenigde Staten. Privacybeleid:{" "}
            <a className="text-primary hover:underline" href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">
              https://vercel.com/legal/privacy-policy
            </a>
          </li>
        </ul>
        <p className="text-muted-foreground">
          Gegevens in de Turso-database worden binnen de Europese Unie (Ierland) opgeslagen en worden niet buiten de EER
          overgedragen. Anthropic, Stripe en Vercel zijn buiten de EER gevestigd; doorgiften vallen onder de standaard
          contractbepalingen van de Europese Commissie of gelijkwaardige waarborgen die onder de AVG worden erkend.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">5. Bewaartermijn</h2>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Accountgegevens: tot verwijdering van het account of 3 jaar na de laatste activiteit</li>
          <li>Diagnostische geschiedenis: gedurende de levensduur van het actieve account</li>
          <li>Betalingsgegevens: volgens het Stripe-beleid</li>
          <li>Analytics-gegevens: maximaal 26 maanden (standaardinstelling Vercel Analytics)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">6. Uw rechten</h2>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Recht op inzage</li>
          <li>Recht op rectificatie</li>
          <li>Recht op gegevenswissing</li>
          <li>Recht op gegevensoverdraagbaarheid</li>
          <li>Recht van bezwaar</li>
          <li>Recht om toestemming in te trekken (analytics-cookies)</li>
        </ul>
        <p className="text-muted-foreground">
          Uitoefening van rechten:{" "}
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
          </a>
          <br />
          Gegevensbeschermingsautoriteit België:{" "}
          <a
            className="text-primary hover:underline"
            href="https://www.autoriteprotectiondonnees.be"
            target="_blank"
            rel="noreferrer"
          >
            https://www.autoriteprotectiondonnees.be
          </a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">7. Cookies</h2>
        <p className="text-muted-foreground">
          PitStop gebruikt strikt noodzakelijke cookies (niet te weigeren) en analytics-cookies (Vercel Analytics) die
          uitsluitend met uw uitdrukkelijke toestemming worden geplaatst.
        </p>
        <p className="text-muted-foreground">
          U kunt uw voorkeuren op elk moment wijzigen via de knop « Mijn voorkeuren beheren ».
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">8. Beveiliging</h2>
        <p className="text-muted-foreground">
          PitStop treft passende technische maatregelen om persoonsgegevens te beschermen:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Versleuteling van communicatie onderweg (HTTPS/TLS)</li>
          <li>Wachtwoordhashing met het scrypt-algoritme: geen wachtwoord wordt in leesbare vorm opgeslagen</li>
          <li>
            Gehashte sessietokens (SHA-256) uitsluitend via HTTP-only cookies, zodat JavaScript er geen toegang toe heeft
          </li>
          <li>Beperkte toegang tot de Turso-database via een beveiligde authenticatietoken</li>
          <li>API-sleutels (Stripe, Anthropic) uitsluitend als omgevingsvariabelen aan de serverzijde</li>
          <li>Logboekregistratie van gevoelige administratieve handelingen (toekenning van credits, rolwijzigingen)</li>
        </ul>
        <p className="text-muted-foreground">
          Geen informatiesysteem biedt absolute veiligheid. Bij een inbreuk op persoonsgegevens die waarschijnlijk een risico
          voor uw rechten en vrijheden inhoudt, verbindt PitStop zich ertoe de Belgische Gegevensbeschermingsautoriteit binnen
          de in de AVG bepaalde termijnen te informeren.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">9. Updates</h2>
        <p className="text-muted-foreground">
          Dit beleid kan worden bijgewerkt naarmate de dienst en de juridische structuur evolueren. Bij een wezenlijke
          wijziging worden geregistreerde gebruikers geïnformeerd.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">10. Contact</h2>
        <p className="text-muted-foreground">
          Voor vragen over dit beleid:
          <br />
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
          </a>
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
