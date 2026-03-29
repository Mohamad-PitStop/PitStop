"use client"

import { useMemo } from "react"

export function DirectionsLink({
  address,
  origin,
  children,
  className
}: {
  address: string
  origin?: string
  children: React.ReactNode
  className?: string
}) {
  const href = useMemo(() => {
    const encodedDest = encodeURIComponent(address)
    const encodedOrigin = origin ? encodeURIComponent(origin) : ""

    const googleMaps = origin
      ? `https://www.google.com/maps/dir/?api=1&origin=${encodedOrigin}&destination=${encodedDest}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${encodedDest}`

    return googleMaps
  }, [address, origin])

  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

