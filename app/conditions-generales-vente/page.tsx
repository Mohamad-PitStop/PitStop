import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "Conditions générales de vente — PitStop",
  description: "CGV (B2C) de PitStop pour les clients particuliers en Belgique.",
}

export default function ConditionsGeneralesVentePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4 space-y-8">
          <header className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Conditions générales de vente (B2C)
            </h1>
            <p className="text-muted-foreground">
              PitStop — Clients particuliers (Belgique)
              <br />
              Version 1.0 — Date d&apos;entrée en vigueur : 2 avril 2026
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 1 — Identification</h2>
            <p className="text-muted-foreground">
              Les présentes CGV sont éditées par Mohamad Ali Ahmad, activité exercée en nom propre.
              <br />
              Contact :{" "}
              <a className="text-primary hover:underline" href="mailto:amoudialiahmad@gmail.com">
                amoudialiahmad@gmail.com
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 2 — Champ d&apos;application</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Diagnostic automobile assisté par IA</li>
              <li>Achat de crédits de diagnostic</li>
              <li>Mise en relation avec un garage partenaire</li>
              <li>Prise de rendez-vous en garage avec acompte</li>
            </ul>
            <p className="text-muted-foreground">
              Services applicables aux clients situés en Belgique. Le parcours « Vente » est en cours de mise en
              production.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Articles 3 à 7 — Nature du service, prix et paiements</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>PitStop agit comme intermédiaire numérique entre le client et le garage partenaire.</li>
              <li>Les interventions sont exécutées uniquement par le garage partenaire.</li>
              <li>Les prix affichés au client sont en EUR TTC, sauf mention contraire.</li>
              <li>Les paiements sont traités via Stripe ; les moyens de paiement disponibles sont ceux de Stripe.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Article 6 — Crédits diagnostics</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>1 crédit = 1 diagnostic complet, incluant les questions de suivi.</li>
              <li>Crédits à durée illimitée, non transférables, non remboursables (sauf erreur technique avérée).</li>
              <li>Suppression volontaire du compte : crédits restants perdus sans remboursement.</li>
              <li>Compte clôturé pour fraude/abus : crédits perdus sans remboursement.</li>
              <li>Cas « aucun problème » : crédit re-crédité au client selon la logique de la plateforme.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Articles 8 à 10 — Rétractation, acompte, annulation</h2>
            <p className="text-muted-foreground">
              L&apos;achat de crédits correspond à un service numérique exécuté immédiatement. En validant, le client
              demande l&apos;exécution immédiate et reconnaît la perte du droit de rétractation dans les limites du droit
              belge.
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Acompte réservation : 25 EUR fixe.</li>
              <li>Annulation &gt; 18h : remboursement automatique de l&apos;acompte.</li>
              <li>Annulation entre 18h et 1h : accord client/garage requis.</li>
              <li>Annulation &lt; 1h : acompte conservé.</li>
              <li>No-show (retard d&apos;au moins 45 min sans information) : acompte conservé.</li>
              <li>Retard &gt; 45 min avec information : acompte conservé, intervention à la discrétion du garage.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Articles 11 à 16 — Estimations et responsabilité</h2>
            <p className="text-muted-foreground">
              Les estimations PitStop sont indicatives et basées sur les informations déclarées. Le devis final du garage
              peut évoluer après inspection physique du véhicule. PitStop est tenu d&apos;une obligation de moyens sur son
              service numérique.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Articles 17 à 24 — Données, preuve, litiges</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Le traitement des données personnelles est régi par la politique de confidentialité.</li>
              <li>Logs, horodatages et confirmations de transaction valent preuve jusqu&apos;à preuve contraire.</li>
              <li>Droit applicable : droit belge.</li>
              <li>Juridiction compétente : arrondissement de Nivelles (sous réserve des règles impératives).</li>
              <li>
                Plateforme ODR UE :{" "}
                <a
                  className="text-primary hover:underline"
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noreferrer"
                >
                  https://ec.europa.eu/consumers/odr
                </a>
              </li>
            </ul>
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

