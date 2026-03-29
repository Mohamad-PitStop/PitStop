import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "Politique de confidentialité — PitStop",
  description: "Politique de confidentialité du service PitStop.",
}

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4 space-y-8">
          <header className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Politique de confidentialité</h1>
            <p className="text-muted-foreground">
              PitStop — Service de diagnostic automobile assisté par IA
              <br />
              Dernière mise à jour : 26 mars 2026
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
              Responsable du traitement : Mohamad ALI AHMAD, Braine-l&apos;Alleud, Belgique —{" "}
              <a className="text-primary hover:underline" href="mailto:amoudialiahmad@gmail.com">
                amoudialiahmad@gmail.com
              </a>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. Données collectées</h2>
            <div>
              <h3 className="font-medium text-foreground">2.1 Données de compte</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Adresse e-mail (création/connexion)</li>
                <li>Identifiant utilisateur généré automatiquement</li>
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
                Anthropic, Inc. (diagnostic IA) —{" "}
                <a className="text-primary hover:underline" href="https://www.anthropic.com/privacy" target="_blank" rel="noreferrer">
                  https://www.anthropic.com/privacy
                </a>
              </li>
              <li>
                Stripe, Inc. (paiements) —{" "}
                <a className="text-primary hover:underline" href="https://stripe.com/privacy" target="_blank" rel="noreferrer">
                  https://stripe.com/privacy
                </a>
              </li>
              <li>Vercel, Inc. (hébergement et analytics)</li>
            </ul>
            <p className="text-muted-foreground">
              Ces prestataires peuvent être établis hors EEE. Les transferts sont encadrés par des mécanismes de
              protection appropriés (clauses contractuelles types ou équivalent).
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
              <a className="text-primary hover:underline" href="mailto:amoudialiahmad@gmail.com">
                amoudialiahmad@gmail.com
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
              PitStop utilise des cookies strictement nécessaires (non refusables) et des cookies analytics (Vercel
              Analytics) déposés uniquement avec votre consentement explicite.
            </p>
            <p className="text-muted-foreground">
              Vous pouvez modifier vos préférences à tout moment via le bouton « Gérer mes préférences ».
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">8. Sécurité</h2>
            <p className="text-muted-foreground">
              PitStop met en oeuvre des mesures techniques appropriées : HTTPS/TLS, accès restreint aux bases de
              données, gestion sécurisée des clés API. Aucun système n&apos;offre néanmoins une sécurité absolue.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">9. Mises à jour</h2>
            <p className="text-muted-foreground">
              Cette politique peut être mise à jour selon l&apos;évolution du service et de la structure juridique. En cas
              de modification substantielle, les utilisateurs enregistrés seront informés.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">10. Contact</h2>
            <p className="text-muted-foreground">
              Pour toute question relative à cette politique :
              <br />
              <a className="text-primary hover:underline" href="mailto:amoudialiahmad@gmail.com">
                amoudialiahmad@gmail.com
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
      </main>
    </div>
  )
}
