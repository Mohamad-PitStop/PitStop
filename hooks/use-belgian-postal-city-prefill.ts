"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { formatBelgianMunicipalityLine } from "@/lib/belgian-postal-open-data"

const DEBOUNCE_MS = 400

/**
 * Quand le code postal belge (4 chiffres) change, interroge `/api/location/belgian-postal`
 * et préremplit la commune si l’utilisateur n’a pas modifié le champ ville entre-temps.
 */
export function useBelgianPostalCityPrefill(postalCode: string, setCity: (value: string) => void) {
  const cityDirtyRef = useRef(false)
  const lastFetchedPostalRef = useRef<string | null>(null)
  const requestGenRef = useRef(0)
  const [lookupLoading, setLookupLoading] = useState(false)

  const markCityEditedByUser = useCallback(() => {
    cityDirtyRef.current = true
  }, [])

  useEffect(() => {
    if (!/^\d{4}$/.test(postalCode)) {
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
          if (!data?.ok || !Array.isArray(data.municipalities) || data.municipalities.length === 0) {
            lastFetchedPostalRef.current = codeForRequest
            return
          }
          if (cityDirtyRef.current) {
            lastFetchedPostalRef.current = codeForRequest
            return
          }
          const line = formatBelgianMunicipalityLine(data.municipalities)
          if (line) setCity(line)
          lastFetchedPostalRef.current = codeForRequest
        } catch {
          if (!ac.signal.aborted) lastFetchedPostalRef.current = codeForRequest
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

  return { markCityEditedByUser, lookupLoading }
}
