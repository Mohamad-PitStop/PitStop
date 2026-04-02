import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "Litige, retard et no-show — PitStop",
  description: "Annexe litige, retard et no-show PitStop.",
}

const documentText = `ANNEXE 2 — Procédure Litige & Preuves d’Annulation /
Retard / No-show
Version : 1.0
Date d’effet : 2 avril 2026
Portée : cette annexe complète les CGV (clients) et CGP (garages) PitStop.
1) Objet
Cette annexe encadre :
• le traitement des litiges liés aux réservations et acomptes ;
• les règles de preuve en cas d’annulation, retard ou no-show ;
• les modalités de contestation et d’instruction.
2) Canal officiel de réclamation
Toute réclamation doit être transmise à :
amoudialiahmad@gmail.com
La réclamation doit inclure au minimum :
• identité du demandeur ;
• email utilisé sur la plateforme ;
• référence du rendez-vous / transaction ;
• date et heure du rendez-vous ;
• description précise de la contestation ;
• pièces justificatives disponibles.
3) Processus de traitement
3.1 Réception & qualification
PitStop enregistre la demande et qualifie la nature du litige (paiement, acompte, no-show,
annulation, écart de devis, etc.).
3.2 Instruction contradictoire
Si un garage est impliqué, PitStop peut recueillir ses éléments (chronologie, justificatifs préparation,
preuves de contact, etc.).
3.3 Décision motivée
Issue possible :
• confirmation de la règle appliquée ;
• régularisation totale/partielle ;
• proposition amiable.
3.4 Clôture du dossier
Le dossier est clôturé avec conservation des éléments de preuve selon obligations légales.
4) Règles de preuve (annulation / retard / no-show)
Les éléments suivants valent commencement de preuve :

-- 1 of 3 --

• horodatages plateforme (création, annulation, tentatives) ;
• historiques de statut réservation ;
• logs applicatifs/API ;
• confirmations transactionnelles Stripe ;
• échanges écrits client/garage (emails, messages) ;
• justificatifs garage (préparation matérielle, commandes de pièces, etc.).
5) Cas contractuels et effets
5.1 Annulation > 18h avant rendez-vous
• Preuve : horodatage d’annulation comparé à l’horaire du RDV.
• Effet : remboursement automatique de l’acompte.
5.2 Annulation entre 18h et 1h avant rendez-vous
• Preuve : impossibilité d’annuler en ligne + contact direct garage.
• Effet : décision selon accord client/garage ; PitStop peut faciliter la médiation.
5.3 Annulation < 1h avant rendez-vous
• Preuve : horodatage annulation/notification.
• Effet : acompte conservé.
5.4 No-show (retard >= 45 minutes sans information)
• Preuve : heure de RDV + absence de signalement + constat garage.
• Effet : acompte conservé.
5.5 Retard > 45 minutes avec information au garage
• Preuve : trace d’appel/message + heure.
• Effet : acompte conservé ; si garage accepte quand même l’inspection, l’acompte n’est pas
déduit de la facture finale.
6) Écart entre estimation et devis final garage
L’estimation PitStop est indicative.
Le devis final garage peut varier après inspection physique (découverte technique majeure, dépose,
défaut connexe, pièce supplémentaire, sécurité, etc.).
Le garage doit justifier techniquement tout écart substantiel.
7) Erreurs techniques de paiement
En cas d’anomalie technique avérée (double débit, incohérence transactionnelle), PitStop procède à
une instruction prioritaire et peut opérer une régularisation.
8) Fraude / abus
En cas de fraude ou d’abus avéré :
• PitStop peut suspendre le traitement standard ;
• des mesures de sécurité peuvent être activées (gel temporaire, vérifications renforcées,
signalement selon cadre légal).

-- 2 of 3 --

9) Archivage et confidentialité
Les pièces de litige sont conservées pendant la durée nécessaire à la défense des droits des parties,
dans le respect de la politique de confidentialité et du droit applicable.
10) Droit applicable et juridiction
La présente annexe est soumise au droit belge.
Les litiges relèvent des juridictions compétentes de Nivelles, sous réserve des règles impératives
protectrices du consommateur.

-- 3 of 3 --`

export default function LitigeRetardNoShowPage() {
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

