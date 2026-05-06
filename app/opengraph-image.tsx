import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "PitStop : diagnostic et estimation auto en Belgique"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://pitstop-diagnostic.live").replace(/\/$/, "")

const COLORS = {
  background: "#0D1B3E",
  primary: "#22C55E",
  white: "#FFFFFF",
  muted: "#94A3B8",
  outline: "rgba(255, 255, 255, 0.18)",
}

export default async function Image() {
  /** Charge le logo officiel (PNG transparent 750x750) servi par /images/pitstop-icon.png. */
  const logoSrc = `${SITE_URL}/images/pitstop-icon.png`

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px",
          background: COLORS.background,
          color: COLORS.white,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Logo + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="PitStop" width={72} height={72} />
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>
            <span style={{ color: COLORS.white }}>Pit</span>
            <span style={{ color: COLORS.primary }}>Stop</span>
          </div>
        </div>

        {/* Bloc principal */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            marginTop: "auto",
            marginBottom: 36,
          }}
        >
          <div
            style={{
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: -2,
              maxWidth: 980,
            }}
          >
            Diagnostic et estimation auto.
          </div>
          <div style={{ fontSize: 30, color: COLORS.muted, lineHeight: 1.35, maxWidth: 920 }}>
            Décrivez votre panne, recevez une estimation des coûts et trouvez un garage de confiance en Belgique.
          </div>
        </div>

        {/* Pied : URL + chips */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: COLORS.muted,
          }}
        >
          <div style={{ color: COLORS.white, fontWeight: 600 }}>pitstop-diagnostic.live</div>
          <div style={{ display: "flex", gap: 12 }}>
            {["Garages partenaires", "Belgique"].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 16px",
                  borderRadius: 9999,
                  border: `1px solid ${COLORS.outline}`,
                  color: COLORS.white,
                  fontSize: 20,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
