import { createHash } from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawVin = searchParams.get("vin")
  const vin = rawVin?.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "") ?? ""

  // Strict VIN validation (17 chars, no I/O/Q)
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    return Response.json(
      { ok: false, error: "VIN invalide (17 caractères alphanumériques requis)" },
      { status: 400 }
    )
  }

  const apiKey = process.env.VINDECODER_API_KEY
  const secretKey = process.env.VINDECODER_SECRET_KEY

  if (!apiKey || !secretKey) {
    return Response.json(
      { ok: false, error: "VIN decoder non configuré côté serveur" },
      { status: 503 }
    )
  }

  // Calcul du control sum : substr(sha1("$vin|decode|$apiKey|$secretKey"), 0, 10)
  // SHA-1 is required by the vindecoder.eu API protocol and is used only as a
  // non-secret control checksum, not as a password hash. // lgtm[js/weak-cryptographic-algorithm, js/insufficient-password-hash]
  const controlSum = createHash("sha1") // lgtm[js/weak-cryptographic-algorithm]
    .update(`${vin}|decode|${apiKey}|${secretKey}`)
    .digest("hex")
    .substring(0, 10)

  // Build the URL from a fixed origin and encoded path segments
  const targetUrl = new URL("https://api.vindecoder.eu")
  targetUrl.pathname = `/3.2/${encodeURIComponent(apiKey)}/${encodeURIComponent(controlSum)}/decode/${encodeURIComponent(vin)}.json`

  if (targetUrl.hostname !== "api.vindecoder.eu" || targetUrl.protocol !== "https:") {
    return Response.json({ ok: false, error: "Invalid request URL" }, { status: 500 })
  }

  try {
    const res = await fetch(targetUrl)

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.error("[vin/decode] vindecoder error:", res.status, body)
      return Response.json({ ok: false, error: "Erreur de l'API vindecoder.eu" }, { status: 502 })
    }

    const data = await res.json()
    const decode: { label: string; value: string | number | null }[] = data?.decode ?? []

    const get = (label: string): string | null => {
      const found = decode.find((d) => d.label === label)
      return found?.value != null && found.value !== "" ? String(found.value) : null
    }

    return Response.json({
      ok: true,
      make: get("Make"),
      model: get("Model"),
      year: get("Model Year"),
      fuel: get("Fuel Type - Primary"),
      transmission: get("Transmission"),
      engineDisplacement: get("Engine Displacement (ccm)"),
      power: get("Power (HP)"),
      bodyType: get("Body Type"),
      numberOfDoors: get("Number of Doors"),
    })
  } catch (err) {
    console.error("[vin/decode] fetch error:", err)
    return Response.json(
      { ok: false, error: "Impossible de contacter vindecoder.eu" },
      { status: 502 }
    )
  }
}
