"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Locale } from "./types"
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, LOCALES } from "./types"
import { getFlatMessages } from "./dictionaries"

type LocaleContextValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function applyVars(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  let s = template
  for (const [k, val] of Object.entries(vars)) {
    s = s.replace(new RegExp(`{{\\s*${k}\\s*}}`, "g"), String(val))
  }
  return s
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCALE_STORAGE_KEY)
      if (raw && (LOCALES as readonly string[]).includes(raw)) {
        setLocaleState(raw as Locale)
      }
    } catch {
      /* ignore */
    }
    setReady(true)
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, l)
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = l === "nl" ? "nl" : l === "en" ? "en" : "fr"
    }
  }, [])

  useEffect(() => {
    if (!ready || typeof document === "undefined") return
    document.documentElement.lang = locale === "nl" ? "nl" : locale === "en" ? "en" : "fr"
  }, [locale, ready])

  const flat = useMemo(() => getFlatMessages(locale), [locale])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw = flat[key] ?? getFlatMessages(DEFAULT_LOCALE)[key] ?? key
      return applyVars(raw, vars)
    },
    [flat]
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useTranslation() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error("useTranslation must be used within LocaleProvider")
  }
  return ctx
}

/** Pour composants optionnellement hors provider (évite crash). */
export function useOptionalTranslation(): LocaleContextValue | null {
  return useContext(LocaleContext)
}
