import { getSiteUrl } from "@/lib/stripe"
import { RendezVousSuccessView, type RdvSuccessPaidData } from "@/components/rendez-vous-success-view"

async function getStatus(params: { session_id?: string; payment_intent?: string }) {
  const base = getSiteUrl()
  const q = params.session_id
    ? `session_id=${encodeURIComponent(params.session_id)}`
    : params.payment_intent
      ? `payment_intent=${encodeURIComponent(params.payment_intent)}`
      : ""
  if (!q) return null
  const res = await fetch(`${base}/api/reservation/status?${q}`, { cache: "no-store" })
  return res.json() as Promise<
    | {
        ok: true
        reservation: RdvSuccessPaidData["reservation"]
        payment: RdvSuccessPaidData["payment"]
      }
    | { ok: false; error: string }
  >
}

export default async function RendezVousSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ session_id?: string; payment_intent?: string }>
}) {
  const params = await searchParams
  const sessionId = params?.session_id
  const paymentIntent = params?.payment_intent

  const data = sessionId || paymentIntent
    ? await getStatus({ session_id: sessionId, payment_intent: paymentIntent })
    : null

  const paymentComplete =
    data?.ok === true &&
    (data.payment.paymentStatus === "paid" || data.payment.paymentStatus === "succeeded")
  const isPaid = paymentComplete
  const cancelled = data?.ok === true && !paymentComplete

  const paidData = data?.ok === true && paymentComplete ? data : null
  const depositEuros = paidData ? (paidData.payment.depositAmountCents ?? 0) / 100 : null
  const priceMin = paidData ? paidData.payment.priceMinEuros ?? null : null
  const priceMax = paidData ? paidData.payment.priceMaxEuros ?? null : null

  const remainingMin = depositEuros != null && priceMin != null ? Math.max(0, priceMin - depositEuros) : null
  const remainingMax = depositEuros != null && priceMax != null ? Math.max(0, priceMax - depositEuros) : null
  const hasRemainingInfo = remainingMin != null && remainingMax != null

  const apiError = data && !data.ok ? data.error : null

  return (
    <RendezVousSuccessView
      cancelled={cancelled}
      isPaid={isPaid}
      paidData={paidData}
      depositEuros={depositEuros}
      remainingMin={remainingMin}
      remainingMax={remainingMax}
      hasRemainingInfo={hasRemainingInfo}
      apiError={apiError}
    />
  )
}
