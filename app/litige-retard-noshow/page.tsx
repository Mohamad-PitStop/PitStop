import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "Litige, retard et no-show — PitStop",
  description: "Annexe de procédure de litige et de preuves d'annulation/retard/no-show.",
}

export default function LitigeRetardNoShowPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4 space-y-8">
          <header className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Procédure litige, annulation, retard et no-show
            </h1>
            <p className="text-muted-foreground">Version 1.0 — Date d&apos;effet : 2 avril 2026</p>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Canal officiel</h2>
            <p className="text-muted-foreground">
              Toute réclamation doit être transmise à{" "}
              <a className="text-primary hover:underline" href="mailto:amoudialiahmad@gmail.com">
                amoudialiahmad@gmail.com
              </a>{" "}
              avec l&apos;identité, la référence de transaction/rendez-vous, la date/heure, la description et les preuves.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Effets selon la situation</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Annulation &gt; 18h : remboursement automatique de l&apos;acompte.</li>
              <li>Annulation entre 18h et 1h : traitement direct client/garage, médiation possible.</li>
              <li>Annulation &lt; 1h : acompte conservé.</li>
              <li>No-show (retard d&apos;au moins 45 min sans information) : acompte conservé.</li>
              <li>
                Retard &gt; 45 min avec information : acompte conservé ; intervention possible selon décision du garage.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Éléments de preuve pris en compte</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Horodatages plateforme et historiques de statut</li>
              <li>Logs applicatifs/API</li>
              <li>Confirmations Stripe</li>
              <li>Échanges écrits client/garage</li>
              <li>Justificatifs garage (préparation, commandes, etc.)</li>
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

