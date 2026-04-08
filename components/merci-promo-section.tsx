"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tag, Copy, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { buildLoginUrl } from "@/lib/login-redirect"
import { useTranslation } from "@/lib/i18n/locale-context"

type MerciPromoState =
  | { phase: "loading" }
  | { phase: "signedOut" }
  | { phase: "ready"; code: string; exhausted: boolean }
  | { phase: "error" }

export function MerciPromoSection() {
  const { t } = useTranslation()
  const [state, setState] = useState<MerciPromoState>({ phase: "loading" })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/credits/merci-promo")
      .then(async (r) => {
        const data = await r.json().catch(() => null)
        if (cancelled) return
        if (r.status === 401) {
          setState({ phase: "signedOut" })
          return
        }
        if (data?.ok && data.code) {
          setState({
            phase: "ready",
            code: data.code,
            exhausted: Boolean(data.exhausted),
          })
          return
        }
        setState({ phase: "error" })
      })
      .catch(() => {
        if (!cancelled) setState({ phase: "error" })
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function copyCode() {
    if (state.phase !== "ready") return
    try {
      await navigator.clipboard.writeText(state.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // no-op
    }
  }

  if (state.phase === "loading") {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
      </div>
    )
  }

  if (state.phase === "signedOut") {
    return (
      <div className="rounded-xl border border-primary/25 bg-primary/5 px-6 py-5 text-left space-y-3">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <Tag className="h-4 w-4 shrink-0" />
          {t("misc.merciPromoTitle")}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{t("misc.merciPromoSignedOut")}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild size="sm">
            <Link href={buildLoginUrl("/merci")}>{t("auth.signIn")}</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/inscription">{t("auth.createAccount")}</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (state.phase === "error") {
    return null
  }

  const { code, exhausted } = state

  return (
    <div className="rounded-xl border border-green-500/25 bg-green-500/5 px-6 py-5 text-left space-y-3">
      <div className="flex items-center gap-2 text-green-400 font-semibold text-sm">
        <Tag className="h-4 w-4 shrink-0" />
        {t("misc.merciPromoYourCode")}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {exhausted ? t("misc.merciPromoExhausted") : t("misc.merciPromoActive")}
      </p>
      {!exhausted && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <code className="flex-1 rounded-lg border border-border bg-muted/40 px-4 py-3 text-center font-mono text-sm font-semibold tracking-wide text-foreground break-all">
            {code}
          </code>
          <Button type="button" variant="outline" size="sm" className="shrink-0 gap-2" onClick={copyCode}>
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-400" />
                {t("misc.copied")}
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                {t("misc.copy")}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
