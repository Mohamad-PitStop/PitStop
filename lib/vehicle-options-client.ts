export type FetchVehicleOptsResult = { options: string[]; hasMultipleAutoTypes?: boolean; error: boolean }

/**
 * Appelle l’API de vérification des options véhicule (cascade marque → modèle → …).
 * Utilisé pour filtrer les modèles côté diagnostic et vente.
 */
export async function postVehicleOptions(body: Record<string, string>): Promise<FetchVehicleOptsResult> {
  try {
    const res = await fetch("/api/vehicle-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => null)
    if (!data || !Array.isArray(data.options)) {
      console.error("vehicle-options invalid response", data)
      return { options: [], error: true }
    }
    return { options: data.options as string[], hasMultipleAutoTypes: data.hasMultipleAutoTypes === true, error: data.error === true }
  } catch (e) {
    console.error("vehicle-options fetch error", e)
    return { options: [], error: true }
  }
}
