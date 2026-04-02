"use client"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

function PaymentFormInner({ returnUrl, buttonLabel }: { returnUrl: string; buttonLabel: string }) {
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
      setError(confirmError.message ?? "Erreur lors du paiement.")
      setIsConfirming(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full" disabled={!stripe || isConfirming}>
        {isConfirming ? "Traitement en cours…" : buttonLabel}
      </Button>
    </form>
  )
}

export function StripePaymentForm({
  clientSecret,
  returnUrl,
  buttonLabel = "Payer l'acompte",
}: {
  clientSecret: string
  returnUrl: string
  buttonLabel?: string
}) {
  if (!stripePromise) {
    return (
      <p className="text-sm text-red-400">
        Clé Stripe manquante (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).
      </p>
    )
  }

  const options = {
    clientSecret,
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
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFormInner returnUrl={returnUrl} buttonLabel={buttonLabel} />
    </Elements>
  )
}
