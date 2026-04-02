import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "Litige, retard et no-show — PitStop",
  description: "Litige, retard et no-show PitStop.",
}

export default function LitigeRetardNoShowPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4 space-y-8">
          <header className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Litige, retard et no-show
            </h1>
            <p className="text-muted-foreground">Document PDF officiel intégré tel quel.</p>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Document</h2>
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
              <iframe
                title="Litige retard no-show PitStop"
                src="/api/legal-doc?doc=litige"
                className="h-[80vh] w-full"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Si l&apos;aperçu ne s&apos;affiche pas, ouvrez le PDF directement :{" "}
              <a className="text-primary hover:underline" href="/api/legal-doc?doc=litige" target="_blank" rel="noreferrer">
                Télécharger / Ouvrir le document
              </a>
              .
            </p>
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

