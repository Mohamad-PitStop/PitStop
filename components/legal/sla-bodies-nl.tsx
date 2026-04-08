import Link from "next/link"

export function SlaBodyNl() {
  return (
    <div className="container mx-auto max-w-4xl px-4 space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">SLA: Service Level Agreement</h1>
        <p className="text-muted-foreground">
          Bijlage 1: PitStop-platform (digitale diensten)
          <br />
          Versie 1.1: Laatst bijgewerkt: 5 april 2026
          <br />
          Reikwijdte: deze bijlage is afdwingbaar in het kader van de AV (klanten) en de APV (garages) van PitStop. Ze vormt een
          inspanningsverbintenis.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">1. Voorwerp en juridische waarde</h2>
        <p className="text-muted-foreground">
          Deze Service Level Agreement (hierna « SLA ») definieert de beoogde dienstenniveaus van het PitStop-platform wat
          beschikbaarheid, incidentbeheer, onderhoud en communicatie betreft.
        </p>
        <p className="text-muted-foreground">
          De SLA vormt een <span className="font-medium text-foreground">inspanningsverbintenis</span> in de zin van het Belgische
          verbintenissenrecht (artikel 5:71 van het nieuwe Burgerlijk Wetboek). Ze kan niet als een resultaatsverbintenis worden
          gekwalificeerd. PitStop kan niet aansprakelijk worden gesteld voor onderbrekingen of verslechtering van de dienst die
          voortvloeien uit oorzaken buiten zijn redelijke controle.
        </p>
        <p className="text-muted-foreground">
          De hierna gedefinieerde dienstenniveaus zijn van toepassing op de productieversie van het platform. Tijdens de fase van
          beperkte test (bèta) worden ze louter ter informatie verstrekt en zonder afdwingbare contractuele verbintenis.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">2. Gedekt functioneel bereik</h2>
        <p className="text-muted-foreground">De SLA dekt de technische beschikbaarheid van de volgende functies:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>raadplegen van openbare PitStop-pagina&apos;s;</li>
          <li>authenticatie, gebruikersaccountbeheer, creditbeheer;</li>
          <li>AI-ondersteund diagnosepad;</li>
          <li>afspraakboeking met voorschot;</li>
          <li>interne API&apos;s die nodig zijn voor de werking van de applicatie.</li>
        </ul>
        <p className="text-muted-foreground">Het volgende is uitdrukkelijk uitgesloten van het bereik van resultaatsverbintenissen:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>beschikbaarheid van infrastructuur van derden (Stripe, Vercel, Turso, Anthropic, DNS, mobiel netwerk/operator, enz.);</li>
          <li>onderbrekingen door een geval van overmacht in de zin van het Belgische recht;</li>
          <li>onbeschikbaarheid door externe kwaadwillige acties (DDoS-aanvallen, indringingen, enz.);</li>
          <li>onbeschikbaarheid door verkeerde configuratie of niet-conform gebruik aan gebruikerszijde;</li>
          <li>functionaliteiten die worden uitgerold of in bètatestfase zijn.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">3. Beoogde beschikbaarheid</h2>
        <p className="text-muted-foreground">
          3.1 De maandelijkse beoogde beschikbaarheid van het platform is vastgesteld op{" "}
          <span className="font-medium text-foreground">99,5 %</span> (inspanningsverbintenis).
        </p>
        <p className="text-muted-foreground">3.2 De beschikbaarheid wordt per kalendermaand berekend volgens de volgende formule:</p>
        <p className="text-muted-foreground pl-4 border-l-2 border-border italic">
          Beschikbaarheid (%) = ((Totale duur van de maand - Duur van toerekenbare onbeschikbaarheid) / Totale duur van de maand) ×
          100
        </p>
        <p className="text-muted-foreground">
          3.3 Uitgesloten van de berekening van onbeschikbaarheid: aangekondigde geplande onderhoudsvensters, incidenten die aan
          derde leveranciers zijn toe te rekenen, en gevallen van overmacht.
        </p>
        <p className="text-muted-foreground">
          3.4 Als de beoogde beschikbaarheid om redenen die aan PitStop zijn toe te rekenen niet wordt bereikt, kan de gebruiker een
          klacht richten aan{" "}
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
          </a>
          . Tijdens de testfase is geen automatische financiële compensatie voorzien.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">4. Onderhoudsbeheer</h2>
        <div>
          <h3 className="font-medium text-foreground">4.1 Gepland onderhoud</h3>
          <p className="text-muted-foreground">
            PitStop kan gepland onderhoud uitvoeren (correctief, preventief of evolutief). Tenzij urgent, wordt voorafgaande
            informatie aan gebruikers meegedeeld via het platform of een passend kanaal, binnen een redelijke termijn voor de
            ingreep.
          </p>
        </div>
        <div>
          <h3 className="font-medium text-foreground">4.2 Dringend onderhoud</h3>
          <p className="text-muted-foreground">
            Bij een beveiligingslek, risico op corruptie of gegevensverlies, of kritieke onbeschikbaarheid die de integriteit van de
            dienst of gebruikersgegevens raakt, behoudt PitStop zich het recht voor om zonder voorafgaande kennisgeving in te grijpen.
            Communicatie na de ingreep gebeurt binnen een redelijke termijn.
          </p>
        </div>
        <div>
          <h3 className="font-medium text-foreground">4.3 Voorkeursonderhoudsvensters</h3>
          <p className="text-muted-foreground">
            Voor zover mogelijk worden geplande onderhoudsoperaties geprogrammeerd buiten piekuren (bij voorkeur &apos;s nachts of in
            het weekend). Deze regel is niet afdwingbaar tegen PitStop bij technische urgentie.
          </p>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">5. Classificatie en kwalificatie van incidenten</h2>
        <p className="text-muted-foreground">Incidenten worden gekwalificeerd volgens hun functionele impact op gebruikers:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>
            <span className="font-medium text-foreground">P1 — Kritiek:</span> volledige onbeschikbaarheid van de hoofddienst,
            onmogelijkheid om te betalen of te diagnosticeren, algemene blokkerende storing die alle gebruikers treft.
          </li>
          <li>
            <span className="font-medium text-foreground">P2 — Groot:</span> kernfunctionaliteit onbeschikbaar of sterk verminderd
            voor een significant deel van de gebruikers; moeilijke of onmogelijke omzeiling.
          </li>
          <li>
            <span className="font-medium text-foreground">P3 — Klein:</span> niet-blokkerende degradatie van een secundaire functie,
            met mogelijke omzeiling; beperkte impact op de gebruikerservaring.
          </li>
          <li>
            <span className="font-medium text-foreground">P4 — Cosmetisch / Evolutie:</span> visueel gebrek zonder functionele
            impact, of niet-dringend verbeterverzoek.
          </li>
        </ul>
        <p className="text-muted-foreground">
          De kwalificatie van de prioriteit van een incident is voorbehouden aan PitStop, op basis van de op het moment van vaststelling
          beschikbare technische gegevens.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">6. Beoogde termijnen voor opvolging (inspanningsverbintenis)</h2>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>P1: beoogde opvolging binnen 1 uur na detectie of melding;</li>
          <li>P2: beoogde opvolging binnen 4 uur;</li>
          <li>P3: beoogde opvolging binnen 1 werkdag;</li>
          <li>P4: opname in onderhoudsbacklog zonder gegarandeerde termijn.</li>
        </ul>
        <p className="text-muted-foreground">
          Deze termijnen betreffen opvolging (ontvangstbevestiging en begin van onderzoek), niet de oplossing. Oplostermijnen hangen af
          van de aard van de hoofdoorzaak, technische complexiteit en eventuele afhankelijkheden van derde leveranciers. PitStop kan
          geen vast oplostermijn garanderen voor enige incidentcategorie.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">7. Communicatie tijdens een incident</h2>
        <p className="text-muted-foreground">
          7.1 Voor elk incident van niveau P1 of P2 verbindt PitStop zich ertoe binnen een redelijke termijn de volgende informatie mee
          te delen:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>aard en omvang van het incident;</li>
          <li>bekende functionele gevolgen;</li>
          <li>ondernomen remedieringsacties;</li>
          <li>voortgangsstatus richting normale werking.</li>
        </ul>
        <p className="text-muted-foreground">
          7.2 Communicatie gebeurt via melding op het platform of een ander door PitStop passend geacht kanaal. Geregistreerde
          gebruikers kunnen ook per e-mail worden gecontacteerd voor P1-incidenten langer dan 4 uur.
        </p>
        <p className="text-muted-foreground">
          7.3 Voor P3- en P4-incidenten is geen proactieve individuele communicatie gegarandeerd.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">8. Operationele beveiliging</h2>
        <p className="text-muted-foreground">
          PitStop treft binnen de grenzen van zijn technische middelen de volgende operationele beveiligingsmaatregelen:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>logregistratie van gevoelige gebeurtenissen (authenticatie, betalingen, administratieve handelingen);</li>
          <li>versterkte administratieve toegangscontroles (beperking op eigenaar-e-mail, verificatie van herkomst van verzoeken);</li>
          <li>anti-replaybescherming op kritieke betalingsstromen (idempotentie van Stripe-webhooks);</li>
          <li>consistentie- en plafondcontroles op gevoelige operaties (toekenning van credits, gebruikersrollen);</li>
          <li>versleuteling van wachtwoorden met scrypt en hashing van sessietokens met SHA-256.</li>
        </ul>
        <p className="text-muted-foreground">
          Deze maatregelen vormen een redelijke beveiligingsinspanning en mogen niet worden uitgelegd als absolute garantie tegen
          indringing of gegevensinbreuk.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">9. Back-up, logregistratie en bewaring van bewijs</h2>
        <p className="text-muted-foreground">9.1 PitStop bewaart technische logboeken die het volgende omvatten:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>diagnose- en betalingsoperaties, voor contractbewijs;</li>
          <li>gevoelige beveiligingsgebeurtenissen (aanmeldpogingen, administratieve handelingen);</li>
          <li>technische incidentgebeurtenissen voor diagnose.</li>
        </ul>
        <p className="text-muted-foreground">
          9.2 Deze logboeken worden bewaard gedurende de tijd die nodig is om de rechten van partijen te verdedigen, met inachtneming
          van het privacybeleid en de toepasselijke regelgeving (AVG, Belgisch recht).
        </p>
        <p className="text-muted-foreground">
          9.3 Bij geschil gelden technische logboeken van PitStop en zijn leveranciers (met name Stripe en Turso) tot het tegendeel is
          bewezen, overeenkomstig artikel 19 van de AV.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">10. Melding van een incident door de gebruiker</h2>
        <p className="text-muted-foreground">
          10.1 Elke gebruiker die een anomalie of onbeschikbaarheid vaststelt, kan dit melden aan:{" "}
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
          </a>
          .
        </p>
        <p className="text-muted-foreground">De melding moet vermelden:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>de betrokken functionaliteit;</li>
          <li>datum en uur van vaststelling;</li>
          <li>browser en gebruikt apparaat;</li>
          <li>een nauwkeurige beschrijving van het waargenomen gedrag;</li>
          <li>eventuele screenshot of andere nuttige informatie.</li>
        </ul>
        <p className="text-muted-foreground">
          10.2 Een melding door de gebruiker bepaalt niet vooraf de kwalificatie van het incident door PitStop, noch de toepassing
          van de in artikel 6 bepaalde termijnen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">11. Aansprakelijkheidsbeperkingen en uitsluitingen</h2>
        <p className="text-muted-foreground">
          11.1 Deze SLA vormt een inspanningsverbintenis. PitStop gaat geen resultaatsverbintenis aan wat de voortdurende beschikbaarheid
          van het platform betreft.
        </p>
        <p className="text-muted-foreground">11.2 De aansprakelijkheid van PitStop onder deze SLA is uitgesloten in de volgende gevallen:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>onbeschikbaarheid van een derde leverancier buiten de controle van PitStop;</li>
          <li>overmacht in de zin van het Belgische recht;</li>
          <li>niet-conform gebruik van het platform door de gebruiker;</li>
          <li>externe kwaadwillige acties (cyberaanvallen, enz.);</li>
          <li>niet-naleving door de gebruiker van technische vereisten voor toegang tot de dienst.</li>
        </ul>
        <p className="text-muted-foreground">
          11.3 PitStop kan in geen geval aansprakelijk worden gesteld voor indirecte schade, bedrijfsschade, gegevensverlies of
          immateriële schade door onbeschikbaarheid, tenzij dwingend recht in het Belgische consumentenrecht anders bepaalt.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">12. Herziening van de SLA</h2>
        <p className="text-muted-foreground">
          12.1 PitStop behoudt zich het recht voor deze SLA te allen tijde te wijzigen om technische, juridische of beveiligingsredenen.
        </p>
        <p className="text-muted-foreground">
          12.2 De bindende versie is die die op het platform is gepubliceerd op de datum van het betrokken incident of geschil.
        </p>
        <p className="text-muted-foreground">
          12.3 Wezenlijke wijzigingen die de dienstenniveaus raken, worden vooraf aan geregistreerde gebruikers meegedeeld.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">13. Toepasselijk recht en bevoegde rechtbanken</h2>
        <p className="text-muted-foreground">
          Deze SLA is onderworpen aan het Belgische recht. Elk geschil over uitleg of uitvoering valt onder de bevoegdheid van de
          rechtbanken van het arrondissement Nijvel, zonder afbreuk aan dwingende regels ter bescherming van consumenten in België.
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
