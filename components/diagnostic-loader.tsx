"use client"

import { useEffect, useState } from "react"
import { Zap } from "lucide-react"

const STEPS_INITIAL = [
  { text: "Identification du moteur…", pct: 15 },
  { text: "Analyse des symptômes décrits…", pct: 32 },
  { text: "Recherche des pannes fréquentes sur ce modèle…", pct: 54 },
  { text: "Calcul des fourchettes de prix…", pct: 74 },
  { text: "Finalisation du diagnostic…", pct: 91 },
]

const STEPS_FOLLOWUP = [
  { text: "Analyse de votre réponse…", pct: 22 },
  { text: "Affinement du diagnostic…", pct: 55 },
  { text: "Calcul des estimations finales…", pct: 82 },
  { text: "Presque prêt…", pct: 94 },
]

interface DiagnosticLoaderProps {
  vehicle?: string
  mode?: "initial" | "followup"
}

export function DiagnosticLoader({ vehicle, mode = "initial" }: DiagnosticLoaderProps) {
  const steps = mode === "followup" ? STEPS_FOLLOWUP : STEPS_INITIAL
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // fade-in au montage
    const t0 = setTimeout(() => setVisible(true), 20)
    // démarrer la première étape
    const t1 = setTimeout(() => setProgress(steps[0].pct), 80)

    const timers: ReturnType<typeof setTimeout>[] = [t0, t1]

    steps.slice(1).forEach((step, i) => {
      const delay = (i + 1) * 2200
      const t = setTimeout(() => {
        setStepIndex(i + 1)
        setProgress(step.pct)
      }, delay)
      timers.push(t)
    })

    return () => timers.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/96 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div className="w-full max-w-xs px-6 flex flex-col items-center gap-6 text-center">

        {/* Spinner custom */}
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-[3px] border-primary/15" />
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary animate-spin" />
          <div className="absolute inset-[6px] rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" strokeWidth={2} />
          </div>
        </div>

        {/* Véhicule */}
        {vehicle && (
          <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider truncate max-w-full">
            {vehicle}
          </p>
        )}

        {/* Message courant */}
        <p
          key={stepIndex}
          className="text-sm text-foreground/80 animate-in fade-in duration-500 min-h-[1.25rem]"
        >
          {steps[stepIndex].text}
        </p>

        {/* Barre de progression */}
        <div className="w-full space-y-2">
          <div className="h-1 w-full rounded-full bg-primary/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground/50 tabular-nums">{progress}%</p>
        </div>

      </div>
    </div>
  )
}
