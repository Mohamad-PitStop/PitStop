import Link from "next/link"

export function CgvBodyNl() {
  return (
    <div className="container mx-auto max-w-4xl px-4 space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Algemene verkoopsvoorwaarden (B2C)</h1>
        <p className="text-muted-foreground">
          PitStop: Particuliere klanten (België)
          <br />
          Versie 1.1: Laatst bijgewerkt: 5 april 2026
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 1: Identificatie van de uitgever</h2>
        <p className="text-muted-foreground">
          Deze Algemene Verkoopsvoorwaarden (hierna « AV ») worden uitgegeven door:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Naam: Ali Ahmad</li>
          <li>Voornaam: Mohamad</li>
          <li>Statuut: natuurlijke persoon; activiteit op eigen naam, zonder geregistreerde handelsstructuur op dit moment</li>
          <li>KBO-nummer: niet van toepassing (geen KBO-inschrijving tot op heden)</li>
          <li>Btw-nummer: niet van toepassing (activiteit niet onderworpen aan btw op dit moment)</li>
          <li>
            Contact:{" "}
            <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
              pitstopbelgique@gmail.com
            </a>
          </li>
        </ul>
        <p className="text-muted-foreground">Hierna « PitStop » genoemd.</p>
        <p className="text-muted-foreground">
          Deze gegevens (KBO-nummer, btw-nummer, rechtsvorm) worden bijgesteld bij de officiële start van de commerciële
          exploitatie.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 2: Voorwerp en toepassingsgebied</h2>
        <p className="text-muted-foreground">
          2.1 Deze AV regelen de contractuele verhouding tussen PitStop en elke gebruiker die optreedt als consument (hierna
          « Klant »), voor de volgende diensten:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>AI-ondersteunde automobieldiagnose;</li>
          <li>aankoop van diagnostische credits;</li>
          <li>in contact brengen met een partnergarage;</li>
          <li>garageafspraak met voorschot.</li>
        </ul>
        <p className="text-muted-foreground">
          2.2 Deze AV zijn uitsluitend van toepassing op klanten gevestigd in België.
          <br />
          2.3 Aankoop van diagnostische credits wordt online op het Platform aangeboden (pagina « Credits »), met beveiligde
          betaling per bankkaart via Stripe, onder voorbehoud van voorafgaande aanvaarding van deze AV. Het traject « Verkoop »
          (inschatting van inruilwaarde bij partnergarages) kan afzonderlijk worden uitgerold.
          <br />
          2.4 Elke bestelling, aankoop van credits, reservering en elk gebruik van het platform houdt volledige en onvoorwaardelijke
          aanvaarding van deze AV in.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 3: Definities</h2>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Platform: de PitStop-website en digitale interfaces;</li>
          <li>Diagnose: schatting en oriëntatie door PitStop op basis van door de Klant verstrekte informatie;</li>
          <li>Credit: verbruikseenheid die toegang geeft tot één diagnose;</li>
          <li>Partnergarage: onafhankelijke professional op het platform vermeld;</li>
          <li>Voorschot: bedrag van 25 EUR betaald bij het boeken van een afspraak.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 4: Aard van de PitStop-dienst</h2>
        <p className="text-muted-foreground">
          4.1 PitStop is een digitale tussenpersoon voor transparantie en oriëntatie tussen de Klant en partnergarages.
          <br />
          4.2 PitStop voert zelf geen mechanische, carrosserie-, onderhouds- of herstelwerkzaamheden uit. De partnergarage blijft
          de enige uitvoerende dienstverlener.
          <br />
          4.3 De door PitStop verstrekte informatie heeft tot doel de Klant te helpen waarschijnlijke kostenordes en technische
          scenario&apos;s te begrijpen, zonder fysiek onderzoek van het voertuig te vervangen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 5: Prijzen en btw</h2>
        <p className="text-muted-foreground">
          5.1 Tenzij anders vermeld, zijn de aan de Klant getoonde prijzen uitgedrukt in EUR inclusief btw.
          <br />
          5.2 Internetverbinding, communicatie of andere externe kosten in verband met het gebruik van het platform blijven ten
          laste van de Klant.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Artikel 6: Diagnostische credits: werking, geldigheid, geen terugbetaling
        </h2>
        <p className="text-muted-foreground">
          6.0 De aangeboden pakketten (aantal credits per pakket, prijs in EUR incl. btw, eventuele promoties) worden op het
          moment van bestelling op de pagina « Credits » weergegeven. De prijs en samenstelling van het door de Klant gekozen
          pakket zijn bindend op het moment van betalingsbevestiging.
        </p>
        <p className="text-muted-foreground">
          6.1 1 credit = 1 volledige automobieldiagnose op het platform, inclusief eventuele vervolgvragen in het diagnosepad.
        </p>
        <p className="text-muted-foreground">6.2 Gekochte credits zijn:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>onbeperkt geldig;</li>
          <li>niet overdraagbaar tussen accounts;</li>
          <li>niet terugbetaalbaar, behalve in de gevallen van artikel 12.5.</li>
        </ul>
        <p className="text-muted-foreground">
          6.3 Bij vrijwillige verwijdering van het Klantaccount gaan resterende credits definitief verloren, zonder terugbetaling.
          <br />
          6.4 Bij schorsing/sluiting van het account wegens fraude, misbruik of ernstige inbreuk gaan resterende credits definitief
          verloren, zonder terugbetaling.
          <br />
          6.5 Geval « geen probleem »: wanneer een diagnose uitdrukkelijk concludeert dat geen ingreep nodig is (volgens de
          functionele logica van het platform), wordt het gebruikte credit opnieuw aan de Klant bijgeschreven.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 7: Betaling</h2>
        <p className="text-muted-foreground">
          7.1 Betalingen verlopen via Stripe.
          <br />
          7.2 De beschikbare betaalmethoden zijn die welke Stripe op het moment van de transactie aanbiedt.
          <br />
          7.3 De Klant garandeert gemachtigd te zijn om de gekozen betaalmethode te gebruiken.
          <br />
          7.4 PitStop bewaart geen volledige kaartgegevens; die worden door de betaaldienstverlener volgens diens eigen voorwaarden
          verwerkt.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 8: Herroeping (digitale inhoud/diensten)</h2>
        <p className="text-muted-foreground">
          8.1 De Klant erkent dat de aankoop van credits de levering van digitale inhoud/diensten betreft die onmiddellijk na
          bevestiging wordt uitgevoerd.
        </p>
        <p className="text-muted-foreground">8.2 Door de bestelling te bevestigen:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>vraagt de Klant uitdrukkelijk om onmiddellijke uitvoering;</li>
          <li>erkent de Klant het verlies van het herroepingsrecht zodra de uitvoering begint.</li>
        </ul>
        <p className="text-muted-foreground">
          8.3 Deze bepaling geldt binnen de grenzen van het Belgische recht en dwingende consumentenbeschermingsbepalingen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 9: Afspraak en voorschot</h2>
        <p className="text-muted-foreground">
          9.1 Een voorschot is verplicht voor het boeken van een afspraak via het platform.
          <br />
          9.2 Het voorschotbedrag is vast: 25 EUR.
          <br />
          9.3 In principe wordt het voorschot afgetrokken van de eindfactuur van de garage.
          <br />
          9.4 De garage kan het voorschot behouden in de gevallen van artikelen 10.2 tot 10.5 en, indien van toepassing, wanneer
          gerechtvaardigde voorbereidingskosten zijn gemaakt.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Artikel 10: Annulering, te laat komen, no-show</h2>
        <p className="text-muted-foreground">
          Het volgende geldt als aanvang van bewijs bij een geschil over een reservering: platformtijdstempels, statusgeschiedenissen,
          applicatielogs, Stripe-transactiebevestigingen, schriftelijk uitgewisselde berichten klant/garage, garagebewijs
          (bestellingen onderdelen, fysieke voorbereiding, enz.).
        </p>
        <div>
          <h3 className="font-medium text-foreground">10.1 Annulering meer dan 12 uur voor de afspraak</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Bewijs: tijdstempel annulering vergeleken met het tijdstip van de afspraak.</li>
            <li>Gevolg: online annulering mogelijk; automatische terugbetaling van het voorschot.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-foreground">10.2 Annulering tussen 12 uur en 1 uur voor de afspraak</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Bewijs: onmogelijkheid om online te annuleren + rechtstreeks contact met de garage.</li>
            <li>
              Gevolg: online annulering niet beschikbaar; de Klant moet rechtstreeks contact opnemen met de garage. Eventuele
              terugbetaling van het voorschot hangt af van de overeenkomst met de garage; PitStop kan bemiddeling vergemakkelijken.
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-foreground">10.3 Annulering minder dan 1 uur voor de afspraak</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Bewijs: tijdstempel annulering/melding.</li>
            <li>Gevolg: het voorschot wordt automatisch behouden.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-foreground">10.4 No-show (vertraging ≥ 15 minuten zonder bericht)</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Bewijs: tijdstip afspraak + geen melding + vaststelling door de garage.</li>
            <li>Gevolg: het voorschot wordt automatisch behouden.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-foreground">10.5 Vertraging meer dan 15 minuten met melding aan de garage</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Bewijs: spoor van oproep/bericht + uur.</li>
            <li>
              Gevolg: de Klant moet de garage verwittigen. Het voorschot wordt behouden. Als de garage desondanks de inspectie/ingreep
              uitvoert, wordt het voorschot niet afgetrokken van de eindfactuur.
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 11: Schattingen, offertes en voorbehoud fysiek onderzoek</h2>
        <p className="text-muted-foreground">
          11.1 PitStop-schattingen zijn indicatief.
          <br />
          11.2 Ze zijn gebaseerd op door de Klant verstrekte informatie, Belgische marktstandaarden en technische databanken die
          door professionals worden gevoed.
          <br />
          11.3 De definitieve offerte van de garage kan evolueren, met name bij een belangrijke technische ontdekking tijdens
          fysiek onderzoek van het voertuig.
          <br />
          11.4 De Klant erkent dat diagnose op afstand vergelijkbaar is met een technische voorcontrole zonder rechtstreeks visueel
          of mechanisch onderzoek van het voertuig.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Artikel 12: Klachten en regularisaties</h2>
        <p className="text-muted-foreground">
          12.1 Elke klacht moet worden gericht aan:{" "}
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
          </a>
          .
        </p>
        <p className="text-muted-foreground">12.2 De klacht moet minimaal bevatten:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>identiteit van de aanvrager;</li>
          <li>e-mail gebruikt op het platform;</li>
          <li>referentie van de afspraak of transactie;</li>
          <li>datum en uur van de afspraak (indien van toepassing);</li>
          <li>precieze beschrijving van het geschil;</li>
          <li>beschikbare bewijsstukken (screenshots, bevestigingen, enz.).</li>
        </ul>
        <p className="text-muted-foreground">12.3 Afhandelingsproces:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>
            <span className="font-medium text-foreground">Ontvangst &amp; kwalificatie</span>: PitStop registreert het verzoek
            en kwalificeert de aard van het geschil (betaling, voorschot, no-show, annulering, offerteverschil, enz.).
          </li>
          <li>
            <span className="font-medium text-foreground">Tegenstrijdige behandeling</span>: als een garage betrokken is, kan PitStop
            diens materiaal verzamelen (chronologie, bewijsstukken, contactbewijs, enz.).
          </li>
          <li>
            <span className="font-medium text-foreground">Gemotiveerde beslissing</span>: bevestiging van de toegepaste regel,
            volledige/deeltelijke regularisatie of minnelijk voorstel.
          </li>
          <li>
            <span className="font-medium text-foreground">Afsluiting</span>: het dossier wordt gesloten met bewaring van bewijsstukken
            volgens de toepasselijke wettelijke verplichtingen.
          </li>
        </ul>
        <p className="text-muted-foreground">
          12.4 Bij een bewezen technische fout die aan het platform kan worden toegeschreven (dubbele afschrijving, afwijking bij
          debitering, enz.) kan PitStop een regularisatie uitvoeren (terugbetaling of opnieuw crediteren).
          <br />
          12.5 Geen terugbetaling van credits (artikel 6) sluit correctie wegens bewezen technische fout niet uit.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 13: Verplichtingen van de Klant</h2>
        <p className="text-muted-foreground">De Klant verbindt zich ertoe:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>juiste, volledige en eerlijke informatie te verstrekken;</li>
          <li>het platform niet voor frauduleuze doeleinden te gebruiken;</li>
          <li>de technische werking van de dienst niet te verstoren;</li>
          <li>de rechten van PitStop, garages en derden te respecteren.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 14: Beschikbaarheid van de dienst</h2>
        <p className="text-muted-foreground">
          14.1 PitStop levert redelijke inspanningen om de beschikbaarheid van het platform te handhaven.
          <br />
          14.2 Tijdelijke onderbrekingen kunnen optreden (onderhoud, beveiliging, incident, update).
          <br />
          14.3 PitStop is niet aansprakelijk voor onbeschikbaarheid die aan derden te wijten is (hosting, betaling, netwerkoperator,
          overmacht, enz.).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 15: Intellectuele eigendom</h2>
        <p className="text-muted-foreground">
          15.1 Het platform, de inhoud, merken, interfaces, teksten, grafieken, databanken en onderscheidende elementen zijn
          beschermd.
          <br />
          15.2 Tenzij voorafgaande schriftelijke toestemming is elke reproductie, extractie, aanpassing of exploitatie verboden.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 16: Aansprakelijkheid</h2>
        <p className="text-muted-foreground">
          16.1 PitStop heeft een inspanningsverbintenis bij de levering van zijn digitale diensten.
          <br />
          16.2 PitStop is niet aansprakelijk voor de materiële uitvoering van herstellingen; die rust uitsluitend op de
          partnergarage.
          <br />
          16.3 De Klant blijft verantwoordelijk voor zijn verklaringen, keuze van afspraken en beslissingen op basis van schattingen.
          <br />
          16.4 Indirecte schade, bedrijfsschade, gederfde winst of immateriële gevolgschade kan PitStop niet worden toegerekend,
          tenzij dwingend recht anders bepaalt.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 17: Persoonsgegevens</h2>
        <p className="text-muted-foreground">
          De verwerking van persoonsgegevens wordt beheerst door het{" "}
          <Link href="/confidentialite" className="text-primary hover:underline">
            Privacybeleid
          </Link>{" "}
          van PitStop, beschikbaar op het platform. De Klant erkent het te hebben gelezen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 18: Schorsing / sluiting van account</h2>
        <p className="text-muted-foreground">
          18.1 PitStop kan een account schorsen of sluiten bij fraude, misbruik, kwaadwillig gebruik, schending van de AV of
          wettelijke verplichting.
          <br />
          18.2 Een dergelijke sluiting kan leiden tot verlies van resterende credits zonder terugbetaling.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 19: Elektronisch bewijs</h2>
        <p className="text-muted-foreground">
          Computerregisters, technische logs, transactiebevestigingen en tijdstempels van PitStop en/of zijn dienstverleners
          (met name betalingen) gelden tussen partijen tot het tegendeel is bewezen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 20: Overmacht</h2>
        <p className="text-muted-foreground">
          PitStop is niet aansprakelijk voor vertraging of niet-nakoming door een geval van overmacht in de zin van het Belgische
          recht en de rechtspraak.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 21: Gedeeltelijke nietigheid</h2>
        <p className="text-muted-foreground">
          Als een bepaling nietig of niet afdwingbaar wordt verklaard, blijven de overige bepalingen volledig van kracht.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 22: Geen verklaring van verzaking</h2>
        <p className="text-muted-foreground">
          Het feit dat PitStop een bepaling niet onmiddellijk inroept, betekent geen definitieve verzaking op het recht om die
          later in te roepen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 23: Wijziging van de AV</h2>
        <p className="text-muted-foreground">
          PitStop kan deze AV te allen tijde wijzigen. De bindende versie is die die geldt op de datum van de betrokken handeling
          (aankoop, reservering, gebruik).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Artikel 24: Toepasselijk recht en bevoegde rechtbanken</h2>
        <p className="text-muted-foreground">
          24.1 Deze AV zijn onderworpen aan het Belgische recht.
          <br />
          24.2 Elk geschil valt onder de materiële bevoegdheid van de rechtbanken van het arrondissement Nijvel, zonder afbreuk
          aan dwingende regels ter bescherming van consumenten.
          <br />
          24.3 De Klant kan ook een beroep doen op het Europese platform voor online geschillenbeslechting:{" "}
          <a className="text-primary hover:underline" href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer">
            https://ec.europa.eu/consumers/odr
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
