import type { Metadata } from "next"
import { MerciPageContent } from "@/components/merci-page-content"

export const metadata: Metadata = {
  title: "Merci d'avoir participé : PitStop",
  description: "Phase de test PitStop terminée. Merci pour votre participation.",
}

export default async function MerciPage({
  searchParams,
}: {
  searchParams?: Promise<{ from?: string }>
}) {
  const params = await searchParams
  const fromDiagnostic = params?.from === "diagnostic"

  return <MerciPageContent fromDiagnostic={fromDiagnostic} />
}
