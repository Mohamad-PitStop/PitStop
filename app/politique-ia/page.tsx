import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "Politique IA — PitStop",
  description: "Politique IA PitStop.",
}

const documentText = `CLAUSES SPÉCIFIQUES – INTELLIGENCE ARTIFICIELLE
1. Nature du service
Le service repose sur un système automatisé d’analyse.
2. Limites techniques
L’utilisateur reconnaît que :
• le système dépend des données fournies
• des erreurs ou omissions peuvent survenir
• certaines pannes ne peuvent être détectées sans inspection physique
3. Absence de garantie
PitStop ne garantit pas :
• l’exactitude parfaite des diagnostics
• l’exhaustivité des résultats
• l’absence d’erreur
4. Obligation de vérification
L’utilisateur s’engage à :
• faire vérifier toute information par un professionnel
• ne pas prendre de décision critique sans validation
5. Usage raisonnable
Toute utilisation abusive (tests massifs, exploitation des données) est interdite.
6. Évolution du service
PitStop se réserve le droit de :
• modifier l’algorithme

-- 1 of 2 --

• améliorer les résultats
• corriger les erreurs
sans préavis.

-- 2 of 2 --`

export default function PolitiqueIaPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{documentText}</pre>
        </div>
      </main>
    </div>
  )
}

