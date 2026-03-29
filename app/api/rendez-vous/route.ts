import { z } from "zod"

const RendezVousSchema = z.object({
  type: z.string().trim().max(40).optional(),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(30),
  postalCode: z.string().trim().min(4).max(10).optional(),
  availability: z.string().trim().max(500).optional(),
  vehicle: z
    .object({
      marque: z.string().max(80).optional(),
      modele: z.string().max(80).optional(),
      annee: z.number().int().min(1900).max(2100).optional(),
      km: z.number().int().min(0).max(10_000_000).optional(),
    })
    .optional(),
})

export async function POST(req: Request) {
  try {
    const payload = RendezVousSchema.parse(await req.json())

    console.log("Nouvelle demande de rendez-vous garage partenaire reçue")

    // Ici, on pourrait envoyer un email ou pousser la demande vers un CRM.
    // Pour l'instant, on accuse simplement réception côté serveur.

    return Response.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ ok: false, error: "Formulaire invalide." }, { status: 400 })
    }
    console.error("Erreur API rendez-vous:", error)
    return Response.json({ ok: false, error: "Erreur lors de l'enregistrement du rendez-vous" }, { status: 500 })
  }
}
