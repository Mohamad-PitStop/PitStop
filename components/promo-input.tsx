"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tag, Check, X } from "lucide-react"
import { useTranslation } from "@/lib/i18n/locale-context"

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
  dismissible = true,
  showInputWhenApplied = false,
}: {
  onApply: (result: PromoResult) => void
  onClear: () => void
  applied: PromoResult | null
  /** Si false, le code appliqué ne peut pas être retiré depuis l’UI (pas de croix). */
  dismissible?: boolean
  /** Si true, le champ reste visible même quand un code est déjà appliqué (ex. saisir un autre code). */
  showInputWhenApplied?: boolean
}) {
  const { t } = useTranslation()
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
        setError(data.error ?? t("promoInput.invalidCode"))
      }
    } catch {
      setError(t("promoInput.networkError"))
    } finally {
      setLoading(false)
    }
  }

  const appliedBanner = applied ? (
    <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2">
      <Check className="h-4 w-4 text-green-400 shrink-0" />
      <span className="text-sm text-green-400 font-medium flex-1">
        {t("promoInput.appliedPrefix")} <span className="font-bold">{applied.discountLabel}</span>
      </span>
      {dismissible ? (
        <button
          type="button"
          onClick={() => {
            onClear()
            setCode("")
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t("promoInput.removeAria")}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  ) : null

  const codeField = (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Tag className="h-3.5 w-3.5" />
        {t("promoInput.label")}
      </label>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase())
            setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              validate()
            }
          }}
          placeholder={t("promoInput.placeholder")}
          className="h-9 text-sm uppercase"
          maxLength={20}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 shrink-0"
          onClick={validate}
          disabled={loading || !code.trim()}
        >
          {loading ? "…" : t("promoInput.apply")}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )

  if (applied && !showInputWhenApplied) {
    return appliedBanner
  }

  return (
    <div className="space-y-3">
      {appliedBanner}
      {(!applied || showInputWhenApplied) && codeField}
    </div>
  )
}
