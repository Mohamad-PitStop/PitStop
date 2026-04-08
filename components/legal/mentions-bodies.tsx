import Link from "next/link"

/** Contenu principal (sans navbar) — mentions légales. */
export function MentionsBodyFr() {
  return (
    <div className="container mx-auto max-w-4xl px-4 space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Mentions légales</h1>
        <p className="text-muted-foreground">
          PitStop : Service de diagnostic automobile assisté par IA
          <br />
          Dernière mise à jour : 26 mars 2026
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">1. Éditeur du service</h2>
        <p className="text-muted-foreground">
          Le service PitStop est édité et exploité à titre personnel par :
          <br />
          Nom : Mohamad ALI AHMAD
          <br />
          Adresse : Braine-l&apos;Alleud, Belgique
          <br />
          Contact :{" "}
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
          </a>
          <br />
          Statut : Personne physique : activité exercée en nom propre.
        </p>
        <p className="text-muted-foreground">
          PitStop est actuellement en phase de test restreinte. Aucune structure commerciale ou juridique (société,
          entreprise individuelle enregistrée) n&apos;est constituée à ce stade. En conséquence, PitStop ne dispose
          d&apos;aucun numéro de TVA ni de numéro BCE (Banque-Carrefour des Entreprises) belge. Ces informations seront
          communiquées lors du passage en exploitation commerciale officielle.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">2. Hébergement</h2>
        <p className="text-muted-foreground">
          Le service PitStop est hébergé par :
          <br />
          Vercel Inc.
          <br />
          440 N Barranca Ave #4133, Covina, CA 91723, États-Unis
          <br />
          Site web :{" "}
          <a className="text-primary hover:underline" href="https://vercel.com" target="_blank" rel="noreferrer">
            https://vercel.com
          </a>
        </p>
        <p className="text-muted-foreground">
          Note : le domaine définitif n&apos;est pas encore attribué. Cette mention sera mise à jour lors du passage en
          production officielle.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">3. Nature du service</h2>
        <p className="text-muted-foreground">
          PitStop est un outil d&apos;aide au diagnostic automobile utilisant l&apos;intelligence artificielle (modèle
          de langage fourni par Anthropic, Inc.). Il permet à l&apos;utilisateur d&apos;obtenir des informations
          indicatives sur d&apos;éventuelles pannes ou défaillances de son véhicule, sur la base des données qu&apos;il
          fournit.
        </p>
        <p className="text-muted-foreground">
          Les résultats générés par PitStop sont fournis à titre informatif uniquement. Ils ne constituent pas un avis
          technique professionnel certifié ni une garantie de réparation.
        </p>
        <p className="text-muted-foreground">
          Un avertissement explicite à ce sujet est affiché dans l&apos;interface du service.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">4. Propriété intellectuelle</h2>
        <p className="text-muted-foreground">
          L&apos;ensemble des éléments constituant le service PitStop (nom, interface, code, logo, textes) est la
          propriété exclusive de son éditeur, sauf mention contraire. Toute reproduction, représentation ou
          exploitation, totale ou partielle, sans autorisation préalable écrite est interdite.
        </p>
        <p className="text-muted-foreground">
          Les réponses générées par l&apos;intelligence artificielle sont produites dynamiquement et ne constituent pas
          des œuvres protégées au sens du droit d&apos;auteur belge.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">5. Limitation de responsabilité</h2>
        <p className="text-muted-foreground">
          L&apos;éditeur s&apos;engage à faire ses meilleurs efforts pour assurer la disponibilité et la fiabilité du
          service. Toutefois, PitStop étant en phase bêta, des interruptions, erreurs ou inexactitudes peuvent survenir.
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>dommages directs ou indirects résultant de l&apos;utilisation des diagnostics générés ;</li>
          <li>interruptions de service ou pertes de données ;</li>
          <li>décisions de réparation prises sur la base des résultats fournis par le service.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">6. Droit applicable et juridiction</h2>
        <p className="text-muted-foreground">
          Les présentes mentions légales sont régies par le droit belge. En cas de litige, et à défaut de résolution
          amiable, les tribunaux compétents de l&apos;arrondissement judiciaire de Nivelles (Brabant wallon) seront seuls
          compétents.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">7. Contact</h2>
        <p className="text-muted-foreground">
          Pour toute question relative au service ou aux présentes mentions légales, contactez l&apos;éditeur à
          l&apos;adresse suivante :{" "}
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
          </a>
        </p>
        <p className="text-sm text-muted-foreground">Document rédigé en date du 26 mars 2026.</p>
      </section>

      <div className="pt-2">
        <Link href="/" className="text-primary hover:underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}

export function MentionsBodyEn() {
  return (
    <div className="container mx-auto max-w-4xl px-4 space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Legal notice</h1>
        <p className="text-muted-foreground">
          PitStop: AI-assisted automotive diagnostic service
          <br />
          Last updated: 26 March 2026
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">1. Publisher of the service</h2>
        <p className="text-muted-foreground">
          The PitStop service is published and operated on a personal basis by:
          <br />
          Name: Mohamad ALI AHMAD
          <br />
          Address: Braine-l&apos;Alleud, Belgium
          <br />
          Contact:{" "}
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
          </a>
          <br />
          Status: Natural person operating in own name.
        </p>
        <p className="text-muted-foreground">
          PitStop is currently in a restricted testing phase. No commercial or legal entity (company, registered sole
          trader) has been formed at this stage. Consequently, PitStop does not have a Belgian VAT number or a CBE
          (Crossroads Bank for Enterprises) number. This information will be provided when the service moves to official
          commercial operation.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">2. Hosting</h2>
        <p className="text-muted-foreground">
          The PitStop service is hosted by:
          <br />
          Vercel Inc.
          <br />
          440 N Barranca Ave #4133, Covina, CA 91723, United States
          <br />
          Website:{" "}
          <a className="text-primary hover:underline" href="https://vercel.com" target="_blank" rel="noreferrer">
            https://vercel.com
          </a>
        </p>
        <p className="text-muted-foreground">
          Note: the definitive domain name is not yet assigned. This notice will be updated when the service goes into
          official production.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">3. Nature of the service</h2>
        <p className="text-muted-foreground">
          PitStop is a tool to assist with automotive diagnostics using artificial intelligence (a language model
          provided by Anthropic, Inc.). It allows users to obtain indicative information on possible faults or failures of
          their vehicle, based on the data they provide.
        </p>
        <p className="text-muted-foreground">
          Results generated by PitStop are provided for information only. They do not constitute certified professional
          technical advice or a guarantee of repair.
        </p>
        <p className="text-muted-foreground">An explicit warning to this effect is shown in the service interface.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">4. Intellectual property</h2>
        <p className="text-muted-foreground">
          All elements making up the PitStop service (name, interface, code, logo, texts) are the exclusive property of
          the publisher unless otherwise stated. Any reproduction, representation or use, in whole or in part, without
          prior written permission is prohibited.
        </p>
        <p className="text-muted-foreground">
          AI-generated responses are produced dynamically and do not constitute protected works within the meaning of
          Belgian copyright law.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">5. Limitation of liability</h2>
        <p className="text-muted-foreground">
          The publisher undertakes to use its best efforts to ensure availability and reliability of the service.
          However, as PitStop is in beta, interruptions, errors or inaccuracies may occur.
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>direct or indirect damage resulting from use of generated diagnostics;</li>
          <li>service interruptions or data loss;</li>
          <li>repair decisions taken solely on the basis of results provided by the service.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">6. Applicable law and jurisdiction</h2>
        <p className="text-muted-foreground">
          This legal notice is governed by Belgian law. In the event of a dispute, and failing amicable settlement, the
          courts of the judicial district of Nivelles (Walloon Brabant) shall have exclusive jurisdiction.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">7. Contact</h2>
        <p className="text-muted-foreground">
          For any question about the service or this legal notice, contact the publisher at:{" "}
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
          </a>
        </p>
        <p className="text-sm text-muted-foreground">Document dated 26 March 2026.</p>
      </section>

      <div className="pt-2">
        <Link href="/" className="text-primary hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  )
}

export function MentionsBodyNl() {
  return (
    <div className="container mx-auto max-w-4xl px-4 space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Juridische vermeldingen</h1>
        <p className="text-muted-foreground">
          PitStop: AI-ondersteunde automobieldiagnose
          <br />
          Laatst bijgewerkt: 26 maart 2026
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">1. Uitgever van de dienst</h2>
        <p className="text-muted-foreground">
          De dienst PitStop wordt persoonlijk uitgegeven en beheerd door:
          <br />
          Naam: Mohamad ALI AHMAD
          <br />
          Adres: Eigenbrakel, België
          <br />
          Contact:{" "}
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
          </a>
          <br />
          Statuut: Natuurlijke persoon, handelend op eigen naam.
        </p>
        <p className="text-muted-foreground">
          PitStop bevindt zich momenteel in een beperkte testfase. Er is nog geen handels- of rechtsvorm (vennootschap,
          ingeschreven eenmanszaak) opgericht. Bijgevolg beschikt PitStop niet over een Belgisch BTW-nummer of KBO-nummer
          (Kruispuntbank van Ondernemingen). Deze gegevens worden meegedeeld bij de officiële commerciële lancering.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">2. Hosting</h2>
        <p className="text-muted-foreground">
          De dienst PitStop wordt gehost door:
          <br />
          Vercel Inc.
          <br />
          440 N Barranca Ave #4133, Covina, CA 91723, Verenigde Staten
          <br />
          Website:{" "}
          <a className="text-primary hover:underline" href="https://vercel.com" target="_blank" rel="noreferrer">
            https://vercel.com
          </a>
        </p>
        <p className="text-muted-foreground">
          Opmerking: het definitieve domein is nog niet toegewezen. Deze vermelding wordt bijgewerkt bij officiële
          productie.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">3. Aard van de dienst</h2>
        <p className="text-muted-foreground">
          PitStop is een hulpmiddel voor automobieldiagnose met kunstmatige intelligentie (taalmodel van Anthropic, Inc.).
          Het stelt gebruikers in staat indicatieve informatie te krijgen over mogelijke defecten aan hun voertuig,
          op basis van door hen verstrekte gegevens.
        </p>
        <p className="text-muted-foreground">
          Door PitStop gegenereerde resultaten zijn louter informatief. Ze vormen geen gecertificeerd professioneel
          technisch advies noch een garantie op herstel.
        </p>
        <p className="text-muted-foreground">Een uitdrukkelijke waarschuwing hiertoe wordt in de interface getoond.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">4. Intellectuele eigendom</h2>
        <p className="text-muted-foreground">
          Alle elementen van de dienst PitStop (naam, interface, code, logo, teksten) zijn exclusief eigendom van de
          uitgever, tenzij anders vermeld. Reproductie, voorstelling of exploitatie, geheel of gedeeltelijk, zonder
          voorafgaande schriftelijke toestemming is verboden.
        </p>
        <p className="text-muted-foreground">
          Door AI gegenereerde antwoorden worden dynamisch geproduceerd en vormen geen beschermde werken in de zin van
          het Belgische auteursrecht.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">5. Beperking van aansprakelijkheid</h2>
        <p className="text-muted-foreground">
          De uitgever doet zijn redelijke best om beschikbaarheid en betrouwbaarheid te waarborgen. Omdat PitStop in
          bèta is, kunnen onderbrekingen, fouten of onnauwkeurigheden voorkomen.
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>directe of indirecte schade door gebruik van gegenereerde diagnoses;</li>
          <li>dienstonderbrekingen of gegevensverlies;</li>
          <li>herstelbeslissingen uitsluitend op basis van door de dienst verstrekte resultaten.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">6. Toepasselijk recht en bevoegdheid</h2>
        <p className="text-muted-foreground">
          Deze juridische vermeldingen worden beheerst door het Belgische recht. In geval van geschil en bij gebrek aan
          minnelijke schikking zijn uitsluitend de rechtbanken van het gerechtelijk arrondissement Nijvel (Waals-Brabant)
          bevoegd.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">7. Contact</h2>
        <p className="text-muted-foreground">
          Voor vragen over de dienst of deze vermeldingen:{" "}
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
          </a>
        </p>
        <p className="text-sm text-muted-foreground">Document opgesteld op 26 maart 2026.</p>
      </section>

      <div className="pt-2">
        <Link href="/" className="text-primary hover:underline">
          Terug naar start
        </Link>
      </div>
    </div>
  )
}
