"use client"

import { useTranslation } from "@/lib/i18n/locale-context"
import { cn } from "@/lib/utils"

const DOTS = ["#ff5f57", "#ffbd2e", "#28c841"]

const ROWS = [
  { name: "Vandenberghe J.", h: "09:00", s: "Vidange + filtres", ok: true },
  { name: "Maes S.", h: "10:30", s: "Contrôle freins", ok: false },
  { name: "Dupont M.", h: "14:00", s: "Diagnostic CT", ok: true },
  { name: "Peters L.", h: "16:00", s: "Remplacement pneus", ok: true },
] as const

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
}

export function LandingAgendaMock() {
  const { t } = useTranslation()
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-[#0e1d3d] px-4 py-2.5">
        <div className="flex gap-1.5">
          {DOTS.map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-full opacity-70" style={{ background: c }} />
          ))}
        </div>
        <span className="ml-1 truncate text-[11px] text-muted-foreground">{t("home.v2.agendaTitle")}</span>
      </div>
      <div className="p-5">
        <div className="mb-3 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {t("home.v2.agendaLabel")}
        </div>
        <div className="space-y-1.5">
          {ROWS.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-foreground/80"
                style={{ background: `hsl(${160 + i * 35}, 35%, 28%)` }}
              >
                {initials(r.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 truncate text-[13px] font-medium text-foreground">{r.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {r.h} · {r.s}
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide",
                  r.ok
                    ? "bg-primary/10 text-primary"
                    : "bg-amber-500/10 text-amber-400"
                )}
              >
                {r.ok ? t("home.v2.agendaStatusConfirmed") : t("home.v2.agendaStatusWaiting")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
