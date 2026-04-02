import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "SLA — PitStop",
  description: "Annexe SLA (Service Level Agreement) de la plateforme PitStop.",
}

export default function SlaPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4 space-y-8">
          <header className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Annexe SLA (Service Level Agreement)
            </h1>
            <p className="text-muted-foreground">Version 1.0 — Date d&apos;effet : 2 avril 2026</p>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Disponibilité cible</h2>
            <p className="text-muted-foreground">
              Disponibilité mensuelle cible de la plateforme : 99,5 % (engagement de moyens), hors maintenance
              planifiée, causes tierces et force majeure.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Incidents et prise en charge</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>P1 (critique) : prise en charge cible &lt; 1 heure</li>
              <li>P2 (majeur) : prise en charge cible &lt; 4 heures</li>
              <li>P3 (mineur) : prise en charge cible &lt; 1 jour ouvré</li>
              <li>P4 (cosmétique/évolution) : intégré au backlog</li>
            </ul>
            <p className="text-muted-foreground">
              Les délais de résolution dépendent de la cause racine, de la complexité technique et des dépendances
              tierces.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Sécurité et journalisation</h2>
            <p className="text-muted-foreground">
              PitStop met en place des mesures raisonnables de sécurité opérationnelle (contrôles d&apos;accès,
              journalisation, protections anti-rejeu sur flux critiques) et conserve les journaux techniques nécessaires
              au diagnostic incident et à la preuve des opérations contractuelles.
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

