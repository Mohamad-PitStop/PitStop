"use client"

import { useEffect, useId, useState } from "react"

const LOGO_SRC = "/images/pitstop-logo.png"
const VB_W = 560
const VB_H = 160
const CY = VB_H / 2
/** Largeur du motif dégradé (horizontal) ; plus large = faisceau plus étalé. */
const SWEEP_GRAD_W = 300
/** Translation X : marge avant / après le logo pour un balayage plus ample. */
const SWEEP_X0 = -SWEEP_GRAD_W - 90
const SWEEP_X1 = VB_W + 90

const FILTER_PAD = 120

/** Même géométrie pour le logo visible et pour l’image filtrée du masque (alignement pixel). */
const LOGO_IMG = {
  href: LOGO_SRC,
  x: 0,
  y: 0,
  width: VB_W,
  height: VB_H,
  preserveAspectRatio: "xMidYMid meet" as const,
}

/**
 * Logo accueil : un seul SVG (logo + lumière) — pas de Next/Image séparé pour éviter tout décalage.
 * Masque recalé sur les lettres : même viewBox, même <image> que le rendu du logo.
 */
export function LandingHeroLogo() {
  const reactId = useId().replace(/:/g, "")
  const fid = `pitstop-logo-edge-f-${reactId}`
  const mid = `pitstop-logo-edge-m-${reactId}`
  const gid = `pitstop-logo-sweep-${reactId}`

  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduceMotion(mq.matches)
    const onChange = () => setReduceMotion(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="landing-hero-logo-svg mx-auto block h-24 w-auto max-w-full md:h-32 lg:h-36 [-webkit-user-drag:none] select-none isolate [transform:translateZ(0)]"
      role="img"
      aria-label="PitStop"
    >
      <title>PitStop</title>
      <defs>
        <filter
          id={fid}
          filterUnits="userSpaceOnUse"
          x={-FILTER_PAD}
          y={-FILTER_PAD}
          width={VB_W + FILTER_PAD * 2}
          height={VB_H + FILTER_PAD * 2}
          colorInterpolationFilters="sRGB"
        >
          <feMorphology in="SourceAlpha" operator="dilate" radius="1" result="dil" />
          <feComposite in="dil" in2="SourceAlpha" operator="out" result="ring" />
          <feComponentTransfer in="ring" result="boost">
            <feFuncA type="linear" slope="1.75" intercept="0" />
          </feComponentTransfer>
          <feColorMatrix
            in="boost"
            type="matrix"
            values="0 0 0 1 0
                    0 0 0 1 0
                    0 0 0 1 0
                    0 0 0 1 0"
            result="forMask"
          />
        </filter>

        <mask
          id={mid}
          maskUnits="userSpaceOnUse"
          maskContentUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={VB_W}
          height={VB_H}
        >
          <image {...LOGO_IMG} filter={`url(#${fid})`} />
        </mask>

        <linearGradient
          id={gid}
          gradientUnits="userSpaceOnUse"
          x1={0}
          y1={CY}
          x2={SWEEP_GRAD_W}
          y2={CY}
          gradientTransform={reduceMotion ? "translate(220 0)" : undefined}
        >
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="36%" stopColor="white" stopOpacity="0" />
          <stop offset="50%" stopColor="hsl(155 100% 97%)" stopOpacity="1" />
          <stop offset="64%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
          {!reduceMotion && (
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              from={`${SWEEP_X0} 0`}
              to={`${SWEEP_X1} 0`}
              dur="18s"
              repeatCount="indefinite"
              additive="replace"
            />
          )}
        </linearGradient>
      </defs>

      {/* Logo couleur : même référence géométrique que le masque */}
      <image {...LOGO_IMG} />

      <rect
        width={VB_W}
        height={VB_H}
        fill={`url(#${gid})`}
        mask={`url(#${mid})`}
        className="landing-hero-logo-glow mix-blend-soft-light"
        style={{ opacity: reduceMotion ? 0.28 : 0.64 }}
      />
    </svg>
  )
}
