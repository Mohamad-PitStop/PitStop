import { generateObject } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ResultSchema = z.object({
  ok: z.boolean(),
  message: z.string().nullable(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const probleme = String(body?.probleme ?? "").trim()
    const locale = String(body?.locale ?? "fr")

    if (!probleme || probleme.length < 3) {
      return NextResponse.json({ ok: false, message: null })
    }

    const systemPrompt =
      locale === "en"
        ? "You are a strict input validator for an automotive diagnostic assistant. Your only task is to decide if the user's text is a comprehensible description of a vehicle problem or service request (any language is fine). Return ok=true if the text is understandable and vehicle-related, ok=false otherwise. If ok=false, write a short friendly message (max 1 sentence) explaining what is wrong. If ok=true, message must be null."
        : locale === "nl"
          ? "Je bent een strikte invoervalidator voor een autodiagnose-assistent. Je enige taak is te beslissen of de tekst van de gebruiker een begrijpelijke beschrijving is van een voertuigprobleem of serviceaanvraag (elke taal is OK). Geef ok=true terug als de tekst begrijpelijk en voertuiggerelateerd is, anders ok=false. Als ok=false, schrijf een korte vriendelijke melding (max 1 zin). Als ok=true, moet message null zijn."
          : "Tu es un validateur strict pour un assistant de diagnostic automobile. Ta seule tâche : décider si le texte de l'utilisateur est une description compréhensible d'un problème ou d'une demande de service sur un véhicule (toute langue est acceptée). Renvoie ok=true si le texte est compréhensible et lié à un véhicule, ok=false sinon. Si ok=false, écris un court message amical (1 phrase max) expliquant le problème. Si ok=true, message doit être null."

    const { object } = await generateObject({
      model: anthropic("claude-haiku-4-5-20251001"),
      schema: ResultSchema,
      system: systemPrompt,
      prompt: `User input: "${probleme}"`,
    })

    return NextResponse.json(object)
  } catch {
    // On failure, let the diagnostic proceed — don't block the user
    return NextResponse.json({ ok: true, message: null })
  }
}
