"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { formatBelgianMunicipalityLine } from "@/lib/belgian-postal-open-data"
import { cityMatchesBelgianMunicipalities } from "@/lib/belgian-location-match"

const DEBOUNCE_MS = 400

/**
 * Quand le code postal belge (4 chiffres) change, interroge `/api/location/belgian-postal`
 * et préremplit la commune si l’utilisateur n’a pas modifié le champ ville entre-temps.
 */
export function useBelgianPostalCityPrefill(
  postalCode: string,
  city: string,
  setCity: (value: string) => void
) {
  const cityDirtyRef = useRef(false)
  const lastFetchedPostalRef = useRef<string | null>(null)
  const requestGenRef = useRef(0)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [resolvedBelgianLookup, setResolvedBelgianLookup] = useState<{
    postal: string
    municipalities: string[]
  } | null>(null)

  const markCityEditedByUser = useCallback(() => {
    cityDirtyRef.current = true
  }, [])

  useEffect(() => {
    if (!/^\d{4}$/.test(postalCode)) {
      setResolvedBelgianLookup(null)
      if (postalCode.length < 4) lastFetchedPostalRef.current = null
      return
    }

    if (postalCode !== lastFetchedPostalRef.current) {
      cityDirtyRef.current = false
    }

    const ac = new AbortController()
    const codeForRequest = postalCode
    const gen = ++requestGenRef.current
    const timer = window.setTimeout(() => {
      void (async () => {
        setLookupLoading(true)
        try {
          const r = await fetch(`/api/location/belgian-postal?code=${encodeURIComponent(codeForRequest)}`, {
            signal: ac.signal,
          })
          const data = (await r.json().catch(() => null)) as { ok?: boolean; municipalities?: string[] } | null
          if (ac.signal.aborted) return
          const municipalities =
            data?.ok && Array.isArray(data.municipalities) ? data.municipalities.filter((x) => typeof x === "string") : []

          if (ac.signal.aborted) return
          setResolvedBelgianLookup({ postal: codeForRequest, municipalities })

          if (municipalities.length === 0) {
            lastFetchedPostalRef.current = codeForRequest
            return
          }
          if (cityDirtyRef.current) {
            lastFetchedPostalRef.current = codeForRequest
            return
          }
          const line = formatBelgianMunicipalityLine(municipalities)
          if (line) setCity(line)
          lastFetchedPostalRef.current = codeForRequest
        } catch {
          if (!ac.signal.aborted) {
            setResolvedBelgianLookup({ postal: codeForRequest, municipalities: [] })
            lastFetchedPostalRef.current = codeForRequest
          }
        } finally {
          if (gen === requestGenRef.current) setLookupLoading(false)
        }
      })()
    }, DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
      ac.abort()
    }
  }, [postalCode, setCity])

  const showBelgiumOnlyLocation = useMemo(() => {
    if (!/^\d{4}$/.test(postalCode) || lookupLoading) return false
    const applicable = resolvedBelgianLookup?.postal === postalCode ? resolvedBelgianLookup : null
    if (!applicable) return false
    if (applicable.municipalities.length === 0) return true
    const c = city.trim()
    if (c.length < 2) return false
    return !cityMatchesBelgianMunicipalities(city, applicable.municipalities)
  }, [postalCode, city, lookupLoading, resolvedBelgianLookup])

  return { markCityEditedByUser, lookupLoading, showBelgiumOnlyLocation }
}
