export const CGV_CONSENT_KEY = "pitstop-cgv-consent-v1"
export type CgvConsentValue = "accepted" | "rejected" | null

export function readCgvConsent(): CgvConsentValue {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(CGV_CONSENT_KEY)
  return raw === "accepted" || raw === "rejected" ? raw : null
}

export function saveCgvConsent(value: Exclude<CgvConsentValue, null>) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(CGV_CONSENT_KEY, value)
  window.dispatchEvent(new Event("pitstop-cgv-consent-changed"))
}

export function hasAcceptedCgv(): boolean {
  return readCgvConsent() === "accepted"
}

