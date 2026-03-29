import { Shield, Clock, Euro, type LucideIcon } from "lucide-react"

export const marketingFeatures: {
  icon: LucideIcon
  title: string
  description: string
}[] = [
  {
    icon: Shield,
    title: "Transparence totale",
    description: "Accédez à des estimations basées sur les prix réels du marché",
  },
  {
    icon: Clock,
    title: "Rapide et simple",
    description: "Obtenez votre devis en moins de 2 minutes",
  },
  {
    icon: Euro,
    title: "Économisez",
    description: "Comparez les options DIY et garage pour faire le bon choix",
  },
]

export const marketingSteps = [
  { number: "1", text: "Décrivez votre véhicule et le problème" },
  { number: "2", text: "Notre algorithme analyse votre demande" },
  { number: "3", text: "Recevez une estimation détaillée" },
] as const
