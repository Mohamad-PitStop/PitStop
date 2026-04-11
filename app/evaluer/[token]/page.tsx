"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Star } from "lucide-react"
import Link from "next/link"

type ReviewState = "loading" | "ready" | "already_submitted" | "not_found" | "submitted" | "error"

export default function EvaluerPage() {
  const params = useParams()
  const token = typeof params.token === "string" ? params.token : ""

  const [state, setState] = useState<ReviewState>("loading")
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setState("not_found"); return }
    fetch(`/api/evaluer/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.alreadySubmitted) setState("already_submitted")
        else if (data.notFound) setState("not_found")
        else setState("ready")
      })
      .catch(() => setState("error"))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch(`/api/evaluer/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Erreur")
      setState("submitted")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.")
    } finally {
      setSubmitting(false)
    }
  }

  const displayRating = hoverRating || rating

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-16">
        {state === "loading" && (
          <div className="flex justify-center py-20">
            <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}

        {state === "not_found" && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-3">
              <p className="text-lg font-semibold">Lien invalide ou expiré</p>
              <p className="text-sm text-muted-foreground">Ce lien d'évaluation n'est pas valide ou a déjà été utilisé.</p>
              <Link href="/"><Button variant="outline" size="sm">Retour à l'accueil</Button></Link>
            </CardContent>
          </Card>
        )}

        {state === "already_submitted" && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-3">
              <Check className="h-10 w-10 text-green-500 mx-auto" />
              <p className="text-lg font-semibold">Avis déjà soumis</p>
              <p className="text-sm text-muted-foreground">Vous avez déjà laissé un avis pour ce rendez-vous. Merci !</p>
              <Link href="/"><Button variant="outline" size="sm">Retour à l'accueil</Button></Link>
            </CardContent>
          </Card>
        )}

        {state === "submitted" && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <Check className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-xl font-bold">Merci pour votre avis !</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Votre retour nous aide à améliorer la qualité de nos services et à valoriser les garages partenaires.
              </p>
              <Link href="/"><Button size="sm">Retour à l'accueil</Button></Link>
            </CardContent>
          </Card>
        )}

        {state === "error" && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-3">
              <p className="text-lg font-semibold text-destructive">Une erreur est survenue</p>
              <p className="text-sm text-muted-foreground">Impossible de charger ce formulaire. Veuillez réessayer.</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Réessayer</Button>
            </CardContent>
          </Card>
        )}

        {state === "ready" && (
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="space-y-6">
                <div className="text-center space-y-1">
                  <h1 className="text-xl font-bold">Évaluez votre rendez-vous</h1>
                  <p className="text-sm text-muted-foreground">Votre avis est anonyme et nous aide à améliorer nos services.</p>
                </div>

                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
                  {/* Étoiles */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Note *</label>
                    <div
                      className="flex items-center gap-1"
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          className="p-0.5 transition-transform hover:scale-110"
                          aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${
                              star <= displayRating
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/40"
                            }`}
                          />
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {rating === 1 ? "Très insatisfait" : rating === 2 ? "Insatisfait" : rating === 3 ? "Correct" : rating === 4 ? "Satisfait" : "Très satisfait"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Commentaire */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Commentaire (optionnel)</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Décrivez votre expérience…"
                      rows={4}
                      maxLength={800}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right">{comment.length}/800</p>
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={rating === 0 || submitting}
                  >
                    {submitting ? "Envoi…" : "Envoyer mon avis"}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
