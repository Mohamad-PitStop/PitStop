"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { MOBILE_MEDIA_QUERY } from "@/lib/responsive"

type ViewportValue = {
  isMobile: boolean
  isDesktop: boolean
}

const ViewportContext = createContext<ViewportValue>({
  isMobile: false,
  isDesktop: true,
})

export function ResponsiveProvider({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_MEDIA_QUERY)
    const apply = () => setIsMobile(mql.matches)
    apply()
    mql.addEventListener("change", apply)
    return () => mql.removeEventListener("change", apply)
  }, [])

  useEffect(() => {
    // Expose un état global CSS pour des ajustements responsive ciblés.
    document.documentElement.setAttribute("data-viewport", isMobile ? "mobile" : "desktop")
  }, [isMobile])

  const value = useMemo(
    () => ({
      isMobile,
      isDesktop: !isMobile,
    }),
    [isMobile]
  )

  return <ViewportContext.Provider value={value}>{children}</ViewportContext.Provider>
}

export function useViewport() {
  return useContext(ViewportContext)
}

