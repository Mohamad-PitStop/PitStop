"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, AlertTriangle } from "lucide-react"

export default function LitigePage() {
  const params = useParams<{ reservationId: string }>()
  const router = useRouter()
  const reservationId = params?.reservationId
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reservationId || message.trim().length < 10) {
      setError("Merci de détailler votre message (10 caractères minimum).")
      return
    }
    setSending(true)
    setError(null)
    try {
      const res = await fetch("/api/client/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reservationId, message }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.error || "Erreur lors de l'envoi du litige.")
        setSending(false)
        return
      }
      setSent(true)
    } catch {
      setError("Erreur réseau.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6">
          <Link href="/mes-diagnostics" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Retour à mes diagnostics
          </Link>
        </div>

        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h1 className="text-xl font-bold">Signaler un litige</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Votre acompte a été versé au garage. Si la prestation n&apos;a pas
                  été rendue conformément à ce qui était prévu, décrivez ici la
                  situation. Notre équipe étudie chaque signalement et vous
                  recontacte rapidement.
                </p>
              </div>
            </div>

            {sent ? (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-4 text-sm text-green-700 dark:text-green-400">
                Votre signalement a bien été envoyé à PitStop. Nous reviendrons
                vers vous par email dès que possible.
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={() => router.push("/mes-diagnostics")}>
                    Retour à mes diagnostics
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block text-sm font-medium" htmlFor="dispute-message">
                  Votre message
                </label>
                <textarea
                  id="dispute-message"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[160px]"
                  placeholder="Expliquez ce qui s'est passé : date, lieu, ce qui était prévu, ce qui a réellement été fait…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={4000}
                  required
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={sending || message.trim().length < 10} className="w-full">
                  {sending ? "Envoi…" : "Envoyer le litige"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Votre message est transmis à pitstopbelgique@gmail.com avec
                  les informations de votre diagnostic et de votre rendez-vous.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
