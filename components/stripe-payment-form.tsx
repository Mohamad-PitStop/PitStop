"use client"

import { useMemo, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/locale-context"

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

function PaymentFormInner({
  returnUrl,
  buttonLabel,
}: {
  returnUrl: string
  buttonLabel: string
}) {
  const { t } = useTranslation()
  const stripe = useStripe()
  const elements = useElements()
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setIsConfirming(true)
    setError(null)
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    })
    if (confirmError) {
      setError(confirmError.message ?? t("stripeForm.paymentErrorFallback"))
      setIsConfirming(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full" disabled={!stripe || isConfirming}>
        {isConfirming ? t("stripeForm.processing") : buttonLabel}
      </Button>
    </form>
  )
}

export function StripePaymentForm({
  clientSecret,
  returnUrl,
  buttonLabel,
}: {
  clientSecret: string
  returnUrl: string
  /** Libellé du bouton de paiement (obligatoire : varie selon l’écran / la langue). */
  buttonLabel: string
}) {
  const { t, locale } = useTranslation()

  const stripeLocale = (locale === "nl" ? "nl" : locale === "en" ? "en" : "fr") as "fr" | "en" | "nl"

  const options = useMemo(
    () => ({
      clientSecret,
      locale: stripeLocale,
      appearance: {
        theme: "stripe" as const,
        variables: {
          borderRadius: "8px",
          colorBackground: "#E8EEF8",
          colorText: "#0D1B3E",
          colorTextSecondary: "#1a2d5a",
          colorTextPlaceholder: "#6b80a8",
          colorPrimary: "#22C55E",
          colorDanger: "#ef4444",
        },
      },
    }),
    [clientSecret, stripeLocale]
  )

  if (!stripePromise) {
    return <p className="text-sm text-red-400">{t("stripeForm.missingPublishableKey")}</p>
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFormInner returnUrl={returnUrl} buttonLabel={buttonLabel} />
    </Elements>
  )
}
