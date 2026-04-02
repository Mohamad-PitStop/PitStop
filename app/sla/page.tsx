import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "SLA — PitStop",
  description: "SLA PitStop.",
}

const documentText = `ANNEXE 1 — SLA (Service Level Agreement)
Plateforme PitStop (services numériques)
Version : 1.0
Date d'effet : 2 avril 2026
Portée : cette annexe complète les CGV (clients) et CGP (garages) PitStop.

1) Objet
Le présent SLA définit les niveaux de service cibles de la plateforme PitStop (disponibilité, incidents, délais de prise en charge, maintenance, communication) pour les parcours actifs du site.

2) Périmètre fonctionnel
Le SLA couvre la disponibilité technique des fonctions suivantes :
• consultation des pages publiques PitStop ;
• authentification, espace profil, gestion crédits ;
• parcours diagnostic et parcours rendez-vous ;
• APIs internes nécessaires au fonctionnement applicatif.
Ne sont pas couverts comme obligations de résultat :
• la disponibilité d'infrastructures tierces (Stripe, hébergeur, DNS, réseau mobile/opérateur, services Google, etc.) ;
• les interruptions dues à la force majeure ;
• les indisponibilités causées par des actions malveillantes externes ou par une mauvaise configuration côté utilisateur.

3) Disponibilité cible
• Disponibilité mensuelle cible : 99,5 % (engagement de moyens).
• La disponibilité est calculée sur le mois civil, hors :
- maintenances planifiées annoncées ;
- incidents imputables à des prestataires tiers ;
- force majeure.

4) Maintenance
4.1 Maintenance planifiée
PitStop peut effectuer des maintenances planifiées (correctives, préventives, évolutives).
Sauf urgence, information préalable communiquée sur le site ou par canal approprié.
4.2 Maintenance urgente
En cas de faille sécurité, risque de corruption des données ou indisponibilité critique, PitStop peut intervenir sans préavis.

5) Classification des incidents
• P1 (Critique) : indisponibilité complète du service principal, paiement impossible, panne bloquante généralisée.
• P2 (Majeur) : fonctionnalité centrale indisponible pour une partie significative des utilisateurs.
• P3 (Mineur) : dégradation non bloquante avec contournement possible.
• P4 (Cosmétique/Évolution) : défaut visuel ou amélioration non urgente.

6) Délais cibles de prise en charge (engagement de moyens)
• P1 : < 1 heure
• P2 : < 4 heures
• P3 : < 1 jour ouvré
• P4 : intégration au backlog de maintenance
Les délais de résolution dépendent de la cause racine, de la complexité technique et des dépendances tierces.

7) Communication incident
Pour incident P1/P2, PitStop communique dans un délai raisonnable :
• la nature de l'incident ;
• les impacts connus ;
• les actions de remédiation en cours ;
• le statut de retour au nominal.

8) Sécurité opérationnelle
PitStop met en place des mesures raisonnables de sécurité :
• journalisation des événements sensibles ;
• contrôles d'accès administratifs ;
• protections anti-rejeu sur flux critiques de paiement ;
• contrôles de cohérence et de plafonnement sur opérations sensibles.

9) Sauvegarde et journalisation
PitStop conserve des journaux techniques nécessaires :
• au diagnostic incident ;
• à la sécurité ;
• à la preuve des opérations contractuelles (dans les limites légales et de confidentialité).

10) Limites et exclusions
Le SLA constitue un engagement de moyens, non une garantie absolue d'absence d'interruption.
Aucun niveau de service ne peut être opposé pour des causes externes hors contrôle raisonnable de PitStop.

11) Révision du SLA
PitStop peut adapter le présent SLA pour raisons techniques, légales ou de sécurité, avec publication de la nouvelle version.`

export default function SlaPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4 space-y-8">
          <header className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">SLA</h1>
            <p className="text-muted-foreground">
              Annexe 1 — Service Level Agreement
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

