"use client"

import { useEffect, useRef, useCallback } from "react"

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

interface TurnstileOptions {
  sitekey: string
  callback: (token: string) => void
  "error-callback"?: () => void
  "expired-callback"?: () => void
  theme?: "light" | "dark" | "auto"
  size?: "normal" | "compact"
  language?: string
}

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void
  onError?: () => void
  onExpired?: () => void
  /** Ref pour pouvoir réinitialiser le widget de l'extérieur */
  widgetIdRef?: React.MutableRefObject<string | null>
}

let scriptLoaded = false
const pendingCallbacks: Array<() => void> = []

function loadTurnstileScript(onLoad: () => void) {
  if (scriptLoaded) {
    onLoad()
    return
  }
  if (document.querySelector('script[data-turnstile]')) {
    pendingCallbacks.push(onLoad)
    return
  }
  pendingCallbacks.push(onLoad)
  const script = document.createElement("script")
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad"
  script.async = true
  script.defer = true
  script.dataset.turnstile = "1"
  window.onTurnstileLoad = () => {
    scriptLoaded = true
    pendingCallbacks.splice(0).forEach((cb) => cb())
  }
  document.head.appendChild(script)
}

export function TurnstileWidget({ onSuccess, onError, onExpired, widgetIdRef }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const localWidgetId = useRef<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !siteKey) return
    // Éviter double-render
    if (localWidgetId.current) return
    const id = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: onSuccess,
      "error-callback": onError,
      "expired-callback": onExpired,
      theme: "auto",
      language: "fr",
    })
    localWidgetId.current = id
    if (widgetIdRef) widgetIdRef.current = id
  }, [siteKey, onSuccess, onError, onExpired, widgetIdRef])

  useEffect(() => {
    if (!siteKey) return
    loadTurnstileScript(renderWidget)
    return () => {
      if (localWidgetId.current && window.turnstile) {
        window.turnstile.remove(localWidgetId.current)
        localWidgetId.current = null
        if (widgetIdRef) widgetIdRef.current = null
      }
    }
  }, [siteKey, renderWidget, widgetIdRef])

  // Si pas de clé configurée (développement sans clé), ne pas afficher
  if (!siteKey) return null

  return <div ref={containerRef} className="mt-2" />
}
