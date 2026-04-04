"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tag, Check, X } from "lucide-react"

export type PromoResult = {
  promoId: string
  code: string
  discountLabel: string
  discountType: "percent" | "fixed_cents"
  discountValue: number
}

export function PromoInput({
  onApply,
  onClear,
  applied,
}: {
  onApply: (result: PromoResult) => void
  onClear: () => void
  applied: PromoResult | null
}) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function validate() {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/promo/validate?code=${encodeURIComponent(trimmed)}`)
      const data = await res.json()
      if (data.ok) {
        onApply({
          promoId: data.promoId,
          code: trimmed,
          discountLabel: data.discountLabel,
          discountType: data.discountType,
          discountValue: data.discountValue,
        })
        setCode("")
      } else {
        setError(data.error ?? "Code invalide.")
      }
    } catch {
      setError("Erreur réseau. Réessayez.")
    } finally {
      setLoading(false)
    }
  }

  if (applied) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2">
        <Check className="h-4 w-4 text-green-400 shrink-0" />
        <span className="text-sm text-green-400 font-medium flex-1">
          Code promo appliqué : <span className="font-bold">{applied.discountLabel}</span>
        </span>
        <button
          type="button"
          onClick={() => { onClear(); setCode("") }}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Supprimer le code promo"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Tag className="h-3.5 w-3.5" />
        Code promo
      </label>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null) }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); validate() } }}
          placeholder="Ex: ABCD12"
          className="h-9 text-sm font-mono uppercase"
          maxLength={6}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 shrink-0"
          onClick={validate}
          disabled={loading || !code.trim()}
        >
          {loading ? "…" : "Appliquer"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
