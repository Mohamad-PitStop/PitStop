import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "Politique IA — PitStop",
  description: "Clauses spécifiques sur l'utilisation de l'intelligence artificielle dans PitStop.",
}

export default function PolitiqueIaPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4 space-y-8">
          <header className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Politique IA</h1>
            <p className="text-muted-foreground">
              Clauses spécifiques liées à l&apos;usage de l&apos;intelligence artificielle dans le service PitStop.
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">1) Nature du service</h2>
            <p className="text-muted-foreground">Le service repose sur un système automatisé d&apos;analyse.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">2) Limites techniques</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Le système dépend des données fournies par l&apos;utilisateur.</li>
              <li>Des erreurs ou omissions peuvent survenir.</li>
              <li>Certaines pannes ne sont pas détectables sans inspection physique.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">3) Absence de garantie</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Aucune garantie d&apos;exactitude parfaite des diagnostics.</li>
              <li>Aucune garantie d&apos;exhaustivité des résultats.</li>
              <li>Aucune garantie d&apos;absence d&apos;erreur.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">4) Vérification et usage raisonnable</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Faire vérifier toute information sensible par un professionnel.</li>
              <li>Ne pas prendre de décision critique sans validation.</li>
              <li>Toute utilisation abusive est interdite (tests massifs, extraction de données, etc.).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">5) Évolution du service</h2>
            <p className="text-muted-foreground">
              PitStop peut modifier l&apos;algorithme, améliorer les résultats et corriger les erreurs sans préavis.
            </p>
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

