import { createHash } from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const vin = searchParams.get("vin")?.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "")

  if (!vin || vin.length !== 17) {
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
  const controlSum = createHash("sha1")
    .update(`${vin}|decode|${apiKey}|${secretKey}`)
    .digest("hex")
    .substring(0, 10)

  const url = `https://api.vindecoder.eu/3.2/${apiKey}/${controlSum}/decode/${vin}.json`

  try {
    const res = await fetch(url)

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
