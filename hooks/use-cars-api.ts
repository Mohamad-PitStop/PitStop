"use client"

import { useState, useEffect, useCallback } from "react"

export type CarsDetails = {
  fuelTypes?: string[]
  transmissions?: string[]
  years?: number[]
}

export function useCarsApi() {
  const [makes, setMakes] = useState<string[]>([])
  const [models, setModels] = useState<string[]>([])
  const [details, setDetails] = useState<CarsDetails | null>(null)
  const [loadingMakes, setLoadingMakes] = useState(true)
  const [loadingModels, setLoadingModels] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoadingMakes(true)
    fetch("/api/cars/makes")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data?.ok && Array.isArray(data.makes)) setMakes(data.makes)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingMakes(false)
      })
    return () => { cancelled = true }
  }, [])

  const fetchModels = useCallback((make: string) => {
    if (!make.trim()) {
      setModels([])
      setDetails(null)
      return
    }
    setLoadingModels(true)
    setDetails(null)
    fetch(`/api/cars/models?make=${encodeURIComponent(make)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.models)) setModels(data.models)
        else setModels([])
      })
      .catch(() => setModels([]))
      .finally(() => setLoadingModels(false))
  }, [])

  const fetchDetails = useCallback((make: string, model: string) => {
    if (!make.trim() || !model.trim()) {
      setDetails(null)
      return
    }
    setLoadingDetails(true)
    fetch(
      `/api/cars/details?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok) {
          setDetails({
            fuelTypes: data.fuelTypes ?? undefined,
            transmissions: data.transmissions ?? undefined,
            years: data.years ?? undefined,
          })
        } else setDetails(null)
      })
      .catch(() => setDetails(null))
      .finally(() => setLoadingDetails(false))
  }, [])

  return {
    makes,
    models,
    details,
    loadingMakes,
    loadingModels,
    loadingDetails,
    fetchModels,
    fetchDetails,
  }
}
