import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "Politique IA — PitStop",
  description: "Politique IA PitStop.",
}

const documentText = `CLAUSES SPÉCIFIQUES – INTELLIGENCE ARTIFICIELLE

1. Nature du service
Le service repose sur un système automatisé d'analyse.

2. Limites techniques
L'utilisateur reconnaît que :
• le système dépend des données fournies
• des erreurs ou omissions peuvent survenir
• certaines pannes ne peuvent être détectées sans inspection physique

3. Absence de garantie
PitStop ne garantit pas :
• l'exactitude parfaite des diagnostics
• l'exhaustivité des résultats
• l'absence d'erreur

4. Obligation de vérification
L'utilisateur s'engage à :
• faire vérifier toute information par un professionnel
• ne pas prendre de décision critique sans validation

5. Usage raisonnable
Toute utilisation abusive (tests massifs, exploitation des données) est interdite.

6. Évolution du service
PitStop se réserve le droit de :
• modifier l'algorithme
• améliorer les résultats
• corriger les erreurs
sans préavis.`

export default function PolitiqueIaPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4 space-y-8">
          <header className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Politique IA</h1>
            <p className="text-muted-foreground">
              Clauses spécifiques liées à l&apos;intelligence artificielle
              <br />
              Dernière mise à jour : 2 avril 2026
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Texte intégral</h2>
            <p className="text-muted-foreground whitespace-pre-line">{documentText}</p>
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

