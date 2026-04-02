import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "CGP Garages — PitStop",
  description: "Conditions générales de partenariat B2B entre PitStop et les garages partenaires.",
}

export default function CgpGaragesPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4 space-y-8">
          <header className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Conditions générales de partenariat (B2B)
            </h1>
            <p className="text-muted-foreground">Version 1.0 — Date d&apos;entrée en vigueur : 2 avril 2026</p>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Objet</h2>
            <p className="text-muted-foreground">
              Ce document encadre le référencement des garages partenaires, la transmission de leads/réservations, la
              gestion des acomptes et les obligations de transparence.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Principes clés</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>PitStop agit comme intermédiaire numérique ; le garage reste seul prestataire d&apos;exécution.</li>
              <li>Les montants B2B sont exprimés HTVA, sauf mention contraire.</li>
              <li>Le garage maintient une cohérence raisonnable avec les estimations client PitStop.</li>
              <li>Tout écart substantiel doit être justifié clairement au client.</li>
              <li>Respect des règles d&apos;annulation, retard et no-show prévues contractuellement.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Conformité et litiges</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Conformité RGPD et confidentialité des informations échangées.</li>
              <li>PitStop peut suspendre/résilier en cas de fraude, abus ou atteinte à l&apos;image.</li>
              <li>Droit applicable : droit belge.</li>
              <li>Juridiction compétente : Nivelles, sauf disposition impérative contraire.</li>
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

