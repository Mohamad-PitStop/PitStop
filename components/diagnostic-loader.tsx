"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { Zap } from "lucide-react"
import { useTranslation } from "@/lib/i18n/locale-context"

interface DiagnosticLoaderProps {
  vehicle?: string
  mode?: "initial" | "followup"
}

export function DiagnosticLoader({ vehicle, mode = "initial" }: DiagnosticLoaderProps) {
  const { t } = useTranslation()
  const steps = useMemo(
    () =>
      mode === "followup"
        ? [
            { text: t("diagnosticLoader.follow1"), pct: 22 },
            { text: t("diagnosticLoader.follow2"), pct: 55 },
            { text: t("diagnosticLoader.follow3"), pct: 82 },
            { text: t("diagnosticLoader.follow4"), pct: 94 },
          ]
        : [
            { text: t("diagnosticLoader.initial1"), pct: 15 },
            { text: t("diagnosticLoader.initial2"), pct: 32 },
            { text: t("diagnosticLoader.initial3"), pct: 54 },
            { text: t("diagnosticLoader.initial4"), pct: 74 },
            { text: t("diagnosticLoader.initial5"), pct: 91 },
          ],
    [t, mode]
  )

  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t0 = setTimeout(() => setVisible(true), 20)
    const t1 = setTimeout(() => setProgress(steps[0]!.pct), 80)

    const timers: ReturnType<typeof setTimeout>[] = [t0, t1]

    steps.slice(1).forEach((step, i) => {
      const delay = (i + 1) * 2200
      const timer = setTimeout(() => {
        setStepIndex(i + 1)
        setProgress(step.pct)
      }, delay)
      timers.push(timer)
    })

    return () => timers.forEach(clearTimeout)
  }, [steps])

  useEffect(() => {
    if (visible) {
      document.documentElement.style.overflow = "hidden"
      document.body.style.overflow = "hidden"
      return () => {
        document.documentElement.style.overflow = ""
        document.body.style.overflow = ""
      }
    }
  }, [visible])

  const content = (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/96 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-6 px-6 text-center">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-[3px] border-primary/15" />
          <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-primary" />
          <div className="absolute inset-[6px] flex items-center justify-center rounded-full bg-primary/10">
            <Zap className="h-5 w-5 text-primary" strokeWidth={2} />
          </div>
        </div>

        {vehicle && (
          <p className="max-w-full truncate text-xs font-medium tracking-wider text-muted-foreground/70 uppercase">
            {vehicle}
          </p>
        )}

        <p
          key={stepIndex}
          className="min-h-[1.25rem] animate-in text-sm text-foreground/80 fade-in duration-500"
        >
          {steps[stepIndex]?.text}
        </p>

        <div className="w-full space-y-2">
          <div className="h-1 w-full overflow-hidden rounded-full bg-primary/15">
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

  return typeof document !== "undefined" ? createPortal(content, document.body) : null
}
