"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type State = "loading" | "success" | "error"

export default function VerifierEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<State>("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) {
      setState("error")
      setErrorMessage("Lien de vérification invalide.")
      return
    }

    ;(async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
        const data = await res.json().catch(() => null)
        if (res.ok && data?.ok) {
          setState("success")
          // Rediriger vers l'accueil après 2 s
          setTimeout(() => {
            router.push("/diagnostic")
            router.refresh()
          }, 2000)
        } else {
          setState("error")
          setErrorMessage(data?.error ?? "Lien invalide ou expiré.")
        }
      } catch {
        setState("error")
        setErrorMessage("Erreur réseau. Veuillez réessayer.")
      }
    })()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-14">
        <div className="container mx-auto max-w-md px-4">
          <Card className="border-border/60 bg-card">
            <CardHeader>
              <CardTitle>Vérification de l'adresse email</CardTitle>
              <CardDescription>Activation de votre compte PitStop</CardDescription>
            </CardHeader>
            <CardContent>
              {state === "loading" && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-sm text-muted-foreground">Vérification en cours…</p>
                </div>
              )}

              {state === "success" && (
                <div className="flex flex-col items-center gap-4 py-6 animate-in fade-in duration-500">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/15">
                    <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" strokeDasharray="24" strokeDashoffset="24" style={{ animation: "dash 0.4s ease-out 0.1s forwards" }} />
                    </svg>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-semibold text-foreground">Adresse email confirmée !</p>
                    <p className="text-sm text-muted-foreground">Votre compte est actif. Redirection en cours…</p>
                  </div>
                  <div className="w-40 h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full animate-[progress_2s_linear_forwards]" />
                  </div>
                </div>
              )}

              {state === "error" && (
                <div className="flex flex-col items-center gap-5 py-6">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10">
                    <svg className="w-7 h-7 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                    </svg>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="font-semibold text-foreground">Vérification échouée</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{errorMessage}</p>
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <Button asChild>
                      <Link href="/inscription">Créer un nouveau compte</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/connexion">Se connecter</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
