import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "Mentions légales — PitStop",
  description: "Mentions légales du service PitStop.",
}

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4 space-y-8">
          <header className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Mentions légales</h1>
            <p className="text-muted-foreground">
              PitStop — Service de diagnostic automobile assisté par IA
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
              Statut : Personne physique — service en phase bêta non commerciale.
            </p>
            <p className="text-muted-foreground">
              PitStop est actuellement en phase de test restreinte. Aucune structure commerciale ou juridique n&apos;est
              enregistrée à ce stade.
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
              PitStop est un outil d&apos;aide au diagnostic automobile utilisant l&apos;intelligence artificielle (modèle de
              langage fourni par Anthropic, Inc.). Il permet à l&apos;utilisateur d&apos;obtenir des informations indicatives sur
              d&apos;éventuelles pannes ou défaillances de son véhicule, sur la base des données qu&apos;il fournit.
            </p>
            <p className="text-muted-foreground">
              Les résultats générés par PitStop sont fournis à titre informatif uniquement. Ils ne constituent pas un
              avis technique professionnel certifié ni une garantie de réparation.
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
              des oeuvres protégées au sens du droit d&apos;auteur belge.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">5. Limitation de responsabilité</h2>
            <p className="text-muted-foreground">
              L&apos;éditeur s&apos;engage à faire ses meilleurs efforts pour assurer la disponibilité et la fiabilité du
              service. Toutefois, PitStop étant en phase bêta, des interruptions, erreurs ou inexactitudes peuvent
              survenir.
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
              Les présentes mentions légales sont régies par le droit belge. En cas de litige, et à défaut de
              résolution amiable, les tribunaux compétents de l&apos;arrondissement judiciaire de Nivelles (Brabant wallon)
              seront seuls compétents.
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
      </main>
    </div>
  )
}
