import Link from "next/link"

export function PolitiqueIaBodyFr() {
  return (
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
        <h2 className="text-xl font-semibold text-foreground">
          1. Nature du service et qualification juridique du système
        </h2>
        <p className="text-muted-foreground">
          Le service PitStop repose sur un système d&apos;intelligence artificielle (IA) automatisé, alimenté par un
          modèle de langage de grande taille (LLM) fourni par Anthropic, Inc. Ce système analyse les informations
          déclarées par l&apos;utilisateur afin de produire une estimation indicative des causes possibles d&apos;un
          dysfonctionnement automobile et des fourchettes de coûts associées.
        </p>
        <p className="text-muted-foreground">
          Au sens du Règlement (UE) 2024/1689 sur l&apos;intelligence artificielle (AI Act), PitStop agit en qualité de
          déployeur d&apos;un système d&apos;IA à usage général. Les résultats produits constituent des sorties
          automatisées à titre purement informatif et ne sauraient être qualifiés d&apos;avis technique certifié, de
          diagnostic professionnel homologué, ni d&apos;expertise au sens de l&apos;article 962 du Code judiciaire belge.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">2. Limites techniques et épistémiques du système</h2>
        <p className="text-muted-foreground">L&apos;utilisateur reconnaît expressément que :</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>
            le système d&apos;IA ne dispose d&apos;aucune capacité d&apos;inspection physique du véhicule et fonde
            exclusivement son analyse sur les données textuelles déclarées par l&apos;utilisateur ;
          </li>
          <li>
            la qualité, la précision et la pertinence des résultats sont directement fonction de l&apos;exactitude, de
            la complétude et de la fidélité des informations communiquées ;
          </li>
          <li>
            des erreurs, des omissions, des hallucinations ou des approximations peuvent survenir, y compris pour des
            véhicules ou des symptômes courants ;
          </li>
          <li>
            certaines pannes, défauts structurels ou avaries cachées sont, par nature, indétectables sans un examen
            physique réalisé par un professionnel qualifié ;
          </li>
          <li>
            les estimations tarifaires sont fondées sur des référentiels de marché belges et des données historiques ;
            elles ne constituent pas un devis contractuel au sens de l&apos;article 1583 du Code civil belge.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">3. Absence de garantie : clause de non-responsabilité</h2>
        <p className="text-muted-foreground">
          PitStop ne souscrit aucune obligation de résultat quant à l&apos;exactitude des diagnostics générés. En
          particulier, PitStop ne garantit pas :
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>l&apos;exactitude, la complétude ou la fiabilité des estimations produites par le système d&apos;IA ;</li>
          <li>l&apos;exhaustivité de l&apos;identification des causes ou des pièces concernées ;</li>
          <li>
            l&apos;adéquation des fourchettes tarifaires avec les conditions réelles du marché local au moment de
            l&apos;intervention ;
          </li>
          <li>l&apos;absence d&apos;erreur, de biais ou d&apos;omission dans les réponses générées.</li>
        </ul>
        <p className="text-muted-foreground">
          La responsabilité de PitStop est limitée à une obligation de moyens dans la mise à disposition du service
          numérique, conformément à l&apos;article 5:71 du nouveau Code civil belge.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">4. Obligation de vérification à charge de l&apos;utilisateur</h2>
        <p className="text-muted-foreground">
          L&apos;utilisateur reconnaît et accepte expressément que toute information fournie par le service PitStop doit
          obligatoirement être soumise à la vérification d&apos;un professionnel qualifié avant toute décision
          d&apos;intervention, d&apos;achat de pièces ou d&apos;engagement contractuel avec un garage.
        </p>
        <p className="text-muted-foreground">L&apos;utilisateur s&apos;engage à :</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>
            ne pas prendre de décision technique, financière ou de sécurité critique sur la seule base des résultats
            fournis par le système d&apos;IA ;
          </li>
          <li>consulter un garagiste agréé pour tout diagnostic définitif ;</li>
          <li>
            informer le garage partenaire de tout écart constaté entre l&apos;estimation PitStop et la réalité constatée
            lors de l&apos;inspection physique.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">5. Traitement des données personnelles par le système d&apos;IA</h2>
        <p className="text-muted-foreground">
          Les données saisies par l&apos;utilisateur lors d&apos;un diagnostic (description du symptôme, informations du
          véhicule) sont transmises à l&apos;API d&apos;Anthropic, Inc. aux fins de génération de la réponse. Ce
          traitement est encadré par la{" "}
          <Link href="/confidentialite" className="text-primary hover:underline">
            Politique de confidentialité
          </Link>{" "}
          de PitStop et les conditions d&apos;utilisation d&apos;Anthropic. PitStop ne conserve pas les échanges bruts
          transmis au modèle au-delà de ce qui est strictement nécessaire au service.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">6. Usage raisonnable et interdictions</h2>
        <p className="text-muted-foreground">Est strictement interdite toute utilisation du service à des fins :</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>
            de tests automatisés massifs ou de sollicitations répétées à caractère abusif (scraping, stress testing) ;
          </li>
          <li>
            d&apos;extraction, de reproduction ou d&apos;exploitation commerciale des réponses générées sans
            autorisation préalable écrite de PitStop ;
          </li>
          <li>
            de contournement des mécanismes de sécurité ou des limites d&apos;usage fixées par PitStop ou par Anthropic ;
          </li>
          <li>
            contraires à la législation belge applicable, notamment en matière de protection des données (RGPD) et de
            droit de la consommation.
          </li>
        </ul>
        <p className="text-muted-foreground">
          Toute violation de ces interdictions peut entraîner la suspension immédiate de l&apos;accès au service, sans
          préjudice de toute action en responsabilité.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">7. Évolution du système d&apos;IA et du service</h2>
        <p className="text-muted-foreground">
          PitStop se réserve le droit de modifier à tout moment, sans préavis ni indemnité :
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>le modèle d&apos;IA sous-jacent, son fournisseur ou sa version ;</li>
          <li>les paramètres, instructions et contraintes appliqués au système (system prompt) ;</li>
          <li>les fonctionnalités exposées à l&apos;utilisateur ;</li>
          <li>les conditions d&apos;accès au service.</li>
        </ul>
        <p className="text-muted-foreground">
          Les modifications substantielles affectant les droits des utilisateurs feront l&apos;objet d&apos;une
          information préalable sur la plateforme.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">8. Droit applicable</h2>
        <p className="text-muted-foreground">
          Les présentes clauses sont soumises au droit belge. Tout litige relatif à leur interprétation ou à leur
          exécution relève de la compétence exclusive des juridictions de l&apos;arrondissement de Nivelles, sous réserve
          des règles impératives de protection du consommateur applicables en Belgique.
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

export function PolitiqueIaBodyEn() {
  return (
    <div className="container mx-auto max-w-4xl px-4 space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">AI policy</h1>
        <p className="text-muted-foreground">
          PitStop: AI-assisted automotive diagnostic service
          <br />
          Version 1.1 — Last updated: 2 April 2026
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">1. Nature of the service and legal classification</h2>
        <p className="text-muted-foreground">
          PitStop relies on an automated artificial intelligence (AI) system powered by a large language model (LLM)
          provided by Anthropic, Inc. The system analyses information supplied by the user to produce indicative
          estimates of possible causes of a vehicle fault and related cost ranges.
        </p>
        <p className="text-muted-foreground">
          Within the meaning of Regulation (EU) 2024/1689 (AI Act), PitStop acts as deployer of a general-purpose AI
          system. Outputs are automated and purely informative; they must not be treated as certified technical advice,
          approved professional diagnosis, or expert evidence within the meaning of Article 962 of the Belgian Judicial
          Code.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">2. Technical and epistemic limits</h2>
        <p className="text-muted-foreground">The user expressly acknowledges that:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>the AI system cannot physically inspect the vehicle and relies solely on text data provided by the user;</li>
          <li>quality, accuracy and relevance depend directly on the correctness, completeness and truthfulness of that data;</li>
          <li>errors, omissions, hallucinations or approximations may occur, including for common vehicles or symptoms;</li>
          <li>
            some faults, structural damage or hidden defects cannot, by nature, be detected without a physical
            examination by a qualified professional;
          </li>
          <li>
            price estimates are based on Belgian market references and historical data; they do not constitute a binding
            quote within the meaning of Article 1583 of the Belgian Civil Code.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">3. No warranty; disclaimer</h2>
        <p className="text-muted-foreground">
          PitStop does not warrant the accuracy of generated diagnostics. In particular, PitStop does not guarantee:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>the accuracy, completeness or reliability of AI-generated estimates;</li>
          <li>exhaustive identification of causes or parts;</li>
          <li>that price ranges match real local market conditions at the time of repair;</li>
          <li>freedom from error, bias or omission in generated answers.</li>
        </ul>
        <p className="text-muted-foreground">
          PitStop&apos;s liability is limited to an obligation of means in providing the digital service, in accordance
          with Article 5:71 of the new Belgian Civil Code.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">4. User duty to verify</h2>
        <p className="text-muted-foreground">
          The user expressly agrees that any information from PitStop must be verified by a qualified professional
          before any repair decision, parts purchase or contractual commitment with a garage.
        </p>
        <p className="text-muted-foreground">The user undertakes to:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>not base critical technical, financial or safety decisions solely on AI outputs;</li>
          <li>consult an approved mechanic for any definitive diagnosis;</li>
          <li>
            inform the partner garage of any material gap between the PitStop estimate and findings at physical
            inspection.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">5. Personal data processing by the AI system</h2>
        <p className="text-muted-foreground">
          Data entered during a diagnostic (symptom description, vehicle information) is sent to Anthropic, Inc.&apos;s
          API to generate the response. Processing is governed by PitStop&apos;s{" "}
          <Link href="/confidentialite" className="text-primary hover:underline">
            Privacy policy
          </Link>{" "}
          and Anthropic&apos;s terms. PitStop does not retain raw exchanges with the model beyond what is strictly
          necessary for the service.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">6. Fair use and prohibitions</h2>
        <p className="text-muted-foreground">The following uses of the service are strictly prohibited:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>mass automated testing or abusive repeated requests (scraping, stress testing);</li>
          <li>extraction, reproduction or commercial use of generated answers without PitStop&apos;s prior written consent;</li>
          <li>circumventing security mechanisms or usage limits set by PitStop or Anthropic;</li>
          <li>any use contrary to Belgian law, including data protection (GDPR) and consumer law.</li>
        </ul>
        <p className="text-muted-foreground">
          Breach may result in immediate suspension of access, without prejudice to any liability claim.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">7. Evolution of the AI system and service</h2>
        <p className="text-muted-foreground">PitStop may at any time, without notice or compensation, change:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>the underlying AI model, provider or version;</li>
          <li>parameters, instructions and constraints (system prompt);</li>
          <li>features offered to users;</li>
          <li>conditions of access to the service.</li>
        </ul>
        <p className="text-muted-foreground">
          Material changes affecting users&apos; rights will be announced on the platform in advance where practicable.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">8. Applicable law</h2>
        <p className="text-muted-foreground">
          These clauses are governed by Belgian law. Disputes fall within the exclusive jurisdiction of the courts of
          the district of Nivelles, without prejudice to mandatory consumer protection rules applicable in Belgium.
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

export function PolitiqueIaBodyNl() {
  return (
    <div className="container mx-auto max-w-4xl px-4 space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">AI-beleid</h1>
        <p className="text-muted-foreground">
          PitStop: AI-ondersteunde automobieldiagnose
          <br />
          Versie 1.1 — Laatst bijgewerkt: 2 april 2026
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">1. Aard van de dienst en juridische kwalificatie</h2>
        <p className="text-muted-foreground">
          PitStop steunt op een geautomatiseerd AI-systeem met een groot taalmodel (LLM) van Anthropic, Inc. Het systeem
          analyseert door de gebruiker verstrekte informatie om indicatieve schattingen te geven van mogelijke oorzaken
          van een voertuigdefect en bijbehorende kostenbanden.
        </p>
        <p className="text-muted-foreground">
          In de zin van Verordening (EU) 2024/1689 (AI-verordening) treedt PitStop op als deployer van een AI-systeem voor
          algemeen gebruik. De output is geautomatiseerd en louter informatief; het is geen gecertificeerd technisch
          advies, erkende professionele diagnose of deskundigenbewijs in de zin van artikel 962 van het Belgisch
          Gerechtelijk Wetboek.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">2. Technische en kennistheoretische grenzen</h2>
        <p className="text-muted-foreground">De gebruiker erkent uitdrukkelijk dat:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>het AI-systeem het voertuig niet fysiek kan inspecteren en uitsluiten op door de gebruiker ingevoerde tekst;</li>
          <li>kwaliteit, nauwkeurigheid en relevantie rechtstreeks afhangen van juistheid, volledigheid en waarheid van die gegevens;</li>
          <li>fouten, weglatingen, hallucinaties of benaderingen kunnen voorkomen, ook bij gangbare voertuigen of symptomen;</li>
          <li>
            sommige defecten, structurele schade of verborgen gebreken van nature niet detecteerbaar zijn zonder fysisch
            onderzoek door een bevoegde professional;
          </li>
          <li>
            prijsschattingen gebaseerd zijn op Belgische marktgegevens; ze vormen geen contractuele offerte in de zin van
            artikel 1583 van het Burgerlijk Wetboek.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">3. Geen garantie; disclaimer</h2>
        <p className="text-muted-foreground">
          PitStop garandeert niet de juistheid van gegenereerde diagnoses. Met name garandeert PitStop niet:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>juistheid, volledigheid of betrouwbaarheid van door AI geproduceerde schattingen;</li>
          <li>volledige identificatie van oorzaken of onderdelen;</li>
          <li>dat prijsbanden overeenstemmen met de lokale markt op het moment van interventie;</li>
          <li>afwezigheid van fouten, bias of weglatingen in gegenereerde antwoorden.</li>
        </ul>
        <p className="text-muted-foreground">
          De aansprakelijkheid van PitStop is beperkt tot een inspanningsverbintenis bij het aanbieden van de digitale
          dienst, overeenkomstig artikel 5:71 van het nieuwe Burgerlijk Wetboek.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">4. Verificatieplicht van de gebruiker</h2>
        <p className="text-muted-foreground">
          De gebruiker erkent en aanvaardt dat elke informatie van PitStop door een bevoegde professional moet worden
          gecontroleerd vóór een herstelbeslissing, onderdelenaankoop of contractuele verbintenis met een garage.
        </p>
        <p className="text-muted-foreground">De gebruiker verbindt zich ertoe:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>geen kritieke technische, financiële of veiligheidsbeslissingen uitsluitend op AI-resultaten te baseren;</li>
          <li>een erkende monteur te raadplegen voor elke definitieve diagnose;</li>
          <li>
            de partnergarage te informeren over elk wezenlijk verschil tussen de PitStop-schatting en de bevindingen bij
            fysieke inspectie.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">5. Verwerking van persoonsgegevens door het AI-systeem</h2>
        <p className="text-muted-foreground">
          Gegevens ingevoerd tijdens een diagnose (symptoombeschrijving, voertuiginformatie) worden naar de API van
          Anthropic, Inc. gestuurd om het antwoord te genereren. De verwerking valt onder PitStops{" "}
          <Link href="/confidentialite" className="text-primary hover:underline">
            privacyverklaring
          </Link>{" "}
          en de voorwaarden van Anthropic. PitStop bewaart geen ruwe uitwisselingen met het model langer dan strikt nodig
          voor de dienst.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">6. Redelijk gebruik en verboden</h2>
        <p className="text-muted-foreground">Strikt verboden is elk gebruik van de dienst voor:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>massale geautomatiseerde tests of misbruik van herhaalde aanvragen (scraping, stresstests);</li>
          <li>extractie, reproductie of commercieel gebruik van gegenereerde antwoorden zonder voorafgaande schriftelijke toestemming van PitStop;</li>
          <li>het omzeilen van beveiliging of gebruikslimieten van PitStop of Anthropic;</li>
          <li>elk gebruik in strijd met de Belgische wetgeving, met inbegrip van gegevensbescherming (AVG) en consumentenrecht.</li>
        </ul>
        <p className="text-muted-foreground">
          Overtreding kan leiden tot onmiddellijke schorsing van de toegang, onverminderd eventuele aansprakelijkheid.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">7. Evolutie van het AI-systeem en de dienst</h2>
        <p className="text-muted-foreground">PitStop kan te allen tijde, zonder voorafgaande kennisgeving of schadevergoeding, wijzigen:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>het onderliggende AI-model, de leverancier of de versie;</li>
          <li>parameters, instructies en beperkingen (system prompt);</li>
          <li>functionaliteit voor gebruikers;</li>
          <li>toegangsvoorwaarden tot de dienst.</li>
        </ul>
        <p className="text-muted-foreground">
          Wezenlijke wijzigingen die rechten van gebruikers raken, worden vooraf op het platform meegedeeld waar mogelijk.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">8. Toepasselijk recht</h2>
        <p className="text-muted-foreground">
          Deze bepalingen worden beheerst door het Belgische recht. Geschillen vallen onder de exclusieve bevoegdheid van
          de rechtbanken van het arrondissement Nijvel, onverminderd dwingende consumentenbeschermingsregels in België.
        </p>
      </section>

      <div className="pt-2">
        <Link href="/" className="text-primary hover:underline">
          Terug naar start
        </Link>
      </div>
    </div>
  )
}
