import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "PitStop : diagnostic et estimation auto en Belgique"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "linear-gradient(135deg, #0D1B3E 0%, #1E3A8A 100%)",
          color: "white",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#F97316",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 800,
            }}
          >
            P
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>
            PitStop
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.5,
            }}
          >
            Diagnostic et estimation auto.
          </div>
          <div style={{ fontSize: 32, color: "#CBD5E1", lineHeight: 1.3 }}>
            Estimez vos réparations en quelques secondes. 1er diagnostic gratuit.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            color: "#94A3B8",
          }}
        >
          <div>pitstop-diagnostic.live</div>
          <div style={{ display: "flex", gap: 24 }}>
            <span>IA</span>
            <span>·</span>
            <span>Garages partenaires</span>
            <span>·</span>
            <span>Belgique</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
